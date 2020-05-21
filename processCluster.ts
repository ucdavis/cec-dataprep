import { getPreciseDistance } from 'geolib';
import knex from 'knex';
import { CenterOfBiomassSum } from 'models/shared';
import OSRM = require('osrm');
import pg from 'pg';
import { Pixel, PixelClass, PixelVariables, PixelVariablesClass } from './models/pixel';
import { TreatedCluster } from './models/treatedcluster';
import { sumBiomass, sumNumberOfTrees, sumPixel } from './pixelCalculations';
import { processClearcut } from './treatments/clearcut';

const PG_DECIMAL_OID = 1700;
pg.types.setTypeParser(PG_DECIMAL_OID, parseFloat);

export const processCluster = async (
  pixels: Pixel[],
  treatmentId: number,
  treatmentName: string,
  osrm: OSRM,
  db: knex
): Promise<TreatedCluster> => {
  return new Promise(async (resolve, reject) => {
    const metersToFeetConstant = 3.28084;
    const metersToAcresConstant = 0.00024711;
    const pixelsToAcreConstant = 30 * 30 * metersToAcresConstant;
    const centerOfBiomassSum: CenterOfBiomassSum = {
      lat: 0,
      lng: 0,
      biomassSum: 0
    };
    try {
      switch (treatmentName) {
        case 'clearcut':
          pixels = processClearcut(pixels, centerOfBiomassSum);
          break;
        default:
          throw new Error('Unknown treatment option: ' + treatmentName);
      }
    } catch (err) {
      reject(err);
      return;
    }
    const centerOfBiomassLat = centerOfBiomassSum.lat / centerOfBiomassSum.biomassSum;
    const centerOfBiomassLng = centerOfBiomassSum.lng / centerOfBiomassSum.biomassSum;

    const options: OSRM.NearestOptions = {
      coordinates: [[centerOfBiomassLng, centerOfBiomassLat]]
    };

    await osrm.nearest(options, async (err, response) => {
      const landing = {
        latitude: response.waypoints[0].location[1],
        longitude: response.waypoints[0].location[0]
      };
      // get distance between pixel and landing site
      let centerOfBiomassDistanceToLanding = response.waypoints[0].distance;
      centerOfBiomassDistanceToLanding = centerOfBiomassDistanceToLanding * metersToFeetConstant; // feet

      const landingElevationFromDb: Pixel[] = await db
        .table('pixels')
        .whereBetween('x', [landing.longitude - 0.005, landing.longitude + 0.005])
        .whereBetween('y', [landing.latitude - 0.005, landing.latitude + 0.005]);
      if (landingElevationFromDb.length === 0 || !landingElevationFromDb[0]) {
        reject('No elevation for landing site found.');
        return;
      }

      let landingElevation = landingElevationFromDb[0]?.elevation;
      landingElevation = landingElevation * metersToFeetConstant; // put landing elevation in feet

      const area = pixels.length * pixelsToAcreConstant; // pixels are 30m^2, area needs to be in acres

      const centerOfBiomassPixel: Pixel[] = await db
        .table('pixels')
        .whereBetween('x', [centerOfBiomassLng - 0.005, centerOfBiomassLng + 0.005])
        .whereBetween('y', [centerOfBiomassLat - 0.005, centerOfBiomassLat + 0.005]);
      if (centerOfBiomassPixel.length === 0 || !centerOfBiomassPixel[0]) {
        reject('No elevation for center of biomass found.');
        return;
      }
      const centerOfBiomassElevation = centerOfBiomassPixel[0].elevation * metersToFeetConstant;

      // initialize sum with important variables, 0 everything else
      let pixelSummation = new PixelVariablesClass();
      pixelSummation = {
        ...pixelSummation,
        cluster_no: pixels[0].cluster_no,
        county: pixels[0].county,
        sit_raster: pixels[0].sit_raster,
        land_use: pixels[0].land_use
      };

      // https://ucdavis.app.box.com/file/553138812702
      const t = 50000; // payload of equipment delivering biomass in lbs
      let totalYardingDistance = 0;
      let totalNumTrips = 0;

      pixels.forEach((p, i) => {
        pixelSummation = sumPixel(pixelSummation, p);
        // get distance between pixel and landing site
        let distance = getPreciseDistance(landing, {
          latitude: p.y,
          longitude: p.x
        }); // meters
        distance = distance * metersToFeetConstant; // feet
        const biomass = sumBiomass(p) * 2000; // pounds
        const numTrips = Math.ceil(biomass / t);
        totalNumTrips += numTrips;
        totalYardingDistance += 2 * 1 * distance * numTrips; // feet
      });

      const meanYardingDistance = totalYardingDistance / totalNumTrips;

      console.log(
        `meanYarding: ${meanYardingDistance}, totalYarding: ${totalYardingDistance}, numTrips: ${totalNumTrips}`
      );
      const averageSlope =
        Math.abs((landingElevation - centerOfBiomassElevation) / centerOfBiomassDistanceToLanding) *
        100;

      const output: TreatedCluster = {
        treatmentid: treatmentId,
        landing_lng: landing.longitude,
        landing_lat: landing.latitude,
        landing_elevation: landingElevation,
        center_lng: centerOfBiomassLng,
        center_lat: centerOfBiomassLat,
        center_elevation: centerOfBiomassElevation,
        slope: averageSlope,
        area,
        mean_yarding: meanYardingDistance,

        ...pixelSummation
      };
      resolve(output);
    });
  });
};

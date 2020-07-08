import { findNearest, getBoundsOfDistance, getPreciseDistance } from 'geolib';
import knex from 'knex';
import { CenterOfBiomassSum } from 'models/shared';
import OSRM from 'osrm';
import pg from 'pg';
import { Pixel, PixelVariablesClass } from './models/pixel';
import { TreatedCluster } from './models/treatedcluster';
import {
  convertClusterUnits,
  metersToFeetConstant,
  pixelsToAcreConstant,
  sumBiomass,
  sumPixel
} from './pixelCalculations';
import { processBiomassSalvage } from './treatments/biomassSalvage';
import { processClearcut } from './treatments/clearcut';
import {
  processCommercialThin,
  processCommericalThinChipTreeRemoval
} from './treatments/commercialThin';
import { processGroupSelection } from './treatments/groupSelection';
import { processSelection, processSelectionChipTreeRemoval } from './treatments/selection';
import {
  processTimberSalvage,
  processTimberSalvageChipTreeRemoval
} from './treatments/timberSalvage';

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
    const centerOfBiomassSum: CenterOfBiomassSum = {
      lat: 0,
      lng: 0,
      biomassSum: 0
    };
    try {
      switch (treatmentName) {
        case 'clearcut':
          pixels = processClearcut(pixels, centerOfBiomassSum, 'clearcut');
          break;
        case 'commercialThin':
          pixels = processCommercialThin(pixels, centerOfBiomassSum);
          break;
        case 'commercialThinChipTreeRemoval':
          pixels = processCommericalThinChipTreeRemoval(pixels, centerOfBiomassSum);
          break;
        case 'timberSalvage':
          pixels = processTimberSalvage(pixels, centerOfBiomassSum);
          break;
        case 'timberSalvageChipTreeRemoval':
          pixels = processTimberSalvageChipTreeRemoval(pixels, centerOfBiomassSum);
          break;
        case 'selection':
          pixels = processSelection(pixels, centerOfBiomassSum, 'selection');
          break;
        case 'selectionChipTreeRemoval':
          pixels = processSelectionChipTreeRemoval(pixels, centerOfBiomassSum);
          break;
        case 'tenPercentGroupSelection':
          pixels = processGroupSelection(pixels, centerOfBiomassSum, 10);
          break;
        case 'twentyPercentGroupSelection':
          pixels = processGroupSelection(pixels, centerOfBiomassSum, 20);
          break;
        case 'biomassSalvage':
          pixels = processBiomassSalvage(pixels, centerOfBiomassSum);
          break;
        default:
          throw new Error('Unknown treatment option: ' + treatmentName);
      }
      if (centerOfBiomassSum.biomassSum < 1) {
        throw new Error(`No useable biomass found in cluster under ${treatmentName}.`);
      }
    } catch (err) {
      reject(err);
      return;
    }

    const centerOfBiomassLat = centerOfBiomassSum.lat / centerOfBiomassSum.biomassSum;
    const centerOfBiomassLng = centerOfBiomassSum.lng / centerOfBiomassSum.biomassSum;
    // console.log(
    // `${treatmentName}: lat: ${centerOfBiomassLat}, lng: ${centerOfBiomassLng}, sum: ${centerOfBiomassSum.biomassSum}`
    // );

    const options: OSRM.NearestOptions = {
      coordinates: [[centerOfBiomassLng, centerOfBiomassLat]]
    };
    console.log(`running osrm for treatment ${treatmentName}...`);
    await osrm.nearest(options, async (err, response) => {
      const landing = {
        latitude: response.waypoints[0].location[1],
        longitude: response.waypoints[0].location[0]
      };
      // get distance between pixel and landing site
      let centerOfBiomassDistanceToLanding = response.waypoints[0].distance;
      centerOfBiomassDistanceToLanding = centerOfBiomassDistanceToLanding * metersToFeetConstant; // feet

      const bounds = getBoundsOfDistance(
        { latitude: landing.latitude, longitude: landing.longitude },
        1000
      );
      const closestPixelsToLanding: Pixel[] = await db
        .table('butte_pixels')
        .select('elevation', 'x', 'y')
        .whereBetween('y', [bounds[0].latitude, bounds[1].latitude])
        .andWhereBetween('x', [bounds[0].longitude, bounds[1].longitude]);
      if (closestPixelsToLanding.length === 0 || !closestPixelsToLanding[0]) {
        reject('No elevation for landing site found.');
        return;
      }
      const nearestPixel: any = findNearest(
        { latitude: landing.latitude, longitude: landing.longitude },
        closestPixelsToLanding.map(pixel => {
          return { latitude: pixel.y, longitude: pixel.x, elevation: pixel.elevation };
        })
      );
      let landingElevation = nearestPixel.elevation;
      landingElevation = landingElevation * metersToFeetConstant; // put landing elevation in feet
      const area = pixels.length * pixelsToAcreConstant; // pixels are 30m^2, area needs to be in acres

      const boundsOnCenterOfBiomass = getBoundsOfDistance(
        { latitude: landing.latitude, longitude: landing.longitude },
        1000
      );
      const closestPixelsToCenterOfBiomass: Pixel[] = await db
        .table('butte_pixels')
        .select('elevation', 'x', 'y')
        .whereBetween('y', [
          boundsOnCenterOfBiomass[0].latitude,
          boundsOnCenterOfBiomass[1].latitude
        ])
        .andWhereBetween('x', [
          boundsOnCenterOfBiomass[0].longitude,
          boundsOnCenterOfBiomass[1].longitude
        ]);
      if (closestPixelsToCenterOfBiomass.length === 0 || !closestPixelsToCenterOfBiomass[0]) {
        reject('No elevation for center of biomass found.');
        return;
      }
      const nearestPixelTocenterOfBiomass: any = findNearest(
        { latitude: centerOfBiomassLat, longitude: centerOfBiomassLng },
        closestPixelsToCenterOfBiomass.map(pixel => {
          return { latitude: pixel.y, longitude: pixel.x, elevation: pixel.elevation };
        })
      );
      const centerOfBiomassElevation =
        nearestPixelTocenterOfBiomass.elevation * metersToFeetConstant;

      // initialize sum with important variables, 0 everything else
      let pixelSummation = new PixelVariablesClass();
      pixelSummation = {
        ...pixelSummation,
        cluster_no: pixels[0].cluster_no,
        county: pixels[0].county,
        sit_raster: pixels[0].sit_raster,
        land_use: pixels[0].land_use,
        forest_type: pixels[0].forest_type
      };

      // https://ucdavis.app.box.com/file/553138812702
      const t = 50000; // payload of equipment delivering biomass in lbs
      let totalYardingDistance = 0;
      let totalNumTrips = 0;

      pixels.forEach((p, i) => {
        // pixel summation is the sum of each pixel
        // and each pixel is in tons/acre, trees/acre, etc
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

      // console.log(
      //   `meanYarding: ${meanYardingDistance}, totalYarding: ${totalYardingDistance}, numTrips: ${totalNumTrips}`
      // );
      const averageSlope =
        Math.abs((landingElevation - centerOfBiomassElevation) / centerOfBiomassDistanceToLanding) *
        100;

      // convert from summation of (biomass/acre) to total per acre
      const clusterBiomassData = convertClusterUnits(pixelSummation);
      // console.log('BIOMASS DATA:');
      // console.log(JSON.stringify(clusterBiomassData));

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
        year: 2016, // TODO: update when pixel data actually has years

        ...clusterBiomassData
      };
      resolve(output);
    });
  });
};

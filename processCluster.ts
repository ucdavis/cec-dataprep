import { getPreciseDistance } from 'geolib';
import knex from 'knex';
import { CenterOfBiomassSum } from 'models/shared';
import OSRM from 'osrm';
import pg from 'pg';
import { getElevation } from './elevation';
import { Pixel, PixelVariablesClass } from './models/pixel';
import { TreatedCluster } from './models/treatedcluster';
import {
  convertClusterUnits,
  metersToFeetConstant,
  mode,
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
  txn: knex.Transaction
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
    // console.log(`running osrm for treatment ${treatmentName}...`);
    await osrm.nearest(options, async (err, response) => {
      const landing = {
        latitude: response.waypoints[0].location[1],
        longitude: response.waypoints[0].location[0]
      };
      // get distance between pixel and landing site
      let centerOfBiomassDistanceToLanding = response.waypoints[0].distance;
      centerOfBiomassDistanceToLanding = centerOfBiomassDistanceToLanding * metersToFeetConstant; // feet

      // get landing elevation
      const landingElevationInMeters = await getElevation(landing.latitude, landing.longitude);
      const landingElevation = landingElevationInMeters * metersToFeetConstant;

      const area = pixels.length * pixelsToAcreConstant; // pixels are 30m^2, area needs to be in acres

      const centerOfBiomassElevationInMeters = await getElevation(centerOfBiomassLat, centerOfBiomassLng);
      const centerOfBiomassElevation = centerOfBiomassElevationInMeters * metersToFeetConstant;

      // initialize sum with important variables, 0 everything else
      let pixelSummation = new PixelVariablesClass();
      pixelSummation = {
        ...pixelSummation,
        cluster_no: pixels[0].cluster_no,
        county_name: pixels[0].county_name,
        land_use: pixels[0].land_use,
        site_class: mode(pixels.map(p => p.site_class)), // get most common site class
        forest_type: mode(pixels.map(p => p.forest_type)) // and forest type
      };

      // https://ucdavis.app.box.com/file/553138812702
      let totalBiomassDistance = 0;
      let totalBiomass = 0;

      pixels.forEach((p, i) => {
        // pixel summation is the sum of each pixel
        // and each pixel is in tons/acre, trees/acre, etc
        pixelSummation = sumPixel(pixelSummation, p);
        // get distance between pixel and landing site
        let distance = getPreciseDistance(landing, {
          latitude: p.lat,
          longitude: p.lng
        }); // meters
        distance = distance * metersToFeetConstant; // feet
        const biomass = sumBiomass(p) * 2000; // pounds
        totalBiomass += biomass;
        totalBiomassDistance += distance * biomass; // feet
      });

      // when we use this in the back end, multiply meanYardingDistance * SQRT(1+slope^2)
      // for ground and cable
      const meanYardingDistance = totalBiomassDistance / totalBiomass;

      const averageSlope =
        Math.abs((landingElevation - centerOfBiomassElevation) / centerOfBiomassDistanceToLanding) *
        100;

      // convert from summation of (biomass/acre) to total per acre
      const clusterBiomassData = convertClusterUnits(pixelSummation, pixels.length);

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

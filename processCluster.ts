import { runFrcs } from '@ucdavis/frcs';
import { InputVarMod, OutputVarMod } from '@ucdavis/frcs/out/systems/frcs.model';
import { getPreciseDistance } from 'geolib';
import knex from 'knex';
import OSRM = require('osrm');
import pg from 'pg';
import {
  calcRemovalsCT,
  calcRemovalsLLT,
  calcRemovalsSLT,
  calcTreeVolCT,
  calcTreeVolLLT,
  calcTreeVolSLT,
  sumBiomass,
  sumNumberOfTrees,
  sumPixel
} from './frcsInputCalculations';
import { HarvestCost } from './models/harvestCost';
import { Pixel } from './models/pixel';
import { TreatedCluster } from './models/treatedcluster';
import { clearcut } from './treatments';

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
    const centerOfBiomassSum = {
      lat: 0,
      lng: 0,
      biomassSum: 0
    };
    try {
      pixels = pixels.map(pixel => {
        switch (treatmentName) {
          case 'clearcut':
            pixel = clearcut(pixel);
            break;
          default:
            throw new Error('Unknown treatment option: ' + treatmentName);
        }
        const biomassInPixel = sumBiomass(pixel);
        centerOfBiomassSum.lat += pixel.y * biomassInPixel;
        centerOfBiomassSum.lng += pixel.x * biomassInPixel;
        centerOfBiomassSum.biomassSum += biomassInPixel;
        return pixel;
      });
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

      let pixelSummation = new Pixel();

      // https://ucdavis.app.box.com/file/553138812702
      const t = 50000; // payload of equipment delivering biomass in lbs
      let totalYardingDistance = 0;

      pixels.forEach((p, i) => {
        pixelSummation = sumPixel(pixelSummation, p);
        // get distance between pixel and landing site
        let distance = getPreciseDistance(landing, {
          latitude: p.y,
          longitude: p.x
        }); // meters
        distance = distance * metersToFeetConstant; // feet
        const biomass = sumBiomass(p) * 2000; // pounds
        totalYardingDistance += 2 * 1 * distance * Math.ceil(biomass / t); // feet
      });

      const averageSlope =
        Math.abs((landingElevation - centerOfBiomassElevation) / centerOfBiomassDistanceToLanding) *
        100;

      const output: TreatedCluster = {
        cluster_no: pixelSummation.cluster_no,
        treatmentid: treatmentId,
        landing_lng: landing.longitude,
        landing_lat: landing.latitude,
        landing_elevation: landingElevation,
        center_lng: centerOfBiomassLng,
        center_lat: centerOfBiomassLat,
        center_elevation: centerOfBiomassElevation,
        slope: averageSlope,
        area,
        total_yarding: totalYardingDistance,
        df_ele_cnty_name: pixelSummation.df_ele_cnty_name,
        bmcwn_0: pixelSummation.bmcwn_0,
        bmcwn_15: pixelSummation.bmcwn_15,
        bmcwn_2: pixelSummation.bmcwn_2,
        bmcwn_25: pixelSummation.bmcwn_25,
        bmcwn_35: pixelSummation.bmcwn_35,
        bmcwn_40: pixelSummation.bmcwn_40,
        bmcwn_7: pixelSummation.bmcwn_7,
        bmfol_0: pixelSummation.bmfol_0,
        bmfol_15: pixelSummation.bmfol_15,
        bmfol_2: pixelSummation.bmfol_2,
        bmfol_25: pixelSummation.bmfol_25,
        bmfol_35: pixelSummation.bmfol_35,
        bmfol_40: pixelSummation.bmfol_40,
        bmfol_7: pixelSummation.bmfol_7,
        bmstm_0: pixelSummation.bmstm_0,
        bmstm_15: pixelSummation.bmstm_15,
        bmstm_2: pixelSummation.bmstm_2,
        bmstm_25: pixelSummation.bmstm_25,
        bmstm_35: pixelSummation.bmstm_35,
        bmstm_40: pixelSummation.bmstm_40,
        bmstm_7: pixelSummation.bmstm_7,
        sng_0: pixelSummation.sng_0,
        sng_15: pixelSummation.sng_15,
        sng_2: pixelSummation.sng_2,
        sng_25: pixelSummation.sng_25,
        sng_35: pixelSummation.sng_35,
        sng_40: pixelSummation.sng_40,
        sng_7: pixelSummation.sng_7,
        tpa_0: pixelSummation.tpa_0,
        tpa_15: pixelSummation.tpa_15,
        tpa_2: pixelSummation.tpa_2,
        tpa_25: pixelSummation.tpa_25,
        tpa_35: pixelSummation.tpa_35,
        tpa_40: pixelSummation.tpa_40,
        tpa_7: pixelSummation.tpa_7
      };
      resolve(output);
    });
  });
};

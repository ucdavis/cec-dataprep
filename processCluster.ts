import { runFrcs } from '@ucdavis/frcs';
import { InputVarMod, OutputVarMod } from '@ucdavis/frcs/out/systems/frcs.model';
import { getPreciseDistance } from 'geolib';
import knex from 'knex';
import OSRM = require('osrm');
import {
  calcRemovalsCT,
  calcRemovalsLLT,
  calcRemovalsSLT,
  calcTreeVolCT,
  calcTreeVolLLT,
  calcTreeVolSLT,
  sumBiomass,
  sumPixel
} from './frcsInputCalculations';
import { HarvestCost } from './models/harvestCost';
import { Pixel } from './models/pixel';
import { TreatedCluster } from './models/treatedcluster';
import { clearcut } from './treatments';

export const processCluster = async (
  pixels: Pixel[],
  osrm: OSRM,
  pg: knex
): Promise<TreatedCluster> => {
  return new Promise(async (resolve, reject) => {
    const metersToFeetConstant = 0.3048;
    const metersToAcresConstant = 0.00024711;
    const pixelsToAcreConstant = 30 * 30 * metersToAcresConstant;
    const centerOfBiomassSum = {
      lat: 0,
      lng: 0,
      biomassSum: 0
    };
    pixels = pixels.map(pixel => {
      pixel = clearcut(pixel);
      const biomassInPixel = sumBiomass(pixel);
      centerOfBiomassSum.lat += pixel.y * biomassInPixel;
      centerOfBiomassSum.lng += pixel.x * biomassInPixel;
      centerOfBiomassSum.biomassSum += biomassInPixel;
      return pixel;
    });
    console.log('biomassSum: ' + centerOfBiomassSum.biomassSum);
    const centerOfBiomassLat = centerOfBiomassSum.lat / centerOfBiomassSum.biomassSum;
    const centerOfBiomassLng = centerOfBiomassSum.lng / centerOfBiomassSum.biomassSum;

    console.log('center of biomass: [' + centerOfBiomassLat + ', ' + centerOfBiomassLng + ']');

    const options: OSRM.NearestOptions = {
      coordinates: [[centerOfBiomassLng, centerOfBiomassLat]]
    };

    console.log('finding nearest road to center of biomass:');
    await osrm.nearest(options, async (err, response) => {
      console.log('nearest road:');
      console.log(response.waypoints);
      const landing = {
        latitude: response.waypoints[0].location[1],
        longitude: response.waypoints[0].location[0]
      };
      // get distance between pixel and landing site
      let centerOfBiomassDistanceToLanding = response.waypoints[0].distance;
      centerOfBiomassDistanceToLanding = centerOfBiomassDistanceToLanding / metersToFeetConstant; // feet

      const landingElevationFromDb: Pixel[] = await pg
        .table('pixels')
        .whereBetween('x', [landing.longitude - 0.005, landing.longitude + 0.005])
        .whereBetween('y', [landing.latitude - 0.005, landing.latitude + 0.005]);
      console.log('LANDING ELEVATION FROM DB: ' + landingElevationFromDb[0].elevation);

      let landingElevation = landingElevationFromDb[0]?.elevation;
      landingElevation = landingElevation / metersToFeetConstant; // put landing elevation in feet

      console.log('landingElevetion (ft): ' + landingElevation);
      console.log('number of pixels: ' + pixels.length);
      const area = pixels.length * pixelsToAcreConstant; // pixels are 30m^2, area needs to be in acres
      console.log('area is: ' + area + ' acres^2');

      const centerOfBiomassPixel: Pixel[] = await pg
        .table('pixels')
        .whereBetween('x', [centerOfBiomassLng - 0.005, centerOfBiomassLng + 0.005])
        .whereBetween('y', [centerOfBiomassLat - 0.005, centerOfBiomassLat + 0.005]);
      const centerOfBiomassElevation = centerOfBiomassPixel[0].elevation / metersToFeetConstant;

      let pixelSummation = new Pixel();
      console.log('processing pixels...');

      // https://ucdavis.app.box.com/file/553138812702
      const t = 22.6796185; // payload of equipment delivering biomass in metric tons
      let totalYardingDistance = 0;

      pixels.forEach(p => {
        pixelSummation = sumPixel(pixelSummation, p);
        // get distance between pixel and landing site
        let distance = getPreciseDistance(landing, {
          latitude: p.y,
          longitude: p.x
        }); // meters
        distance = distance / 1000; // kilometers
        totalYardingDistance += 2 * 1 * distance * (sumBiomass(p) / t); // kilometers
      });

      console.log('pixelSummation: ');
      console.log(pixelSummation);
      // trees per acre in cluster
      // pixelSummation.tpa_x is total trees in cluster
      // divided by total area
      // pixelSummation = {
      //   ...pixelSummation,
      //   tpa_0: pixelSummation.tpa_0 / area,
      //   tpa_2: pixelSummation.tpa_2 / area,
      //   tpa_7: pixelSummation.tpa_7 / area,
      //   tpa_15: pixelSummation.tpa_15 / area,
      //   tpa_25: pixelSummation.tpa_25 / area,
      //   tpa_35: pixelSummation.tpa_35 / area,
      //   tpa_40: pixelSummation.tpa_40 / area
      // };
      console.log('pixelSummation: ');
      console.log(pixelSummation);
      totalYardingDistance = (totalYardingDistance * 1000) / metersToFeetConstant; // put in feet

      const averageSlope =
        Math.abs((landingElevation - centerOfBiomassElevation) / centerOfBiomassDistanceToLanding) *
        100;
      console.log('averageSlope ' + averageSlope);

      // const removalsCT = calcRemovalsCT(pixelSummation); // # of trees/acre
      // const removalsSLT = calcRemovalsSLT(pixelSummation); //  # of trees/acre
      // const removalsLLT = calcRemovalsLLT(pixelSummation); // # of trees/acre

      // // TODO: determine correct density
      // const userSpecWDCT = 60;
      // const userSpecWDSLT = 58.6235;
      // // const userSpecWDLLT = 62.1225;
      // const userSpecWDLLT = 80;

      // const totalFrcsInptus: InputVarMod = {
      //   System: 'Ground-Based Mech WT',
      //   PartialCut: true,
      //   DeliverDist: totalYardingDistance,
      //   Slope: averageSlope,
      //   Elevation: centerOfBiomassElevation,
      //   CalcLoad: true,
      //   CalcMoveIn: true,
      //   Area: area,
      //   MoveInDist: 2,
      //   CalcResidues: true,
      //   UserSpecWDCT: userSpecWDCT,
      //   UserSpecWDSLT: userSpecWDSLT,
      //   UserSpecWDLLT: userSpecWDLLT,
      //   UserSpecRFCT: 0,
      //   UserSpecRFSLT: 0.25,
      //   UserSpecRFLLT: 0.38,
      //   UserSpecHFCT: 0.2,
      //   UserSpecHFSLT: 0,
      //   UserSpecHFLLT: 0,
      //   RemovalsCT: removalsCT,
      //   RemovalsLLT: removalsLLT,
      //   RemovalsSLT: removalsSLT,
      //   // * 2000 to get into pounds, divide by userSpecWDCT(density) to get cubic feet
      //   TreeVolCT: (2000 * calcTreeVolCT(pixelSummation)) / (removalsCT * area) / userSpecWDCT,
      //   TreeVolSLT: (2000 * calcTreeVolSLT(pixelSummation)) / (removalsSLT * area) / userSpecWDSLT,
      //   TreeVolLLT: (2000 * calcTreeVolLLT(pixelSummation)) / (removalsLLT * area) / userSpecWDLLT,
      //   DieselFuelPrice: 3.882
      // };
      // console.log('TOTAL FRCS INPUT: -------');
      // console.log(totalFrcsInptus);
      // const clusterFrcsOutput = runFrcs(totalFrcsInptus);
      // console.log('-----------');
      // console.log('FRCS CLUSTER OUTPUT:');
      // console.log(clusterFrcsOutput);
      // console.log('total sum per acre * area: ');
      // console.log(clusterFrcsOutput.TotalPerAcre * area);
      const output: TreatedCluster = {
        cluster_no: pixelSummation.cluster_no,
        treatmentid: 1,
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
        bmstm_7: pixelSummation.bmcwn_7,
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
      console.log(output);
      resolve(output);
    });
  });
};

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

export const processCluster = async (
  pixels: Pixel[],
  osrm: OSRM,
  pg: knex
): Promise<HarvestCost> => {
  return new Promise(async (resolve, reject) => {
    const centerOfBiomassSum = {
      lat: 0,
      lng: 0,
      biomassSum: 0
    };
    pixels.forEach(pixel => {
      const biomassInPixel = sumBiomass(pixel);
      centerOfBiomassSum.lat += pixel.y * biomassInPixel;
      centerOfBiomassSum.lng += pixel.x * biomassInPixel;
      centerOfBiomassSum.biomassSum += biomassInPixel;
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
      // TODO: pull this from db
      const landingElevationFromDb: Pixel[] = await pg
        .table('pixels')
        .whereBetween('x', [landing.longitude - 0.0005, landing.longitude + 0.0005])
        .whereBetween('y', [landing.latitude - 0.0005, landing.latitude + 0.0005]);
      console.log('LANDING ELEVATION FROM DB: ' + landingElevationFromDb[0].elevation);
      console.log('LANDING ELEVATION RESULTS FROM DB: ' + landingElevationFromDb.length);

      const landingElevationFromPixels = pixels.filter(
        p =>
          p.x > landing.longitude - 0.0005 &&
          p.x < landing.longitude + 0.0005 &&
          p.y > landing.latitude - 0.0005 &&
          p.y < landing.latitude + 0.0005
      );
      console.log('--------------');
      console.log('LANDING ELEVATION FROM PIXELS: ' + landingElevationFromPixels[0]?.elevation);
      console.log('LANDING ELEVATION RESULTS FROM PIXELS: ' + landingElevationFromPixels.length);

      const landingElevation =
        landingElevationFromPixels[0]?.elevation ?? landingElevationFromDb[0]?.elevation;

      // ?? landingElevationFromDb[0].elevation;

      console.log('landingElevetion: ' + landingElevation);
      console.log('number of pixels: ' + pixels.length);
      const area = pixels.length * 30 * 30 * 0.00024711; // pixels are 30m^2, area needs to be in acres
      console.log('area is: ' + area + ' acres^2');
      let totalFrcsOutputs: OutputVarMod = {
        TotalPerAcre: 0,
        TotalPerBoleCCF: 0,
        TotalPerGT: 0
      };

      const averageDeliverDistance = response.waypoints[0].distance / 0.3048; // put in feet
      const centerOfBiomassPixel: Pixel[] = await pg
        .table('pixels')
        .whereBetween('x', [centerOfBiomassLng - 0.0005, centerOfBiomassLng + 0.0005])
        .whereBetween('y', [centerOfBiomassLat - 0.0005, centerOfBiomassLat + 0.0005]);
      const centerOfBiomassElevation = centerOfBiomassPixel[0].elevation;

      let pixelSummation = new Pixel();
      console.log('processing pixels...');
      pixels.forEach(p => {
        let distance = getPreciseDistance(landing, {
          latitude: p.y,
          longitude: p.x
        });
        distance = distance / 0.3048; // put in feet
        const slope = Math.abs((landingElevation - p.elevation) / distance) * 100;
        console.log('slope: ' + slope);

        const removalsCT = calcRemovalsCT(p);
        const removalsSLT = calcRemovalsSLT(p);
        const removalsLLT = calcRemovalsLLT(p);
        const frcsInput: InputVarMod = {
          System: 'Ground-Based Mech WT',
          PartialCut: false,
          DeliverDist: distance,
          Slope: slope,
          Elevation: p.elevation,
          CalcLoad: true,
          CalcMoveIn: true,
          Area: area,
          MoveInDist: 0,
          CalcResidues: true,
          UserSpecWDCT: 60,
          UserSpecWDSLT: 58.6235,
          UserSpecWDLLT: 62.1225,
          UserSpecRFCT: 0,
          UserSpecRFSLT: 0.25,
          UserSpecRFLLT: 0.38,
          UserSpecHFCT: 0.2,
          UserSpecHFSLT: 0,
          UserSpecHFLLT: 0,
          RemovalsCT: removalsCT,
          RemovalsSLT: removalsSLT,
          RemovalsLLT: removalsLLT,
          TreeVolCT: calcTreeVolCT(p) / removalsCT,
          TreeVolSLT: calcTreeVolSLT(p) / removalsSLT,
          TreeVolLLT: calcTreeVolLLT(p) / removalsLLT,
          DieselFuelPrice: 3.882
        };
        pixelSummation = sumPixel(pixelSummation, p);
        console.log('FRCS INPUT: -------');
        console.log(frcsInput);
        const frcsOutput = runFrcs(frcsInput);
        console.log('frcs output: ');
        console.log(frcsOutput);
        totalFrcsOutputs = {
          TotalPerAcre: totalFrcsOutputs.TotalPerAcre + frcsOutput.TotalPerAcre,
          TotalPerBoleCCF: totalFrcsOutputs.TotalPerBoleCCF + frcsOutput.TotalPerBoleCCF,
          TotalPerGT: totalFrcsOutputs.TotalPerGT + frcsOutput.TotalPerGT
        };
      });

      const averageSlope =
        Math.abs((landingElevation - centerOfBiomassElevation) / averageDeliverDistance) * 100;
      const totalFrcsInptus: InputVarMod = {
        System: 'Ground-Based Mech WT',
        PartialCut: true,
        DeliverDist: averageDeliverDistance,
        Slope: averageSlope,
        Elevation: centerOfBiomassElevation,
        CalcLoad: true,
        CalcMoveIn: true,
        Area: area,
        MoveInDist: 0,
        CalcResidues: true,
        UserSpecWDCT: 60,
        UserSpecWDSLT: 58.6235,
        UserSpecWDLLT: 62.1225,
        UserSpecRFCT: 0,
        UserSpecRFSLT: 0.25,
        UserSpecRFLLT: 0.38,
        UserSpecHFCT: 0.2,
        UserSpecHFSLT: 0,
        UserSpecHFLLT: 0,
        RemovalsCT: calcRemovalsCT(pixelSummation),
        TreeVolCT:
          calcTreeVolCT(pixelSummation) /
          (pixelSummation.tpa_0 + pixelSummation.tpa_2 + pixelSummation.tpa_7),
        RemovalsSLT: calcRemovalsSLT(pixelSummation),
        TreeVolSLT: calcTreeVolSLT(pixelSummation) / pixelSummation.tpa_15,
        RemovalsLLT: calcRemovalsLLT(pixelSummation),
        TreeVolLLT:
          calcTreeVolLLT(pixelSummation) /
          (pixelSummation.tpa_25 + pixelSummation.tpa_35 + pixelSummation.tpa_40),
        DieselFuelPrice: 3.882
      };
      console.log('TOTAL FRCS INPUT1: -------');
      console.log(totalFrcsInptus);
      const clusterFrcsOutput = runFrcs(totalFrcsInptus);
      console.log('--------------------------\n');
      console.log('FRCS PIXEL OUTPUT:');
      console.log(totalFrcsOutputs);
      console.log('total sum per acre * area: ');
      console.log(totalFrcsOutputs.TotalPerAcre * area);
      console.log('-----------');
      console.log('FRCS CLUSTER OUTPUT:');
      console.log(clusterFrcsOutput);
      console.log('total sum per acre * area: ');
      console.log(clusterFrcsOutput.TotalPerAcre * area);
      const output: HarvestCost = {
        treatmentid: 1,
        systemid: 1,
        clusterid: pixels[0].cluster_no,
        year: 2016,
        biomass: centerOfBiomassSum.biomassSum,
        totalcost: totalFrcsOutputs.TotalPerAcre * area
      };
      resolve(output);
    });
  });
};

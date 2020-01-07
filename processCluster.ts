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
import { clearcut } from './treatments';

export const processCluster = async (
  pixels: Pixel[],
  osrm: OSRM,
  pg: knex
): Promise<HarvestCost> => {
  return new Promise(async (resolve, reject) => {
    const metersToFeetConstant = 0.3048;
    const metersToAcresConstant = 0.00024711;
    const pixelsToAcreConstant = 30 * 30 * metersToAcresConstant;
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
      // get distance between pixel and landing site
      let centerOfBiomassDistanceToLanding = response.waypoints[0].distance;
      centerOfBiomassDistanceToLanding = centerOfBiomassDistanceToLanding / metersToFeetConstant; // feet

      const landingElevationFromDb: Pixel[] = await pg
        .table('pixels')
        .whereBetween('x', [landing.longitude - 0.0005, landing.longitude + 0.0005])
        .whereBetween('y', [landing.latitude - 0.0005, landing.latitude + 0.0005]);
      console.log('LANDING ELEVATION FROM DB: ' + landingElevationFromDb[0].elevation);
      // console.log('LANDING ELEVATION RESULTS FROM DB: ' + landingElevationFromDb.length);
      // console.log(
      //   'LANDING ELEVATION COORDS: [' +
      //     landingElevationFromDb[0].y +
      //     ', ' +
      //     landingElevationFromDb[0].x +
      //     ']'
      // );

      let landingElevation = landingElevationFromDb[0]?.elevation;
      landingElevation = landingElevation / metersToFeetConstant; // put landing elevation in feet

      console.log('landingElevetion (ft): ' + landingElevation);
      console.log('number of pixels: ' + pixels.length);
      const area = pixels.length * pixelsToAcreConstant; // pixels are 30m^2, area needs to be in acres
      console.log('area is: ' + area + ' acres^2');

      const centerOfBiomassPixel: Pixel[] = await pg
        .table('pixels')
        .whereBetween('x', [centerOfBiomassLng - 0.0005, centerOfBiomassLng + 0.0005])
        .whereBetween('y', [centerOfBiomassLat - 0.0005, centerOfBiomassLat + 0.0005]);
      const centerOfBiomassElevation = centerOfBiomassPixel[0].elevation / metersToFeetConstant;

      let pixelSummation = new Pixel();
      console.log('pixel Summation: ');
      console.log(pixelSummation);
      console.log('processing pixels...');

      // https://ucdavis.app.box.com/file/553138812702
      const t = 22.6796185; // payload of equipment delivering biomass in metric tons
      let totalYardingDistance = 0;

      pixels.forEach(p => {
        pixelSummation = sumPixel(pixelSummation, p);
        // console.log('pixelSummation: ');
        // console.log(pixelSummation);
        // get distance between pixel and landing site
        let distance = getPreciseDistance(landing, {
          latitude: p.y,
          longitude: p.x
        }); // meters
        distance = distance / 1000; // kilometers
        totalYardingDistance += 2 * 1 * distance * (clearcut(p) / t); // kilometers
      });

      console.log('pixelSummation: ');
      console.log(pixelSummation);

      // console.log('averageDeliverDistance (km) ' + totalYardingDistance);

      totalYardingDistance = (totalYardingDistance * 1000) / metersToFeetConstant; // put in feet
      // console.log('averageDeliverDistance (ft) ' + totalYardingDistance);

      // console.log(
      //   'landingElevation: ' +
      //     landingElevation +
      //     ' centerOfBiomassElevation: ' +
      //     centerOfBiomassElevation
      // );

      const averageSlope =
        Math.abs((landingElevation - centerOfBiomassElevation) / centerOfBiomassDistanceToLanding) *
        100;
      console.log('averageSlope ' + averageSlope);

      const removalsCT = calcRemovalsCT(pixelSummation);
      const removalsSLT = calcRemovalsSLT(pixelSummation);
      const removalsLLT = calcRemovalsLLT(pixelSummation);
      console.log('treeVolCT: ' + calcTreeVolCT(pixelSummation));
      console.log('removalsCT: ' + removalsCT);
      const totalFrcsInptus: InputVarMod = {
        System: 'Ground-Based Mech WT',
        PartialCut: true,
        DeliverDist: totalYardingDistance,
        Slope: averageSlope,
        Elevation: centerOfBiomassElevation,
        CalcLoad: true,
        CalcMoveIn: true,
        Area: area,
        MoveInDist: 2,
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
        RemovalsLLT: removalsLLT,
        RemovalsSLT: removalsSLT,
        TreeVolCT: calcTreeVolCT(pixelSummation) / removalsCT,
        TreeVolSLT: calcTreeVolSLT(pixelSummation) / removalsSLT,
        TreeVolLLT: calcTreeVolLLT(pixelSummation) / removalsLLT,
        DieselFuelPrice: 3.882
      };
      console.log('TOTAL FRCS INPUT: -------');
      console.log(totalFrcsInptus);
      const clusterFrcsOutput = runFrcs(totalFrcsInptus);
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
        totalcost: clusterFrcsOutput.TotalPerAcre * area
      };
      resolve(output);
    });
  });
};

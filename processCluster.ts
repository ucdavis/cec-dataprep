import { runFrcs } from '@ucdavis/frcs';
import { OutputVarMod } from '@ucdavis/frcs/out/systems/frcs.model';
import { getPreciseDistance } from 'geolib';
import knex from 'knex';
import { Pixel } from 'models/pixel';
import OSRM = require('osrm');

export const processCluster = async (pixels: Pixel[], osrm: OSRM, pg: knex) => {
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
      console.log('pixel length: ' + pixels.length);
      const area = pixels.length * 30 * 30 * 0.00024711; // pixels are 30m^2, area needs to be in acres
      console.log('area is: ' + area + ' acres^2');
      let totalFrcsOutputs: OutputVarMod = {
        TotalPerAcre: 0,
        TotalPerBoleCCF: 0,
        TotalPerGT: 0
      };
      pixels.forEach(p => {
        let distance = getPreciseDistance(landing, {
          latitude: p.y,
          longitude: p.x
        });
        distance = distance / 0.3048; // put in feet
        const slope = Math.abs((landingElevation - p.elevation) / distance) * 100;
        console.log('slope: ' + slope);

        const frcsInput = {
          System: 'Ground-Based Mech WT',
          PartialCut: true,
          DeliverDist: distance,
          Slope: slope,
          Elevation: p.elevation,
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
          RemovalsCT: calcRemovalsCT(p),
          TreeVolCT: calcTreeVolCT(p),
          RemovalsSLT: calcRemovalsSLT(p),
          TreeVolSLT: calcTreeVolSLT(p),
          RemovalsLLT: calcRemovalsLLT(p),
          TreeVolLLT: calcTreeVolLLT(p)
        };
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
      console.log('total sum per acre * area: ');
      console.log(totalFrcsOutputs.TotalPerAcre * area);
      resolve(totalFrcsOutputs);
    });
  });
};

const sumBiomass = (pixel: Pixel) => {
  return (
    pixel.total3run_sng_0_nomgt_2016_v20190630 +
    pixel.total3run_sng_2_nomgt_2016_v20190630 +
    pixel.total3run_sng_7_nomgt_2016_v20190630 +
    pixel.total3run_sng_15_nomgt_2016_v20190630 +
    pixel.total3run_sng_25_nomgt_2016_v20190630 +
    pixel.total3run_sng_35_nomgt_2016_v20190630 +
    pixel.total3run_sng_40_nomgt_2016_v20190630 +
    pixel.total3run_tpa_0_nomgt_2016_v20190630 +
    pixel.total3run_tpa_2_nomgt_2016_v20190630 +
    pixel.total3run_tpa_7_nomgt_2016_v20190630 +
    pixel.total3run_tpa_15_nomgt_2016_v20190630 +
    pixel.total3run_tpa_25_nomgt_2016_v20190630 +
    pixel.total3run_tpa_35_nomgt_2016_v20190630 +
    pixel.total3run_tpa_40_nomgt_2016_v20190630
  );
};

// these equations come from this sheet:
// https://ucdavis.app.box.com/file/566320916282
const calcRemovalsCT = (pixel: Pixel) => {
  return (
    pixel.total3run_tpa_0_nomgt_2016_v20190630 +
    pixel.total3run_tpa_2_nomgt_2016_v20190630 +
    pixel.total3run_tpa_7_nomgt_2016_v20190630 +
    pixel.total3run_tpa_15_nomgt_2016_v20190630 +
    pixel.total3run_sng_0_nomgt_2016_v20190630 +
    pixel.total3run_sng_2_nomgt_2016_v20190630 +
    pixel.total3run_sng_7_nomgt_2016_v20190630 +
    pixel.total3run_sng_15_nomgt_2016_v20190630
  );
};

const calcRemovalsSLT = (pixel: Pixel) => {
  return pixel.total3run_tpa_15_nomgt_2016_v20190630 + pixel.total3run_sng_15_nomgt_2016_v20190630;
};

const calcRemovalsLLT = (pixel: Pixel) => {
  return (
    pixel.total3run_tpa_25_nomgt_2016_v20190630 +
    pixel.total3run_tpa_35_nomgt_2016_v20190630 +
    pixel.total3run_tpa_40_nomgt_2016_v20190630 +
    pixel.total3run_sng_25_nomgt_2016_v20190630 +
    pixel.total3run_sng_35_nomgt_2016_v20190630 +
    pixel.total3run_sng_40_nomgt_2016_v20190630
  );
};

const calcTreeVolCT = (pixel: Pixel) => {
  return (
    pixel.total3run_bmfol_0_nomgt_2016_v20190630 +
    pixel.total3run_bmfol_2_nomgt_2016_v20190630 +
    pixel.total3run_bmfol_7_nomgt_2016_v20190630 +
    pixel.total3run_bmfol_15_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_0_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_2_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_7_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_15_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_0_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_2_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_7_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_15_nomgt_2016_v20190630
    // TODO: add DBMCN and DBMSM
  );
};

const calcTreeVolSLT = (pixel: Pixel) => {
  return (
    pixel.total3run_bmfol_15_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_15_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_15_nomgt_2016_v20190630
    // TODO: add DBMCN 15 and DBMSM 15
  );
};

const calcTreeVolLLT = (pixel: Pixel) => {
  return (
    pixel.total3run_bmfol_25_nomgt_2016_v20190630 +
    pixel.total3run_bmfol_35_nomgt_2016_v20190630 +
    pixel.total3run_bmfol_40_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_25_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_35_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_40_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_25_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_35_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_40_nomgt_2016_v20190630
    // TODO: add DBMCN and DBMSM
  );
};

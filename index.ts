import { runFrcs } from '@ucdavis/frcs';
import dotenv from 'dotenv';
import knex from 'knex';
import { Pixel } from 'models/pixel';
import OSRM from 'osrm';

const main = async () => {
  dotenv.config();

  console.log('connecting to db', process.env.DB_HOST);
  // https://knexjs.org/
  const pg = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: 'plumas-kmeans'
    }
  });
  const osrm = new OSRM('./data/california-latest.osrm');

  const pixelsInCluster: Pixel[] = await pg
    .table('plumas136')
    .where({ cluster_no: 7779 });
  await processCluster(pixelsInCluster, osrm);

  pg.destroy();
};

main();

const processCluster = async (pixels: Pixel[], osrm: OSRM) => {
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
  const centerOfBiomassLat =
    centerOfBiomassSum.lat / centerOfBiomassSum.biomassSum;
  const centerOfBiomassLng =
    centerOfBiomassSum.lng / centerOfBiomassSum.biomassSum;

  console.log(
    'center of biomass: [' +
      centerOfBiomassLat +
      ', ' +
      centerOfBiomassLng +
      ']'
  );

  const options: OSRM.NearestOptions = {
    coordinates: [[centerOfBiomassLng, centerOfBiomassLat]]
  };

  const area = pixels.length * 30 * 0.00024711; // pixels are 30m^2, area needs to be in acres
  console.log('area is: ' + area + ' acres^2');
  const frcsInput = {
    System: 'Cable Manual WT',
    PartialCut: true,
    DeliverDist: 400,
    Slope: 30,
    Elevation: 5000,
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
    RemovalsCT: 20,
    TreeVolCT: 50,
    RemovalsSLT: 50,
    TreeVolSLT: 70,
    RemovalsLLT: 5,
    TreeVolLLT: 100
  };
  console.log('finding nearest road to center of biomass:');
  await osrm.nearest(options, (err, response) => {
    console.log('nearest road:');
    console.log(response.waypoints);
    const frcsOutput = runFrcs(frcsInput);
    console.log('frcs output: ');
    console.log(frcsOutput);
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

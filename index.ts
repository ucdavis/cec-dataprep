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

  console.log('finding nearest road to center of biomass:');
  osrm.nearest(options, (err, response) => {
    console.log('nearest road:');
    console.log(response.waypoints);
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

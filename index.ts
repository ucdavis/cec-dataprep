import dotenv from 'dotenv';
import knex from 'knex';
import { Cluster } from 'models/cluster';
import { HarvestCost } from 'models/harvestCost';
import { Pixel } from 'models/pixel';
import OSRM from 'osrm';
import { processCluster } from './processCluster';

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
  // const clusters: Cluster[] = await pg
  //   .table('clusters')
  //   .orderBy('id', 'random')
  //   .limit(1);
  // const cluster = clusters[0];
  const pixelsInCluster: Pixel[] = await pg.table('pixels').where({ cluster_no: '44127' });
  const outputs = await processCluster(pixelsInCluster, osrm, pg);

  console.log('destroying pg...');
  pg.destroy();
};

main();

import dotenv from 'dotenv';
import knex from 'knex';
import { Cluster } from 'models/cluster';
import { HarvestCost } from 'models/harvestCost';
import { Pixel } from 'models/pixel';
import OSRM from 'osrm';
import { performance } from 'perf_hooks';
import { TreatedCluster } from './models/treatedcluster';
import { processCluster } from './processCluster';

const main = async () => {
  const t0 = performance.now();
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
  const treatmentId = await pg
    .table('treatments')
    .select('id')
    .orderByRaw('RANDOM()')
    .limit(1);
  console.log('treatment id: ' + treatmentId[0].id);
  const clusters: Cluster[] = await pg
    .table('clusters')
    .select('id')
    // tslint:disable-next-line: space-before-function-paren
    .whereNotExists(function() {
      this.select('*')
        .from('treatedclusters')
        .whereRaw(`clusters.id = cluster_no and treatmentid = ${treatmentId[0].id}`);
    })
    .orderByRaw('RANDOM()')
    .limit(1);
  const cluster = clusters[0];
  console.log('cluster id: ' + cluster.id);
  const pixelsInCluster: Pixel[] = await pg.table('pixels').where({ cluster_no: cluster.id });
  const outputs: TreatedCluster = await processCluster(pixelsInCluster, osrm, pg);

  console.log('updating db...');
  const results: TreatedCluster = await pg('treatedclusters').insert(outputs);
  console.log('destroying pg...');
  pg.destroy();
  const t1 = performance.now();
  console.log('Running took ' + (t1 - t0) + ' milliseconds.');
};

main();

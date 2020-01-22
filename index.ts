import dotenv from 'dotenv';
import knex from 'knex';
import OSRM from 'osrm';
import { performance } from 'perf_hooks';
import { Cluster } from './models/cluster';
import { HarvestCost } from './models/harvestCost';
import { Pixel } from './models/pixel';
import { TreatedCluster } from './models/treatedcluster';
import { Treatment } from './models/treatment';
import { processCluster } from './processCluster';
import { runFrcsOnCluster } from './runFrcs';

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
  try {
    const osrm = new OSRM('./data/california-latest.osrm');
    const treatment: Treatment[] = await pg
      .table('treatments')
      .orderByRaw('RANDOM()')
      .limit(1);
    const clusters: Cluster[] = await pg
      .table('clusters')
      .select('id')
      // tslint:disable-next-line: space-before-function-paren
      .whereNotExists(function() {
        this.select('*')
          .from('treatedclusters')
          .whereRaw(
            `clusters.id = cluster_no and treatmentid = ${treatment[0].id}`
          );
      })
      .orderByRaw('RANDOM()')
      .limit(1);
    if (clusters.length === 0) {
      throw new Error('No clusters left to process.');
    }
    const clusterId = clusters[0]?.id;
    console.log('cluster id: ' + clusterId + ', treatment id: ' + treatment[0].id);
    const pixelsInCluster: Pixel[] = await pg.table('pixels').where({ cluster_no: clusterId });

    const outputs: TreatedCluster = await processCluster(
      pixelsInCluster,
      treatment[0].id,
      treatment[0].name,
      osrm,
      pg
    ).catch(err => {
      console.log('ERROR IN CATCH:');
      console.log(err);
      throw new Error(err);
    });

    console.log('updating db...');
    console.log(outputs);
    const results: TreatedCluster = await pg('treatedclusters')
      .insert(outputs);
  } catch (err) {
    console.log('------------\n');
    console.log(err);
    console.log('/n');
  } finally {
    console.log('destroying pg...');
    pg.destroy();
    const t1 = performance.now();
    console.log('Running took ' + (t1 - t0) + ' milliseconds.');
  }
  // const cluster: TreatedCluster[] = await db.table('treatedclusters').where({ cluster_no: 43253 });
  // console.log('CLUSTER:');
  // console.log(cluster[0]);
  // const output = runFrcsOnCluster(cluster[0]);
  // // console.log(output);
  // db.destroy();
};

main();

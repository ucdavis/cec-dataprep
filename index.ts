import dotenv from 'dotenv';
import knex from 'knex';
import OSRM from 'osrm';
import { performance } from 'perf_hooks';
import pg from 'pg';
import { Cluster } from './models/cluster';
import { HarvestCost } from './models/harvestCost';
import { Pixel } from './models/pixel';
import { TreatedCluster } from './models/treatedcluster';
import { Treatment } from './models/treatment';
import { processCluster } from './processCluster';

const PG_DECIMAL_OID = 1700;
pg.types.setTypeParser(PG_DECIMAL_OID, parseFloat);
dotenv.config();

const main = async () => {
  const t0 = performance.now();
  console.log('connecting to db', process.env.DB_HOST);
  // https://knexjs.org/
  const db = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: 'plumas-kmeans'
    }
  });
  try {
    // const osrm = new OSRM('./data/california-latest.osrm');
    // const treatment: Treatment[] = await db
    //   .table('treatments')
    //   .orderByRaw('RANDOM()')
    //   .limit(1);
    // const clusters: Cluster[] = await pg
    //   .table('clusters')
    //   .select('id')
    //   // tslint:disable-next-line: space-before-function-paren
    //   .whereNotExists(function() {
    //     this.select('*')
    //       .from('treatedclusters')
    //       .whereRaw(`clusters.id = cluster_no and treatmentid = ${treatment[0].id}`);
    //   })
    //   .orderByRaw('RANDOM()')
    //   .limit(1);
    // if (clusters.length === 0) {
    //   throw new Error('No clusters left to process.');
    // }
    const treatmentId = 1;
    const treatmentName = 'clearcut';
    const clusterId = 43253; // clusters[0]?.id;
    console.log('cluster id: ' + clusterId + ', treatment id: ' + treatmentId);
    const pixelsInCluster = await db.table('pixels').where({ cluster_no: clusterId });
    console.log(pixelsInCluster[0]);
    const outputs: TreatedCluster = await processCluster(
      pixelsInCluster,
      treatmentId,
      treatmentName,
      // osrm,
      db
    ).catch(err => {
      console.log('ERROR IN CATCH:');
      console.log(err);
      throw new Error(err);
    });

    console.log('updating db...');
    console.log(outputs);
    // const results: TreatedCluster = await pg('treatedclusters').insert(outputs);
  } catch (err) {
    console.log('------------\n');
    console.log(err);
    console.log('/n');
  } finally {
    console.log('destroying pg...');
    db.destroy();
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

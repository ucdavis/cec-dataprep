import dotenv from 'dotenv';
import knex from 'knex';
import OSRM from 'osrm';
import { performance } from 'perf_hooks';
import pg from 'pg';
import { Cluster } from './models/cluster';
import { Treatment } from './models/shared';
import { TreatedCluster } from './models/treatedcluster';
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
    const osrm = new OSRM('./data/california-latest.osrm');
    const treatment: Treatment[] = await db
      .table('treatments')
      .orderByRaw('RANDOM()')
      .limit(1);
    const clusters: Cluster[] = await db
      .table('clusters')
      .select('id')
      // tslint:disable-next-line: space-before-function-paren
      .whereNotExists(function() {
        this.select('*')
          .from('treatedclusters')
          .whereRaw(`clusters.id = cluster_no and treatmentid = ${treatment[0].id}`);
      })
      .orderByRaw('RANDOM()')
      .limit(1);
    if (clusters.length === 0) {
      throw new Error('No clusters left to process.');
    }
    const clusterId = clusters[0]?.id;
    console.log('cluster id: ' + clusterId + ', treatment: ' + treatment[0].name);
    const pixelsInCluster = await db.table('pixels').where({ cluster_no: clusterId });
    const outputs: TreatedCluster = await processCluster(
      pixelsInCluster,
      treatment[0].id,
      treatment[0].name,
      osrm,
      db
    ).catch(err => {
      console.log('ERROR IN CATCH:');
      console.log(err);
      throw new Error(err);
    });

    console.log('updating db...');
    console.log(outputs);

    const results: TreatedCluster = await db('treatedclusters').insert(outputs);
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
};

main();

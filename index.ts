import dotenv from 'dotenv';
import knex from 'knex';
import OSRM from 'osrm';
import { performance } from 'perf_hooks';
import pg from 'pg';
import { Cluster } from './models/cluster';
import { Pixel } from './models/pixel';
import { Treatment } from './models/shared';
import { TreatedCluster } from './models/treatedcluster';
import { processCluster } from './processCluster';

const PG_DECIMAL_OID = 1700;
pg.types.setTypeParser(PG_DECIMAL_OID, parseFloat);
dotenv.config();

const processAllTreatments = async () => {
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
    const treatments: Treatment[] = await db.table('treatments');
    const results: TreatedCluster[] = [];

    const clusters: Cluster[] = await db
      .table('clusters')
      .select('*')
      // tslint:disable-next-line: space-before-function-paren
      .whereNotExists(function() {
        this.select('*')
          .from('treatedclusters')
          .whereRaw(`clusters.id = cluster_no`);
      })
      .orderByRaw('RANDOM()')
      .limit(1);
    const clusterId = clusters[0].id;
    const pixelsInCluster: Pixel[] = await db.table('pixels').where({ cluster_no: clusterId });
    await Promise.all(
      treatments.map(async (treatment: Treatment) => {
        const outputs = await processCluster(
          pixelsInCluster,
          treatment.id,
          treatment.name,
          osrm,
          db
        )
          .then(res => {
            console.log(`pushing results of ${clusterId}, ${treatment.name}`);
            results.push(res);
          })
          .catch(err => {
            console.log(`cannot push results of ${clusterId}, ${treatment.name}: ${err}`);
          });
      })
    );
    console.log('inserting into db...');
    await db('treatedclusters').insert(results);
  } catch (err) {
    console.log('------------\n');
    console.log(err.message);
    console.log('/n');
  } finally {
    console.log('destroying pg...');
    db.destroy();
    const t1 = performance.now();
    console.log('Running took ' + (t1 - t0) + ' milliseconds.');
  }
};

processAllTreatments();

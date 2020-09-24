import dotenv from 'dotenv';
import knex from 'knex';
import OSRM from 'osrm';

import { performance } from 'perf_hooks';

import { exportCsv, importCsv } from './csvHelper';
import { processCluster } from './processCluster';
import { setupTreated } from './setupTreated';

import { Pixel } from './models/pixel';
import { Treatment } from './models/shared';
import { TreatedCluster } from './models/treatedcluster';

dotenv.config();

const processAllTreatments = async (db: knex) => {
  const t0 = performance.now();

  await db.transaction(async txn => {
    try {
      const osrm = new OSRM(process.env.OSRM_FILE || './data/california-latest.osrm');
      // TODO: why do we grab treatments every time? we should only need it once
      const treatments: Treatment[] = await txn.table('treatments');
      const results: TreatedCluster[] = [];

      // grab a random pixel and use it to choose the clusterId to use
      const clusters: Pixel[] = await txn
        .table('pixels')
        .select('cluster_no')
        .orderByRaw('RANDOM()')
        .limit(1);

      const clusterId = clusters[0].cluster_no;
      const pixelsInCluster: Pixel[] = await txn.table('pixels').where({ cluster_no: clusterId });
      await Promise.all(
        treatments.map(async (treatment: Treatment) => {
          const outputs = await processCluster(
            pixelsInCluster,
            treatment.id,
            treatment.name,
            osrm,
            txn
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
      // insert into the db and remove from the pixels table
      await txn.table('treatedclusters').insert(results);
      await txn.raw(`delete from pixels where cluster_no = ${clusterId}`);
    } catch (err) {
      console.log('------------\n');
      console.log(err.message);
      console.log('/n');
      throw err; // rethrowing the error will cause the closing transaction to rollback
    } finally {
      const t1 = performance.now();
      console.log('Running took ' + (t1 - t0) + ' milliseconds.');
    }
  });
};

// read from the csv file and process clusters in a synchronous loop
const processClusters = async () => {
  const t0 = performance.now();

  // https://knexjs.org/
  const db = knex({
    client: 'sqlite3',
    connection: ':memory:',
    useNullAsDefault: true,
  });

  // const db = knex({
  //   client: 'sqlite3',
  //   connection: {
  //     filename: './dev.sqlite3',
  //   },
  // });

  // setup treatments structure
  await setupTreated(db);

  // import csv w/ in-memory db
  await importCsv(db, './data/sierra_small.csv');

  // loop through the data and process every cluster
  // TODO: change to a while loop so we process every row
  for (let i = 0; i < 2; i++) {
    try {
      await processAllTreatments(db);
    } catch (err) {
      console.error(err);
    }
  }

  // spit out into another csv of treated pixels
  await exportCsv(db, './data/sierra_out.csv');

  const t1 = performance.now();
  console.log(`Running took ${t1 - t0} milliseconds.`);

  // all done
  process.exit(0);
};

processClusters()
  .then(() => {
    console.log('All done, existing');
  })
  .catch(console.error);

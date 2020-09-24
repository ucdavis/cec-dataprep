import dotenv from 'dotenv';
import knex from 'knex';

import { performance } from 'perf_hooks';

import { importCsv } from './importCsv';
import { setupTreated } from './setupTreated';

dotenv.config();

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

  

  // for (let i = 0; i < nClusters; i++) {
  //   try {
  //     await processAllTreatments(db);
  //   } catch (err) {
  //     // TODO: log treatment error here instead of catching earlier
  //     console.error(err);
  //   }
  // }

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

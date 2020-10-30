import dotenv from 'dotenv';
import OSRM from 'osrm';

import { performance } from 'perf_hooks';

import { exportToCsv, getCsvWriteStream, processPixelsCsv } from './csvHelper';
import { processCluster } from './processCluster';

import { Pixel } from './models/pixel';
import { Treatment } from './models/shared';
import { TreatedCluster } from './models/treatedcluster';

const treatments: Treatment[] = [
  { id: 1, name: 'clearcut', land_use: 'Private' },
  { id: 2, name: 'commercialThin', land_use: 'Private' },
  { id: 3, name: 'commercialThinChipTreeRemoval', land_use: 'Private,Forest' },
  { id: 4, name: 'timberSalvage', land_use: 'Private,Forest' },
  { id: 5, name: 'timberSalvageChipTreeRemoval', land_use: 'Private,Forest' },
  { id: 6, name: 'selection', land_use: 'Private' },
  { id: 7, name: 'selectionChipTreeRemoval', land_use: 'Private' },
  { id: 8, name: 'tenPercentGroupSelection', land_use: 'Private,Forest' },
  { id: 9, name: 'twentyPercentGroupSelection', land_use: 'Private' },
  { id: 10, name: 'biomassSalvage', land_use: 'Private,Forest' }
];

dotenv.config();

const processAllTreatments = async (clusterId: string, pixels: Pixel[], osrm: OSRM) => {
  const t0 = performance.now();

  try {
    const results: TreatedCluster[] = [];

    await Promise.all(
      treatments.map(async (treatment: Treatment) => {
        await processCluster(pixels, treatment.id, treatment.name, osrm)
          .then(res => {
            console.log(`pushing results of ${clusterId}, ${treatment.name}`);
            results.push(res);
          })
          .catch(err => {
            console.log(`cannot push results of ${clusterId}, ${treatment.name}: ${err}`);
          });
      })
    );

    // success, return the treated cluster results
    return results;
  } catch (err) {
    // TODO: what should we do with clusters which don't process at all?  Currently they are just returned undefined
    console.log('------------\n');
    console.log(err.message);
    console.log('/n');
  } finally {
    const t1 = performance.now();
    console.log('Running took ' + (t1 - t0) + ' milliseconds.');
  }
};

const processClustersStreaming = async () => {
  // get our ORSM instance we will use for all cluster processing
  const osrm = new OSRM(process.env.OSRM_FILE || './data/california-latest.osrm');

  // open our output csv for writing
  const outputCsvActions = getCsvWriteStream(
    process.env.TREATED_OUT_FILE || './data/results-Butte_sorted_new1.csv'
  );

  const promises: Promise<void>[] = [];

  // process the csv and get a callback each time a new cluster is read
  await processPixelsCsv(
    process.env.PIXEL_FILE || './data/Butte_sorted_new1.csv',
    (cluster, pixels) => {
      console.log(`there are ${pixels.length} pixels in cluster ${cluster}, processing now`);

      // process the treatements for this cluster and write the results to the csv
      promises.push(
        processAllTreatments(cluster, pixels, osrm).then(treated => {
          if (treated) {
            outputCsvActions.writeTreatedClusters(treated);
          }

          return;
        })
      );
    }
  );

  // once we are done with all processing and writing our results
  await Promise.all(promises);

  outputCsvActions.closeCsv();
};

processClustersStreaming()
  .then(() => console.log('all done with processing run'))
  .catch(console.error);

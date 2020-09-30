import dotenv from 'dotenv';
import OSRM from 'osrm';

import { performance } from 'perf_hooks';

import { exportToCsv, importFromCsv } from './csvHelper';
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
  { id: 10, name: 'biomassSalvage', land_use: 'Private,Forest' },
];

dotenv.config();

const processAllTreatments = async (clusterId: number, pixels: Pixel[]) => {
  const t0 = performance.now();

  try {
    const osrm = new OSRM(process.env.OSRM_FILE || './data/california-latest.osrm');
    // TODO: why do we grab treatments every time? we should only need it once
    const results: TreatedCluster[] = [];

    await Promise.all(
      treatments.map(async (treatment: Treatment) => {
        await processCluster(pixels, treatment.id, treatment.name, osrm)
          .then((res) => {
            console.log(`pushing results of ${clusterId}, ${treatment.name}`);
            results.push(res);
          })
          .catch((err) => {
            console.log(`cannot push results of ${clusterId}, ${treatment.name}: ${err}`);
          });
      })
    );

    // success, return the treated cluster results
    return results;
  } catch (err) {
    // TODO: should we catch:?
    console.log('------------\n');
    console.log(err.message);
    console.log('/n');
  } finally {
    const t1 = performance.now();
    console.log('Running took ' + (t1 - t0) + ' milliseconds.');
  }
};

const processClustersInMemory = async () => {
  const treatedClusters: TreatedCluster[] = [];
  const errorClusters: string[] = [];

  const t0 = performance.now();

  const clusters = await importFromCsv(process.env.PIXEL_FILE || './data/sierra_small.csv');

  for (const clusterNo in clusters) {
    if (Object.prototype.hasOwnProperty.call(clusters, clusterNo)) {
      const pixelsInCluster = clusters[clusterNo];

      if (pixelsInCluster.length > 0) {
        console.log(`${clusterNo} has ${pixelsInCluster.length} pixels, processing now`);

        const result = await processAllTreatments(pixelsInCluster[0].cluster_no, pixelsInCluster);

        if (result && result.length > 0) {
          treatedClusters.push(...result);
        } else {
          errorClusters.push(clusterNo);
        }
      }
    }
  }

  console.log('all done processing clusters, writing output files');

  await exportToCsv(treatedClusters, process.env.TREATED_OUT_FILE || './data/results.csv');

  if (errorClusters.length > 0) {
    console.log('the following clusters could not be processed' + errorClusters.join(','));
  } else {
    console.log('yay, all clusters ran successfully!');
  }

  const t1 = performance.now();
  console.log(`Running in memory took ${t1 - t0} milliseconds.`);
};

processClustersInMemory()
  .then(() => console.log('all done with processing run'))
  .catch(console.error);

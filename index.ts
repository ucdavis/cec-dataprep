import dotenv from 'dotenv';
import OSRM from 'osrm';

import { performance } from 'perf_hooks';

import { exportToCsv, processPixelsCsv } from './csvHelper';
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
  const promises: Promise<TreatedCluster[] | undefined>[] = [];
  await processPixelsCsv(process.env.PIXEL_FILE || './data/butte-pixels-sorted.csv', (cluster, pixels) => {
    console.log(`there are ${pixels.length} pixels in cluster ${cluster}, processing now`);

    promises.push(processAllTreatments(cluster, pixels));
  });

  const results = await Promise.all(promises);

  // flatten and throw away clusters that couldn't process
  const flatResults: TreatedCluster[] = [];

  results.forEach((r) => {
    if (r !== undefined) {
      flatResults.push(...r);
    }
  });

  await exportToCsv(flatResults, process.env.TREATED_OUT_FILE || './data/results.csv');
};

processClustersStreaming()
  .then(() => console.log('all done with processing run'))
  .catch(console.error);

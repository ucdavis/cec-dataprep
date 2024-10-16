import dotenv from 'dotenv';
import OSRM from '@project-osrm/osrm';

//import { performance } from 'perf_hooks';

import { exportToCsv, getCsvWriteStream, processTreatedClustersCsv } from './csvHelper';
import { processCluster } from './processCluster';

import { TreatedCluster } from './models/treatedcluster';

dotenv.config();

const processClustersStreaming = async () => {
  // get our ORSM instance we will use for all cluster processing
  const osrm = new OSRM(process.env.OSRM_FILE || './data/california-latest.osrm');

  // open our output csv for writing
  const outputCsvActions = getCsvWriteStream(
    process.env.TREATED_OUT_FILE || './data/GLRBT_processed.csv'
  );

  const promises: Promise<void>[] = [];

  // process the csv and get a callback each time a new cluster is read
  await processTreatedClustersCsv(process.env.PIXEL_FILE || './data/complete_GLRBT_2025.csv', (cluster_ID, treatedClusters) => {
    console.log(`there are ${treatedClusters.length} rows in cluster ${cluster_ID}, processing now`);
    // process the treatements for this cluster and write the results to the csv
    promises.push(
      processCluster(treatedClusters,osrm).then((treated) => {
        if (treated) {
          outputCsvActions.writeTreatedClusters(treated);
        }
        return;
      })
    );
  });

  // once we are done with all processing and writing our results
  await Promise.all(promises);
 
  outputCsvActions.closeCsv();
};

processClustersStreaming()
  .then(() => console.log('all done with processing run'))
  .catch(console.error);

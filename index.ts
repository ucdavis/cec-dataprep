import OSRM from '@project-osrm/osrm';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import { getCsvWriteStream, processTreatedClustersCsv } from './csvHelper';
import { processCluster } from './processCluster';


dotenv.config();

const args = process.argv.slice(2);
console.log('ARGS', args)
const year = args[0] || '2025';
const countyName = args[1];

if (!countyName) {
  console.error('Error: County name is required. Usage: npm run process <year> <county_name>');
  process.exit(1);
}

const outputDir = path.join(process.env.PROCESSED_FOLDER || './data/processed_files', year);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const processClustersStreaming = async () => {
  // get our ORSM instance we will use for all cluster processing
  const osrm = new OSRM(process.env.OSRM_FILE || './data/california-latest.osrm');

  const inputFilePath = `${process.env.INPUT_FOLDER || './data/unprocessed_counties'}/${year}/${countyName}.csv`;
  console.log('INPUT FILE', inputFilePath);
  const outputFilePath = path.join(outputDir, `${countyName}.csv`);

  if (!fs.existsSync(inputFilePath)) {
    console.error(`Error: Input file ${inputFilePath} does not exist.`);
    process.exit(1);
  }

  console.log(`Processing ${inputFilePath} for year ${year}`);
  console.log(`Output will be saved to ${outputFilePath}`);

  const outputCsvActions = getCsvWriteStream(outputFilePath);

  const promises: Promise<void>[] = [];

  await processTreatedClustersCsv(inputFilePath, (cluster_ID, treatedClusters) => {
    console.log(
      `there are ${treatedClusters.length} rows in cluster ${cluster_ID}, processing now`
    );
    promises.push(
      processCluster(treatedClusters, osrm).then((treated) => {
        if (treated) {
          outputCsvActions.writeTreatedClusters(treated);
        }
        return;
      })
    );
  });

  await Promise.all(promises);

  outputCsvActions.closeCsv();
};

processClustersStreaming()
  .then(() => console.log(`Successfully processed ${countyName} for year ${year}`))
  .catch((error) => {
    console.error('Error during processing:', error);
    process.exit(1);
  });

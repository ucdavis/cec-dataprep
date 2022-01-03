import dotenv from 'dotenv';

import fs from 'fs';
import { TreatedCluster } from 'models/treatedcluster';
import { performance } from 'perf_hooks';
import readline from 'readline';

import { getCsvWriteStream } from './csvHelper';

dotenv.config();

// Given two files of treated clusters and a year span, generate interstertial cluster data for each year
// Assumptions
// we are always working with a given county and both files will represent that county N years apart
// both files have identical row counts and columns -- they vary only in the data they contain
const interpolateYears = async (
  fileBase: string,
  fileFuture: string,
  county: string,
  initialYear: number,
  yearsBetween: number
) => {
  console.log(`interpolating ${county} from ${initialYear} to ${initialYear + yearsBetween}`);

  const t0 = performance.now();

  // grab yearsBetween number of output files
  const outputFileStreams = [];

  for (let i = 0; i < yearsBetween; i++) {
    const outputCsvStream = getCsvWriteStream(
      (process.env.TREATED_OUT_DIRECTORY || './data/') +
        `${county}_testout_${initialYear + i + 1}.csv`
    );

    outputFileStreams.push(outputCsvStream);
  }

  // grab iterators for both input files
  const rlFileBase: any = readline.createInterface({
    input: fs.createReadStream(fileBase),
    crlfDelay: Infinity,
  });

  const rlFileFuture: any = readline.createInterface({
    input: fs.createReadStream(fileFuture),
    crlfDelay: Infinity,
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  // get an iterator for the file
  const itBase = rlFileBase[Symbol.asyncIterator]() as AsyncIterator<string>;
  const itFuture = rlFileFuture[Symbol.asyncIterator]() as AsyncIterator<string>;

  // first lines are headers, get them out of the way but keep track of them
  const headerBase: string = (await itBase.next()).value;
  const headerFuture: string = (await itFuture.next()).value;

  if (headerBase !== headerFuture) {
    throw new Error('headers do not match');
  }

  // put headers into an array for object building later
  const headers = headerBase
    .replace(/['"]+/g, '')
    .split(',')
    .map((h: string) => h.trim());

  // run until we hit the end of the file.
  let linesRead = 0;
  let fileEnd = false;
  while (!fileEnd) {
    linesRead++;

    if (linesRead % 50_000 === 0) {
      console.log(`processed ${linesRead} lines`);
    }

    const lineBase = await itBase.next();
    const lineFuture = await itFuture.next();

    if (lineBase.done || lineFuture.done) {
      fileEnd = true;
      break;
    }

    // get our pixel objects from each line
    const clusterBase = csvLineToTreatedCluster(headers, lineBase.value);
    const clusterFuture = csvLineToTreatedCluster(headers, lineFuture.value);

    // double check to make sure these are the same cluster
    if (clusterBase.cluster_no !== clusterFuture.cluster_no) {
      throw new Error('cluster numbers do not match');
    }

    // TODO: more checks? perhaps make sure year and county are the same as intended?

    // now we need to interpolate the pixel objects
    for (let j = 0; j < yearsBetween; j++) {
      const clusterInterpolated = await interpolateCluster(
        clusterBase,
        clusterFuture,
        yearsBetween,
        j + 1
      );

      // write the interpolated pixel to the output file
      outputFileStreams[j].writeTreatedClusters([clusterInterpolated]);
    }
  }

  // close all the output streams
  outputFileStreams.forEach((o) => o.closeCsv());

  const t1 = performance.now();
  console.log('Running took ' + (t1 - t0) + ' milliseconds.');
};

const interpolateCluster = async (
  clusterBase: TreatedCluster,
  clusterFuture: TreatedCluster,
  yearsBetween: number,
  yearDesired: number
) => {
  // for each biomass type, interpolate the values between two pixels
  // for expediency, we are going to assume biomass pixels follow _\d* format (_ follow by number)
  const interpolatedPixel: TreatedCluster = { ...clusterBase };

  for (const [key, val] of Object.entries(clusterBase)) {
    // make sure key ends with underscore followed by a number
    if (key.match(/_\d+$/)) {
      // we have a biomass key, interpolate the values
      const currentVal: number = (clusterBase as any)[key];
      const futureVal: number = (clusterFuture as any)[key];

      const interpolatedVal = (currentVal + (futureVal - currentVal) / yearsBetween) * yearDesired;

      (interpolatedPixel as any)[key] = interpolatedVal;
    }
  }

  interpolatedPixel.year += yearDesired;

  return interpolatedPixel;
};

const csvLineToTreatedCluster = (headers: string[], line: string): TreatedCluster => {
  const lineObj = line.split(',').reduce((prev: any, curr: string, idx: number) => {
    prev[headers[idx]] = isNaN(+curr) ? curr : +curr;

    return prev;
  }, {} as any);

  return lineObj as TreatedCluster;
};

const initializeAndProcess = async () => {
  await interpolateYears(
    './data/Tehama_fake_processed_2020.csv',
    './data/Tehama_fake_processed_2025.csv',
    'Tehama',
    2020,
    4
  );
};

initializeAndProcess()
  .then(() => console.log('all done with processing run'))
  .catch(console.error);

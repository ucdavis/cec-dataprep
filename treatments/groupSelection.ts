import { Pixel, PixelClass, PixelVariablesClass } from '../models/pixel';
import { CenterOfBiomassSum } from '../models/shared';
import { sumBiomass, sumPixel } from '../pixelCalculations';
import { processClearcut } from './clearcut';
import { processSelection } from './selection';

// equations from:
// https://ucdavis.app.box.com/file/593365602124

export const processGroupSelection = (
  pixels: Pixel[],
  centerOfBiomassSum: CenterOfBiomassSum,
  percent: number
): Pixel[] => {
  if (pixels[0].land_use === 'Forest') {
    throw new Error('selection with small tree removal cannot be performed on forest land');
  }

  // randomly pull 10% or 20% of pixels for clearcut
  let clearcutPixels: Pixel[] = getRandom(pixels, Math.floor(pixels.length * 0.1));
  // the rest are selection
  let selectionPixels: Pixel[] = pixels.filter(x => !clearcutPixels.includes(x));

  console.log('processing clearcut pixels');
  clearcutPixels = processClearcut(clearcutPixels, centerOfBiomassSum);
  console.log('after clearcut, biomass sum: ' + centerOfBiomassSum.biomassSum);
  console.log('processing selection pixels');
  selectionPixels = processSelection(selectionPixels, centerOfBiomassSum);
  console.log('after selection, biomass sum: ' + centerOfBiomassSum.biomassSum);

  const ret = [...clearcutPixels, ...selectionPixels];
  return ret;
};

export const tenPercentGroupSelection = (pixel: Pixel) => {
  let treatedPixel = new PixelClass();

  treatedPixel = {
    ...treatedPixel,
    cluster_no: pixel.cluster_no,
    elevation: pixel.elevation,
    county: pixel.county,
    land_use: pixel.land_use,
    cluster1: pixel.cluster1,
    cluster2: pixel.cluster2,
    x: pixel.x,
    y: pixel.y
  };
  return treatedPixel;
};

// https://stackoverflow.com/questions/19269545/how-to-get-n-no-elements-randomly-from-an-array
const getRandom = (arr: Pixel[], n: number) => {
  const result = new Array(n);
  let len = arr.length;
  const taken = new Array(len);
  if (n > len) {
    throw new RangeError('getRandom: more elements taken than available');
  }
  while (n--) {
    const x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
};

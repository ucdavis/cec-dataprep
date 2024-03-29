import { Pixel } from '../models/pixel';
import { CenterOfBiomassSum } from '../models/shared';
import { isPrivateLandUse } from '../pixelCalculations';
import { processClearcut } from './clearcut';
import { processSelection } from './selection';

export const processGroupSelection = (
  pixels: Pixel[],
  centerOfBiomassSum: CenterOfBiomassSum,
  percent: number
): Pixel[] => {
  if (!isPrivateLandUse(pixels[0].land_use)) {
    throw new Error('group selection can only be performed on private land');
  }
  // console.log('group selection: processing pixels');

  // randomly pull 10% or 20% of pixels for clearcut
  let clearcutPixels: Pixel[] = getRandom(pixels, Math.floor(pixels.length * (percent / 100)));
  // the rest are selection
  let selectionPixels: Pixel[] = pixels.filter((x) => !clearcutPixels.includes(x));

  clearcutPixels = processClearcut(clearcutPixels, centerOfBiomassSum, 'groupSelection');
  selectionPixels = processSelection(selectionPixels, centerOfBiomassSum, 'groupSelection');

  const ret = [...clearcutPixels, ...selectionPixels];
  return ret;
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

import { Pixel, PixelClass, PixelVariables, PixelVariablesClass } from '../models/pixel';
import { CenterOfBiomassSum } from '../models/shared';
import { calculateCenterOfBiomass, sumPixel } from '../pixelCalculations';

// equations from:
// https://ucdavis.app.box.com/file/593365602124
export const processCommercialThin = (pixels: Pixel[], centerOfBiomassSum: CenterOfBiomassSum) => {
  if (pixels[0].land_use === 'Forest') {
    throw new Error('commercial thin cannot be performed on forest land');
  }
  console.log('calculating p values...');
  const { p15, p25, p35, p40 } = calculatePValues(pixels);
  console.log(`p15: ${p15} p25:${p25} p35:${p35} p40:${p40}`);
  console.log('treating pixels...');
  const treatedPixels = pixels.map(pixel => {
    // treat pixel
    const treatedPixel = commercialThin(pixel, p15, p25, p35, p40);
    // this will update centerOfBiomassSum
    calculateCenterOfBiomass(centerOfBiomassSum, treatedPixel);
    return treatedPixel;
  });
  return treatedPixels;
};

// Same as Commercial thin but with the additional removal ofsmall trees in the following proportions:
// 0-1" DBH -20%, 1-5" DBH -50%, 5-10" DBH -80%
export const processCommericalThinSmallTreeRemoval = (
  pixels: Pixel[],
  centerOfBiomassSum: CenterOfBiomassSum
) => {
  if (pixels[0].land_use === 'Forest') {
    throw new Error('commercial thin cannot be performed on forest land');
  }
  console.log('calculating p values...');
  const { p15, p25, p35, p40 } = calculatePValues(pixels);
  console.log(`p15: ${p15} p25:${p25} p35:${p35} p40:${p40}`);
  console.log('treating pixels...');
  const treatedPixels = pixels.map(pixel => {
    // treat pixel
    const treatedPixel = commericalThinSmallTreeRemoval(pixel, p15, p25, p35, p40);
    // this will update centerOfBiomassSum
    calculateCenterOfBiomass(centerOfBiomassSum, treatedPixel);
    return treatedPixel;
  });
  return treatedPixels;
};

// All live and dead trees over 10 inches cut.
// For smaller size classes, cut at the following proportions for both live and dead:
// 0-1" DBH -30%, 1-5" DBH -60%, 5-10" DBH -90%
const commercialThin = (
  pixel: Pixel,
  p15: number,
  p25: number,
  p35: number,
  p40: number
): Pixel => {
  let treatedPixel = new PixelClass();
  treatedPixel = {
    ...treatedPixel,
    cluster_no: pixel.cluster_no,
    elevation: pixel.elevation,
    county: pixel.county,
    land_use: pixel.land_use,
    sit_raster: pixel.sit_raster,
    cluster1: pixel.cluster1,
    cluster2: pixel.cluster2,
    x: pixel.x,
    y: pixel.y,

    bmcwn_15: (p15 / 100) * pixel.bmcwn_15,
    bmcwn_25: (p25 / 100) * pixel.bmcwn_25,
    bmcwn_35: (p35 / 100) * pixel.bmcwn_35,
    bmcwn_40: (p40 / 100) * pixel.bmcwn_40,

    // tpa removed
    tpa_15: (p15 / 100) * pixel.tpa_15,
    tpa_25: (p25 / 100) * pixel.tpa_25,
    tpa_35: (p35 / 100) * pixel.tpa_35,
    tpa_40: (p40 / 100) * pixel.tpa_40,

    vol_15: (p15 / 100) * pixel.vol_15,
    vol_25: (p25 / 100) * pixel.vol_25,
    vol_35: (p35 / 100) * pixel.vol_35,
    vol_40: (p40 / 100) * pixel.vol_40,

    // basal area
    ba_15: (p15 / 100) * pixel.ba_15, // is this right?
    ba_25: (p25 / 100) * pixel.ba_25,
    ba_35: (p35 / 100) * pixel.ba_35,
    ba_40: (p40 / 100) * pixel.ba_40,

    basa_as: pixel.basa_as,
    basa_ra: pixel.basa_ra,
    basa_wi: pixel.basa_wi
  };
  return treatedPixel;
};

// Same as Commercial thin but with the additional removal ofsmall trees in the following proportions:
// 0-1" DBH -20%, 1-5" DBH -50%, 5-10" DBH -80%
const commericalThinSmallTreeRemoval = (
  pixel: Pixel,
  p15: number,
  p25: number,
  p35: number,
  p40: number
): Pixel => {
  const isPrivate = pixel.land_use === 'Private';
  const c0 = 0.2;
  const c2 = isPrivate ? 0.5 : 0.85;
  const c7 = isPrivate ? 0.8 : 0.9;

  let treatedPixel = commercialThin(pixel, p15, p25, p35, p40);
  treatedPixel = {
    ...treatedPixel,
    // biomass removed
    bmstm_0: c0 * pixel.bmstm_0,
    bmcwn_0: c0 * pixel.bmcwn_0,
    dbmsm_0: c0 * pixel.dbmsm_0,
    dbmcn_0: c0 * pixel.dbmcn_0,

    bmstm_2: c2 * pixel.bmstm_2,
    bmcwn_2: c2 * pixel.bmcwn_2,
    dbmsm_2: c2 * pixel.dbmsm_2,
    dbmcn_2: c2 * pixel.dbmcn_2,

    bmstm_7: c7 * pixel.bmstm_7,
    bmcwn_7: c7 * pixel.bmcwn_7,
    dbmsm_7: c7 * pixel.dbmsm_7,
    dbmcn_7: c7 * pixel.dbmcn_7,

    // tpa removed
    tpa_0: c0 * pixel.tpa_0,
    sng_0: c0 * pixel.sng_0,

    tpa_2: c2 * pixel.tpa_2,
    sng_2: c2 * pixel.sng_2,

    tpa_7: c7 * pixel.tpa_7,
    sng_7: c7 * pixel.sng_7,

    // volume removed
    // vol_0: c0 * pixel.vol_0,
    vmsg_0: c0 * pixel.vmsg_0,
    vol_2: c2 * pixel.vol_2,
    vmsg_2: c2 * pixel.vmsg_2,
    vol_7: c7 * pixel.vol_7,
    vmsg_7: c7 * pixel.vmsg_7,

    ba_0: c0 * pixel.ba_0,
    ba_2: c2 * pixel.ba_2,
    ba_7: c7 * pixel.ba_7
  };
  return treatedPixel;
};

const calculatePValues = (pixels: Pixel[]) => {
  // first get cluster level data
  console.log('summing pixels...');
  let pixelSum = new PixelVariablesClass();
  pixels.map(p => (pixelSum = sumPixel(pixelSum, p)));
  // average based on the number of pixels in cluster
  pixelSum.ba_15 = pixelSum.ba_15 / pixels.length;
  pixelSum.ba_25 = pixelSum.ba_25 / pixels.length;
  pixelSum.ba_35 = pixelSum.ba_35 / pixels.length;
  pixelSum.ba_40 = pixelSum.ba_40 / pixels.length;

  pixelSum.bmcwn_15 = pixelSum.bmcwn_15 / pixels.length;
  pixelSum.bmcwn_25 = pixelSum.bmcwn_25 / pixels.length;
  pixelSum.bmcwn_35 = pixelSum.bmcwn_35 / pixels.length;
  pixelSum.bmcwn_40 = pixelSum.bmcwn_40 / pixels.length;

  console.log('pixel sum:');
  console.log(pixelSum);
  // residual_BA_target is determined by the site class and forest type
  // it represents the BA that will remain in the forest after we remove biomass
  // a lower site class = more productive forest = higher residual BA target
  const residualBaTarget = 100; // ft^2/ac
  // these p values represent the percentage of each size class we are removing
  let p15 = 0;
  let p25 = 0;
  let p35 = 0;
  let p40 = 0;
  let residualBa = calculateResidualBa(pixelSum, p15, p25, p35, p40);
  console.log(`residualBa: ${residualBa}`);
  // our goal here is to find p values such that our calculated residual BA = the residual BA target
  // starting with smaller trees and working our way up
  while (residualBa !== residualBaTarget && p15 < 100) {
    console.log(`p15: ${p15}, residualBa: ${residualBa}, residualBaTarget: ${residualBaTarget}`);
    const percentDifference = Number(
      (
        (Math.abs(residualBa - residualBaTarget) / ((residualBa + residualBaTarget) / 2)) *
        100
      ).toFixed(0)
    );
    console.log('percent difference: ' + percentDifference);
    p15 += percentDifference;
    if (p15 > 100) {
      p15 -= Math.abs(100 - p15);
    }
    residualBa = calculateResidualBa(pixelSum, p15, p25, p35, p40);
  }
  console.log(`p15: ${p15}, residualBa: ${residualBa}`);
  console.log('-----------------');
  while (residualBa !== residualBaTarget && p25 < 100) {
    console.log(`p25: ${p25}, residualBa: ${residualBa}, residualBaTarget: ${residualBaTarget}`);
    const percentDifference = Number(
      (
        (Math.abs(residualBa - residualBaTarget) / ((residualBa + residualBaTarget) / 2)) *
        100
      ).toFixed(0)
    );
    console.log('percent difference: ' + percentDifference);
    p25 += percentDifference;
    if (p25 > 100) {
      p25 -= Math.abs(100 - p25);
    }
    residualBa = calculateResidualBa(pixelSum, p15, p25, p35, p40);
  }
  console.log(`p25: ${p25}, residualBa: ${residualBa}`);
  console.log('-----------------');
  while (residualBa !== residualBaTarget && p35 < 100) {
    console.log(`p35: ${p35}, residualBa: ${residualBa}, residualBaTarget: ${residualBaTarget}`);
    const percentDifference = Number(
      (
        (Math.abs(residualBa - residualBaTarget) / ((residualBa + residualBaTarget) / 2)) *
        100
      ).toFixed(0)
    );
    console.log('percent difference: ' + percentDifference);
    p35 += percentDifference;
    if (p35 > 100) {
      p35 -= Math.abs(100 - p35);
    }
    residualBa = calculateResidualBa(pixelSum, p15, p25, p35, p40);
  }
  console.log(`p35: ${p35}, residualBa: ${residualBa}`);
  console.log('-----------------');

  while (residualBa !== residualBaTarget && p40 < 100) {
    console.log(`p40: ${p40}, residualBa: ${residualBa}, residualBaTarget: ${residualBaTarget}`);
    const percentDifference = Number(
      (
        (Math.abs(residualBa - residualBaTarget) / ((residualBa + residualBaTarget) / 2)) *
        100
      ).toFixed(0)
    );
    console.log('percent difference: ' + percentDifference);
    p40 += percentDifference;
    if (p40 > 100) {
      p40 -= Math.abs(100 - p40);
    }
    residualBa = calculateResidualBa(pixelSum, p15, p25, p35, p40);
  }
  console.log(`p40: ${p40}, residualBa: ${residualBa}`);
  console.log('-----------------');

  // ---
  return { p15, p25, p35, p40 };
  // return { p15: p15_naive, p25: p25_naive, p35: p35_naive, p40: p40_naive };
};

const calculateResidualBa = (
  pixelSum: PixelVariables,
  p15: number,
  p25: number,
  p35: number,
  p40: number
) => {
  return Number(
    (
      ((100 - p15) / 100) * pixelSum.ba_15 +
      ((100 - p25) / 100) * pixelSum.ba_25 +
      ((100 - p35) / 100) * pixelSum.ba_35 +
      ((100 - p40) / 100) * pixelSum.ba_40
    ).toFixed(0)
  );
};

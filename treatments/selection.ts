import { Pixel, PixelClass, PixelVariables, PixelVariablesClass } from '../models/pixel';
import { CenterOfBiomassSum } from '../models/shared';
import { calculateCenterOfBiomass, getPixelSum, isForestLandUse, isPrivateLandUse } from '../pixelCalculations';

// equations from:
// https://ucdavis.app.box.com/file/593365602124
// https://ucdavis.app.box.com/file/689378449650
export const processSelection = (
  pixels: Pixel[],
  centerOfBiomassSum: CenterOfBiomassSum,
  treatmentName?: string
) => {
  if (treatmentName === 'selection' && !isPrivateLandUse(pixels[0].land_use)) {
    throw new Error('selection can only be performed on private land');
  }
  const { p, p_large } = calculatePValues(pixels);
  // console.log('selection: processing pixels with p value: ' + p);
  const treatedPixels = pixels.map(pixel => {
    // treat pixel
    const treatedPixel = selection(pixel, p, p_large);
    // this will update centerOfBiomassSum
    calculateCenterOfBiomass(centerOfBiomassSum, treatedPixel);
    return treatedPixel;
  });
  return treatedPixels;
};

// Same as Commercial thin but with the additional removal ofsmall trees in the following proportions:
// 0-1" DBH -20%, 1-5" DBH -50%, 5-10" DBH -80%
export const processSelectionChipTreeRemoval = (
  pixels: Pixel[],
  centerOfBiomassSum: CenterOfBiomassSum
) => {
  if (!isPrivateLandUse(pixels[0].land_use)) {
    throw new Error('selection with small tree removal can only be performed on private land');
  }
  const { p, p_large } = calculatePValues(pixels);
  // console.log('selection chip tree removal: processing pixels with p value: ' + p);

  const treatedPixels = pixels.map(pixel => {
    // treat pixel
    const treatedPixel = selectionChipTreeRemoval(pixel, p, p_large);
    // this will update centerOfBiomassSum
    calculateCenterOfBiomass(centerOfBiomassSum, treatedPixel);
    return treatedPixel;
  });
  return treatedPixels;
};

// All live and dead trees over 10 inches cut.
// For smaller size classes, cut at the following proportions for both live and dead:
// 0-1" DBH -30%, 1-5" DBH -60%, 5-10" DBH -90%
const selection = (pixel: Pixel, p: number, p_large: number): Pixel => {
  // if p_large is 0, then it means the condition to set it was not met, and we should not use it
  const p_large_or_small = !!p_large ? p_large : p;
  let treatedPixel = new PixelClass();
  treatedPixel = {
    ...treatedPixel,
    cluster_no: pixel.cluster_no,
    elevation: pixel.elevation,
    county_name: pixel.county_name,
    land_use: pixel.land_use,
    site_class: pixel.site_class,
    forest_type: pixel.forest_type,
    haz_class: pixel.haz_class,

    lat: pixel.lat,
    lng: pixel.lng,

    // feedstock removed
    bmcwn_15: p * pixel.bmcwn_15,
    bmcwn_25: p_large_or_small * pixel.bmcwn_25,
    bmcwn_35: p_large_or_small * pixel.bmcwn_35,
    bmcwn_40: p_large_or_small * pixel.bmcwn_40,

    // saw log removed
    bmstm_15: p * pixel.bmstm_15,
    bmstm_25: p_large_or_small * pixel.bmstm_25,
    bmstm_35: p_large_or_small * pixel.bmstm_35,
    bmstm_40: p_large_or_small * pixel.bmstm_40,

    // tpa removed
    tpa_15: p * pixel.tpa_15,
    tpa_25: p_large_or_small * pixel.tpa_25,
    tpa_35: p_large_or_small * pixel.tpa_35,
    tpa_40: p_large_or_small * pixel.tpa_40,

    vol_15: p * pixel.vol_15,
    vol_25: p_large_or_small * pixel.vol_25,
    vol_35: p_large_or_small * pixel.vol_35,
    vol_40: p_large_or_small * pixel.vol_40,

    // basal area
    ba_15: p * pixel.ba_15,
    ba_25: p * pixel.ba_25,
    ba_35: p * pixel.ba_35,
    ba_40: p * pixel.ba_40
  };
  return treatedPixel;
};

// Same as Commercial thin but with the additional removal ofsmall trees in the following proportions:
// 0-1" DBH -20%, 1-5" DBH -50%, 5-10" DBH -80%
const selectionChipTreeRemoval = (pixel: Pixel, p: number, p_large: number): Pixel => {
  const isPrivate = isPrivateLandUse(pixel.land_use);
  const c2 = isPrivate ? 0.5 : 0.85;
  const c7 = isPrivate ? 0.8 : 0.9;

  let treatedPixel = selection(pixel, p, p_large);
  treatedPixel = {
    ...treatedPixel,
    // biomass removed
    bmstm_2: c2 * pixel.bmstm_2,
    bmcwn_2: c2 * pixel.bmcwn_2,
    dbmsm_2: c2 * pixel.dbmsm_2,
    dbmcn_2: c2 * pixel.dbmcn_2,

    bmstm_7: c7 * pixel.bmstm_7,
    bmcwn_7: c7 * pixel.bmcwn_7,
    dbmsm_7: c7 * pixel.dbmsm_7,
    dbmcn_7: c7 * pixel.dbmcn_7,

    // tpa removed
    tpa_2: c2 * pixel.tpa_2,
    sng_2: c2 * pixel.sng_2,

    tpa_7: c7 * pixel.tpa_7,
    sng_7: c7 * pixel.sng_7,

    // volume removed
    vol_2: c2 * pixel.vol_2,
    vmsg_2: c2 * pixel.vmsg_2,
    vol_7: c7 * pixel.vol_7,
    vmsg_7: c7 * pixel.vmsg_7,

    ba_2: c2 * pixel.ba_2,
    ba_7: c7 * pixel.ba_7
  };
  return treatedPixel;
};

// https://ucdavis.app.box.com/file/689378449650
const calculatePValues = (pixels: Pixel[]) => {
  // first get cluster level data
  const pixelSum = getPixelSum(pixels);

  // p value represents the percentage we are removing
  let p = 0;
  let p_large = 0; // p large will only be > 0 if we should use it

  // residual_ba is determined by the site class
  // it represents the BA that will remain in the forest after we remove biomass
  // a lower site class = more productive forest = higher residual BA target
  const residual_ba = calculateResidualBaTarget(pixelSum); // ft^2/ac
  const residual_large_ba = calculateResidualLargeBaTarget(pixelSum);

  // get BA for cluster, since pixelSum is the sum of each pixel we must correct units by * n_pixels
  const ba_15_cluster = pixelSum.ba_15 / pixels.length;
  const ba_25_cluster = pixelSum.ba_25 / pixels.length;
  const ba_35_cluster = pixelSum.ba_35 / pixels.length;
  const ba_40_cluster = pixelSum.ba_40 / pixels.length;

  const initial_ba = ba_15_cluster + ba_25_cluster + ba_35_cluster + ba_40_cluster;

  // this is how much ba we will remove, since we are leaving the cluster with ba = residual_ba
  const ba_removed = initial_ba - residual_ba;
  if (ba_removed <= 0) {
    // if initial_ba < residual_ba, we can't remove anything
    throw new Error(`initial_ba(${initial_ba}) < residual_ba(${residual_ba})`);
  }
  p = 1 - residual_ba / initial_ba;

  if ((1 - p) * (ba_25_cluster + ba_35_cluster + ba_40_cluster) < residual_large_ba) {
    p_large = 1 - residual_large_ba / (ba_25_cluster + ba_35_cluster + ba_40_cluster);
  }

  return { p, p_large };
};

const calculateResidualBaTarget = (pixel: PixelVariables) => {
  // returns ft2/ac
  const { site_class: sit_raster } = pixel;
  if (sit_raster === 1) {
    return 100;
  } else if (sit_raster === 2 || sit_raster === 3) {
    return 75;
  } else if (sit_raster === 4 || sit_raster === 5) {
    return 50;
  } else {
    throw new Error(`sit_raster is ${sit_raster}, and must be 1-5`);
  }
};

const calculateResidualLargeBaTarget = (pixel: PixelVariables) => {
  const { site_class: sit_raster } = pixel;
  if (sit_raster === 1 || sit_raster === 2 || sit_raster === 3) {
    return 15; // ft2/ac
  } else if (sit_raster === 4 || sit_raster === 5) {
    return 12; // ft2/ac
  } else {
    throw new Error(`sit_raster is ${sit_raster}, and must be 1-5`);
  }
};

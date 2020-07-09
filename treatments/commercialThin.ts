import { Pixel, PixelClass, PixelVariables } from '../models/pixel';
import { CenterOfBiomassSum } from '../models/shared';
import { calculateCenterOfBiomass, getPixelSum } from '../pixelCalculations';

// equations from:
// https://ucdavis.app.box.com/file/593365602124
export const processCommercialThin = (pixels: Pixel[], centerOfBiomassSum: CenterOfBiomassSum) => {
  if (pixels[0].land_use === 'Forest') {
    throw new Error('commercial thin cannot be performed on forest land');
  }
  // console.log('commercial thin: processing pixels');
  // console.log('calculating p values...');
  const { p15, p25, p35, p40 } = calculatePValues(pixels);
  // console.log(`p15: ${p15} p25:${p25} p35:${p35} p40:${p40}`);
  // console.log('treating pixels...');
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
export const processCommericalThinChipTreeRemoval = (
  pixels: Pixel[],
  centerOfBiomassSum: CenterOfBiomassSum
) => {
  // console.log('commercial thin chip tree: processing pixels');
  // console.log('calculating p values...');
  const { p15, p25, p35, p40 } = calculatePValues(pixels);
  // console.log(`p15: ${p15} p25:${p25} p35:${p35} p40:${p40}`);
  // console.log('treating pixels...');
  const treatedPixels = pixels.map(pixel => {
    // treat pixel
    const treatedPixel = commericalThinChipTreeRemoval(pixel, p15, p25, p35, p40);
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
    forest_type: pixel.forest_type,
    cluster1: pixel.cluster1,
    cluster2: pixel.cluster2,
    x: pixel.x,
    y: pixel.y,

    bmcwn_15: p15 * pixel.bmcwn_15,
    bmcwn_25: p25 * pixel.bmcwn_25,
    bmcwn_35: p35 * pixel.bmcwn_35,
    bmcwn_40: p40 * pixel.bmcwn_40,

    // tpa removed
    tpa_15: p15 * pixel.tpa_15,
    tpa_25: p25 * pixel.tpa_25,
    tpa_35: p35 * pixel.tpa_35,
    tpa_40: p40 * pixel.tpa_40,

    vol_15: p15 * pixel.vol_15,
    vol_25: p25 * pixel.vol_25,
    vol_35: p35 * pixel.vol_35,
    vol_40: p40 * pixel.vol_40,

    // basal area
    ba_15: p15 * pixel.ba_15, // is this right?
    ba_25: p25 * pixel.ba_25,
    ba_35: p35 * pixel.ba_35,
    ba_40: p40 * pixel.ba_40
  };
  return treatedPixel;
};

// Same as Commercial thin but with the additional removal ofsmall trees in the following proportions:
// 0-1" DBH -20%, 1-5" DBH -50%, 5-10" DBH -80%
const commericalThinChipTreeRemoval = (
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

// https://ucdavis.app.box.com/file/686906426849
const calculatePValues = (pixels: Pixel[]) => {
  // first get cluster level data
  const pixelSum = getPixelSum(pixels);

  // these p values represent the percentage of each size class we are removing
  let p15 = 0;
  let p25 = 0;
  let p35 = 0;
  let p40 = 0;

  // residual_ba is determined by the site class and forest type
  // it represents the BA that will remain in the forest after we remove biomass
  // a lower site class = more productive forest = higher residual BA target
  const residual_ba = calculateResidualBaTarget(pixelSum); // ft^2/ac

  // get BA for cluster, since pixelSum is the sum of each pixel we must correct units by * n_pixels
  const ba_15_cluster = pixelSum.ba_15 / pixels.length;
  const ba_25_cluster = pixelSum.ba_25 / pixels.length;
  const ba_35_cluster = pixelSum.ba_35 / pixels.length;
  const ba_40_cluster = pixelSum.ba_40 / pixels.length;

  const initial_ba = ba_15_cluster + ba_25_cluster + ba_35_cluster + ba_40_cluster;

  // this is how much ba we will remove, since we are leaving the cluster with ba = residual_ba
  const ba_removed = initial_ba - residual_ba;

  if (initial_ba < residual_ba) {
    // if we can't remove any ba, do nothing
    // this will produce an error when we do the test at the end, and no result will be pushed
    // p15, p25, p35, p40 = 0
  }
  // if we can just take from the smallest size class (15)
  else if (ba_removed < ba_15_cluster) {
    p15 = ba_removed / ba_15_cluster;
    // p25, p35, p40 = 0
  } else if (ba_removed < ba_15_cluster + ba_25_cluster) {
    // if we need size class 15 and 25
    p15 = 1; // take 100% of 15
    p25 = (ba_removed - ba_15_cluster) / ba_25_cluster; // then whatever percentage we need of 25
    // p35, p40 = 0
  } else if (ba_removed < ba_15_cluster + ba_25_cluster + ba_35_cluster) {
    // if we need size class 15, 25, and 35
    p15 = 1; // take 100% of 15
    p25 = 1; // take 100% of 25
    p35 = (ba_removed - ba_15_cluster - ba_25_cluster) / ba_35_cluster; // then whatever percentage we need of 35
    // p40 = 0
  } else {
    // if we need size class 15, 25, 35, 40
    p15 = 1; // take 100% of 15
    p25 = 1; // take 100% of 25
    p35 = 1; // take 100% of 35
    p40 = (ba_removed - ba_15_cluster - ba_25_cluster - ba_35_cluster) / ba_40_cluster;
    // then whatever percentage we need of 35
  }

  const residual_ba_test = Math.round(
    (1 - p15) * ba_15_cluster +
      (1 - p25) * ba_25_cluster +
      (1 - p35) * ba_35_cluster +
      (1 - p40) * ba_40_cluster
  );

  // ---
  // console.log(`p values: p15:${p15}, p25:${p25}, p35:${p35}, p40:${p40}, `);
  // console.log(
  //   `initial_ba: ${initial_ba} residual_ba: ${residual_ba}, residual_ba_test: ${residual_ba_test}`
  // );
  if (residual_ba !== residual_ba_test) {
    throw new Error('residual_ba !== residual_ba_test');
  }
  return { p15, p25, p35, p40 };
};

const calculateResidualBaTarget = (pixel: PixelVariables) => {
  const { sit_raster, forest_type } = pixel;
  if (sit_raster === 1) {
    if (forest_type === 'mixed_conifer') {
      return 125;
    }
    if (forest_type === 'pine') {
      return 100;
    }
    // forest_type === other?
  }
  if (sit_raster === 2) {
    if (forest_type === 'mixed_conifer') {
      return 100;
    }
    if (forest_type === 'pine') {
      return 75;
    }
    // forest_type === other?
  }
  if (sit_raster === 3) {
    if (forest_type === 'mixed_conifer' || forest_type === 'pine') {
      return 75;
    }
    // forest_type === other?
  }
  if (sit_raster === 4 || sit_raster === 5) {
    if (forest_type === 'mixed_conifer' || forest_type === 'pine') {
      return 50;
    }
    // forest_type === other?
  }
  // sit_raster = 0, 6, 7?
  return 100;
  // throw new Error(`unhandled site class ${sit_raster} and forest type ${forest_type}`);
};
// tslint:disable-next-line: max-file-line-count

import { Pixel, PixelClass, PixelVariables } from '../models/pixel';
import { CenterOfBiomassSum } from '../models/shared';
import {
  calculateCenterOfBiomass,
  getPixelSum,
  isForestLandUse,
  isPrivateLandUse,
} from '../pixelCalculations';

// equations from:
// https://ucdavis.app.box.com/file/883519288218
export const processCommercialThin = (pixels: Pixel[], centerOfBiomassSum: CenterOfBiomassSum) => {
  if (!isPrivateLandUse(pixels[0].land_use)) {
    throw new Error('commercial thin can only be performed on private land');
  }
  // console.log('commercial thin: processing pixels');
  // console.log('calculating p values...');
  const { p15, p25, p35, p40 } = calculatePValues(pixels);
  // console.log(`p15: ${p15} p25:${p25} p35:${p35} p40:${p40}`);
  // console.log('treating pixels...');
  const treatedPixels = pixels.map((pixel) => {
    // treat pixel
    const treatedPixel = commercialThin(pixel, p15, p25, p35, p40);
    // this will update centerOfBiomassSum
    calculateCenterOfBiomass(centerOfBiomassSum, treatedPixel);
    return treatedPixel;
  });
  return treatedPixels;
};

// Same as Commercial thin but with the additional removal of small trees in the following proportions:
export const processCommericalThinChipTreeRemoval = (
  pixels: Pixel[],
  centerOfBiomassSum: CenterOfBiomassSum
) => {
  // console.log('commercial thin chip tree: processing pixels');
  // console.log('calculating p values...');
  const { p15, p25, p35, p40 } = calculatePValues(pixels);
  // console.log(`p15: ${p15} p25:${p25} p35:${p35} p40:${p40}`);
  // console.log('treating pixels...');
  const treatedPixels = pixels.map((pixel) => {
    // treat pixel
    const treatedPixel = commericalThinChipTreeRemoval(pixel, p15, p25, p35, p40);
    // this will update centerOfBiomassSum
    calculateCenterOfBiomass(centerOfBiomassSum, treatedPixel);
    return treatedPixel;
  });
  return treatedPixels;
};

// Remove live trees > 10 inches DBH,
// starting with small ones closest to 10” until a certain residual basal area is reached, which is based on site class
// For smaller size classes, cut at the following proportions for both live and dead:
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
    county_name: pixel.county_name,
    land_use: pixel.land_use,
    site_class: pixel.site_class,
    forest_type: pixel.forest_type,
    haz_class: pixel.haz_class,

    lng: pixel.lng,
    lat: pixel.lat,

    // feedstock removed
    bmcwn_15: p15 * pixel.bmcwn_15,
    bmcwn_25: p25 * pixel.bmcwn_25,
    bmcwn_35: p35 * pixel.bmcwn_35,
    bmcwn_40: p40 * pixel.bmcwn_40,

    // saw log removed
    bmstm_15: p15 * pixel.bmstm_15,
    bmstm_25: p25 * pixel.bmstm_25,
    bmstm_35: p35 * pixel.bmstm_35,
    bmstm_40: p40 * pixel.bmstm_40,

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
    ba_15: p15 * pixel.ba_15,
    ba_25: p25 * pixel.ba_25,
    ba_35: p35 * pixel.ba_35,
    ba_40: p40 * pixel.ba_40,
  };
  return treatedPixel;
};

// Same as Commercial thin but with the additional removal ofsmall trees in the following proportions:
// Private: 1-5" DBH - 50%, 5-10" DBH - 80%
// Private: 1-5" DBH - 85%, 5-10" DBH - 90%
const commericalThinChipTreeRemoval = (
  pixel: Pixel,
  p15: number,
  p25: number,
  p35: number,
  p40: number
): Pixel => {
  const isPrivate = isPrivateLandUse(pixel.land_use);
  const isForest = isForestLandUse(pixel.land_use);
  const c2 = isPrivate ? 0.5 : isForest ? 0.85 : 1.0;
  const c7 = isPrivate ? 0.8 : isForest ? 0.9 : 1.0;

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
    ba_7: c7 * pixel.ba_7,
  };
  return treatedPixel;
};

// https://ucdavis.app.box.com/file/883513836273
const calculatePValues = (pixels: Pixel[]) => {
  // first get cluster level data
  const pixelSum = getPixelSum(pixels);

  // these p values represent the percentage of each size class we are removing
  let p15 = 0;
  let p25 = 0;
  let p35 = 0;
  let p40 = 0;

  // residual_ba is determined by the site class and forest type
  // it represents the basal area that will remain in the forest after we remove biomass
  // a lower site class = more productive forest = higher residual BA target
  const residual_ba = calculateResidualBaTarget(pixelSum); // ft^2/ac

  // get BA for cluster, since pixelSum is the sum of each pixel we must correct units by * n_pixels
  const ba_15_cluster = pixelSum.ba_15 / pixels.length;
  const ba_25_cluster = pixelSum.ba_25 / pixels.length;
  const ba_35_cluster = pixelSum.ba_35 / pixels.length;
  const ba_40_cluster = pixelSum.ba_40 / pixels.length;

  const initial_ba = ba_15_cluster + ba_25_cluster + ba_35_cluster + ba_40_cluster;

  if (initial_ba <= residual_ba) {
    // if we can't remove any ba, throw an error
    throw new Error(`initial ba: ${initial_ba} < residual_ba ${residual_ba}`);
    // p15, p25, p35, p40 = 0
  }

  // this is how much ba we will remove, since we are leaving the cluster with ba = residual_ba
  const ba_removed = initial_ba - residual_ba;

  if (ba_removed <= ba_15_cluster && ba_removed < ba_15_cluster + ba_25_cluster) {
    // if we can just take from the smallest size class (15)
    p15 = ba_removed / ba_15_cluster;
    // p25, p35, p40 = 0
  }
  if (ba_removed > ba_15_cluster && ba_removed <= ba_15_cluster + ba_25_cluster) {
    // if we need size class 15 and some of 25
    p15 = 1; // take 100% of 15
    p25 = (ba_removed - ba_15_cluster) / ba_25_cluster; // then whatever percentage we need of 25
    // p35, p40 = 0
  }
  if (ba_removed > ba_15_cluster + ba_25_cluster && isForestLandUse(pixelSum.land_use)) {
    // if we need all of 15 and 25, but we are on forest land
    // do not harvest anything over 30
    p15 = p25 = 1;
    // p35 = p40 = 0;
  }
  if (
    ba_removed > ba_15_cluster + ba_25_cluster &&
    ba_removed <= ba_15_cluster + ba_25_cluster + ba_35_cluster &&
    isPrivateLandUse(pixelSum.land_use)
  ) {
    // if we need size class 15, 25, and 35, and are on private land
    p15 = 1; // take 100% of 15
    p25 = 1; // take 100% of 25
    p35 = (ba_removed - ba_15_cluster - ba_25_cluster) / ba_35_cluster;
    // p40 = 0
  }
  if (
    ba_removed > ba_15_cluster + ba_25_cluster + ba_35_cluster &&
    isPrivateLandUse(pixelSum.land_use)
  ) {
    // if we need size class 15, 25, 35, 40
    p15 = 1; // take 100% of 15
    p25 = 1; // take 100% of 25
    p35 = 1; // take 100% of 35
    p40 = (ba_removed - ba_15_cluster - ba_25_cluster - ba_35_cluster) / ba_40_cluster;
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
    throw new Error(`residual_ba: ${residual_ba} !== residual_ba_test: ${residual_ba_test}`);
  }
  return { p15, p25, p35, p40 };
};

const calculateResidualBaTarget = (pixel: PixelVariables) => {
  const { site_class: sit_raster, forest_type } = pixel;
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
  throw new Error(`unhandled site class ${sit_raster} and forest type ${forest_type}`);
};

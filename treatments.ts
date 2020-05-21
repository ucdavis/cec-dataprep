import { Pixel, PixelClass } from './models/pixel';

// equations from:
// https://ucdavis.app.box.com/file/593365602124

// All live and dead trees over 10 inches cut.
// For smaller size classes, cut at the following proportions for both live and dead:
// 0-1" DBH -30%, 1-5" DBH -60%, 5-10" DBH -90%
export const clearcut = (pixel: Pixel): Pixel => {
  if (pixel.land_use === 'Forest') {
    throw new Error('clearcut cannot be performed on forest land');
  }
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

    // biomass removed
    bmstm_0: 0.3 * pixel.bmstm_0,
    bmcwn_0: 0.3 * pixel.bmcwn_0,
    dbmsm_0: 0.3 * pixel.dbmsm_0,
    dbmcn_0: 0.3 * pixel.dbmcn_0,

    bmstm_2: 0.6 * pixel.bmstm_2,
    bmcwn_2: 0.6 * pixel.bmcwn_2,
    dbmsm_2: 0.6 * pixel.dbmsm_2,
    dbmcn_2: 0.6 * pixel.dbmcn_2,

    bmstm_7: 0.9 * pixel.bmstm_7,
    bmcwn_7: 0.9 * pixel.bmcwn_7,
    dbmsm_7: 0.9 * pixel.dbmsm_7,
    dbmcn_7: 0.9 * pixel.dbmcn_7,

    bmcwn_15: pixel.bmcwn_15,
    bmcwn_25: pixel.bmcwn_25,
    bmcwn_35: pixel.bmcwn_35,
    bmcwn_40: pixel.bmcwn_40,

    dbmcn_15: pixel.dbmcn_15,
    dbmcn_25: pixel.dbmcn_25,
    dbmcn_35: pixel.dbmcn_35,
    dbmcn_40: pixel.dbmcn_40,

    dbmsm_15: pixel.dbmsm_15,
    dbmsm_25: pixel.dbmsm_25,
    dbmsm_35: pixel.dbmsm_35,
    dbmsm_40: pixel.dbmsm_40,

    // tpa removed
    tpa_0: 0.3 * pixel.tpa_0,
    sng_0: 0.3 * pixel.sng_0,

    tpa_2: 0.6 * pixel.tpa_2,
    sng_2: 0.6 * pixel.sng_2,

    tpa_7: 0.9 * pixel.tpa_7,
    sng_7: 0.9 * pixel.sng_7,

    tpa_15: pixel.tpa_15,
    sng_15: pixel.sng_15,
    tpa_25: pixel.tpa_25,
    sng_25: pixel.sng_25,
    tpa_35: pixel.tpa_35,
    tpa_40: pixel.tpa_40,

    // volume removed
    // vol_0: 0.3 * pixel.vol_0,
    vmsg_0: 0.3 * pixel.vmsg_0,
    vol_2: 0.6 * pixel.vol_2,
    vmsg_2: 0.6 * pixel.vmsg_2,
    vol_7: 0.9 * pixel.vol_7,
    vmsg_7: 0.9 * pixel.vmsg_7,

    vol_15: pixel.vol_15,
    vmsg_15: pixel.vmsg_15,

    vol_25: pixel.vol_25,
    vmsg_25: pixel.vmsg_25,
    vol_35: pixel.vol_35,
    vmsg_35: pixel.vmsg_35,
    vol_40: pixel.vol_40,
    vmsg_40: pixel.vmsg_40
  };
  return treatedPixel;
};

// Remove trees > 10 inches DBH, starting with small ones closest to 10”
// until a certain residual basal area is reached, which is based on site class
export const commercialThin = (pixel: Pixel) => {
  // first sum all pixels and calculate p values off of cluster variables
  // then use p values to treat each pixel
  // then calculate center of biomass using each pixel after its been treated
  return;
};

// Same as Commercial thin but with the additional removal ofsmall trees in the following proportions:
// 0-1" DBH -20%, 1-5" DBH -50%, 5-10" DBH -80%
export const commericalThinSmallTreeRemoval = (pixel: Pixel) => {
  return;
};

// Remove all dead trees, either for timber (fire salvage) or for biomass (die-off salvage)
export const timberSalvage = (pixel: Pixel) => {
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
    y: pixel.y,

    // biomass removed
    dbmcn_15: pixel.dbmcn_15,
    dbmcn_25: pixel.dbmcn_25,
    dbmcn_35: pixel.dbmcn_35,
    dbmcn_40: pixel.dbmcn_40,

    // tpa removed
    sng_15: pixel.sng_15,
    sng_25: pixel.sng_25,
    sng_35: pixel.sng_35,
    sng_40: pixel.sng_40,

    // volume removed
    vmsg_15: pixel.vmsg_15,
    vmsg_25: pixel.vmsg_25,
    vmsg_35: pixel.vmsg_35,
    vmsg_40: pixel.vmsg_40
  };
  return treatedPixel;
};

// Same as Salvage thin but with the additionalremoval of:
// 0-1" DBH -30%, 1-5" DBH -60%, 5-10" DBH -90%
export const timberSalvageChipTreeRemoval = (pixel: Pixel) => {
  // do basic timber salvage
  let treatedPixel = timberSalvage(pixel);
  const isPrivate = pixel.land_use === 'Private';
  const c0 = isPrivate ? 0.3 : 0.2;
  const c2 = isPrivate ? 0.6 : 0.85;
  const c7 = 0.9;
  treatedPixel = {
    ...treatedPixel,
    cluster_no: pixel.cluster_no,
    elevation: pixel.elevation,
    county: pixel.county,
    land_use: pixel.land_use,
    cluster1: pixel.cluster1,
    cluster2: pixel.cluster2,
    x: pixel.x,
    y: pixel.y,

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
    vmsg_7: c7 * pixel.vmsg_7
  };
  return treatedPixel;
};

// Remove some trees but leave behind at least 15 sq ft/ac of basal area of trees > 18" DBH
export const selection = (pixel: Pixel) => {
  if (pixel.land_use === 'Forest') {
    throw new Error('selection cannot be performed on forest land');
  }
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

// Remove some trees but leave behind at least 15 sq ft/ac of basal area of trees > 18" DBH
export const selectionSmallTree = (pixel: Pixel) => {
  if (pixel.land_use === 'Forest') {
    throw new Error('selection with small tree removal cannot be performed on forest land');
  }
  let treatedPixel = selection(pixel);

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

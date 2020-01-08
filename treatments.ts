import { Pixel } from './models/pixel';

// equations from:
// https://ucdavis.app.box.com/file/593365602124

// All live and dead trees over 10 inches cut.
// For smaller size classes, cut at the following proportions for both live and dead:
// 0-1" DBH -30%, 1-5" DBH -60%, 5-10" DBH -90%
export const clearcut = (pixel: Pixel) => {
  let p = new Pixel();
  p = {
    ...p,
    elevation: pixel.elevation,
    df_ele_cnty_name: pixel.df_ele_cnty_name,
    cluster1: pixel.cluster1,
    cluster2: pixel.cluster2,
    // biomass removed
    bmstm_0: 0.3 * pixel.bmstm_0,
    bmcwn_0: 0.3 * pixel.bmcwn_0,
    // TODO: dbmsm_0: 0.3 * pixel.dbmsm_0,
    // TODO: dbmcn_0: 0.3 * pixel.dbmcn_0,
    bmstm_2: 0.6 * pixel.bmstm_2,
    bmcwn_2: 0.6 * pixel.bmcwn_2,
    // TODO: dbmsm_2: 0.6 * pixel.dbmsm_2,
    // TODO: dbmcn_2: 0.6 * pixel.dbmcn_2,
    bmstm_7: 0.9 * pixel.bmstm_7,
    bmcwn_7: 0.9 * pixel.bmcwn_7,
    // TODO: dbmsm_7: 0.9 * pixel.dbmsm_7,
    // TODO: dbmcn_7: 0.9 * pixel.dbmcn_7,

    // tpa removed
    tpa_0: 0.3 * pixel.tpa_0,
    // TODO: sng_0: 0.3 * pixel.sng_0,
    tpa_2: 0.6 * pixel.tpa_2,
    // TODO: sng_2: 0.6 * pixel.sng_2,
    tpa_7: 0.9 * pixel.tpa_7,
    // TODO: sng_7: 0.9 * pixel.sng_7,
    bmcwn_15: pixel.bmcwn_15,
    bmcwn_25: pixel.bmcwn_25,
    bmcwn_35: pixel.bmcwn_35,
    bmcwn_40: pixel.bmcwn_40
    // TODO:
    // dbmcn_15: pixel.dbmcn_15,
    // dbmcn_25: pixel.dbmcn_25,
    // dbmcn_35: pixel.dbmcn_35,
    // dbmcn_40: pixel.dbmcn_40,
    // dbmsm_15: pixel.dbmsm_15,
    // dbmsm_25: pixel.dbmsm_25,
    // dbmsm_35: pixel.dbmsm_35,
    // dbmsm_40: pixel.dbmsm_40
  };
  return p;
};

// Remove trees > 10 inches DBH, starting with small ones closest to 10”
// until a certain residual basal area is reached, which is based on site class
export const commercialThin = (pixel: Pixel) => {
  return;
};

// Same as Commercial thin but with the additional removal ofsmall trees in the following proportions:
// 0-1" DBH -20%, 1-5" DBH -50%, 5-10" DBH -80%
export const commericalThinSmallTreeRemoval = (pixel: Pixel) => {
  return;
};

// Remove all dead trees, either for timber (fire salvage) or for biomass (die-off salvage)
export const salvage = (pixel: Pixel) => {
  // TODO: dbmcn_15 + dbmcn_25 + dbmcn_35 + dbmcn_40 + dbmsm_15 + dbmsm_25 + dbmsm_35 + dbmsm_40
  return;
};

// Same as Salvage thin but with the additionalremoval of:
// 0-1" DBH -30%, 1-5" DBH -60%, 5-10" DBH -90%
export const salvageSmallTreeRemoval = (pixel: Pixel) => {
  return (
    0.3 * (pixel.bmstm_0 + pixel.bmcwn_0) +
    // TODO: 0.3 * (dbmsm_0 + dbmcn_0) +
    0.6 * (pixel.bmstm_2 + pixel.bmcwn_2) +
    // TODO: 0.6 * (dbmsm_2 + dbmcn_2) +
    0.9 * (pixel.bmstm_7 + pixel.bmcwn_7)
    // 0.9 * (dbmsm_7 + dbmcn_7);
  );
};

import { Pixel } from './models/pixel';

// https://ucdavis.app.box.com/file/579878129759

// All live and dead trees over 10 inches cut.
// For smaller size classes, cut at the following proportions for both live and dead:
// 0-1" DBH -30%, 1-5" DBH -60%, 5-10" DBH -90%
export const clearcut = (pixel: Pixel) => {
  return (
    0.3 * (pixel.bmstm_0 + pixel.bmcwn_0) +
    // TODO: add 0.3 * (DBMSM_0 + DBMCN_0)
    0.6 * (pixel.bmstm_2 + pixel.bmcwn_2) +
    // TODO: add 0.6 * (DBMSM_2 + DBMCN_2) +
    0.9 * (pixel.bmstm_7 + pixel.bmcwn_7) +
    // TODO: add 0.9 * (DBMSM_7 + DBMCN_7)
    pixel.bmfol_15 +
    pixel.bmcwn_35 +
    pixel.bmcwn_40
  );
  // TODO:  DBMCN_15 + DBMCN_25 + DBMCN_35 + DBMCN_40 + DBMSM_15 + DBMSM_25 + DBMSM_35 + DBMSM_40
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
  // TODO: DBMCN_15 + DBMCN_25 + DBMCN_35 + DBMCN_40 + DBMSM_15 + DBMSM_25 + DBMSM_35 + DBMSM_40
  return;
};

// Same as Salvage thin but with the additionalremoval of:
// 0-1" DBH -30%, 1-5" DBH -60%, 5-10" DBH -90%
export const salvageSmallTreeRemoval = (pixel: Pixel) => {
  return (
    0.3 * (pixel.bmstm_0 + pixel.bmcwn_0) +
    // TODO: 0.3 * (DBMSM_0 + DBMCN_0) +
    0.6 * (pixel.bmstm_2 + pixel.bmcwn_2) +
    // TODO: 0.6 * (DBMSM_2 + DBMCN_2) +
    0.9 * (pixel.bmstm_7 + pixel.bmcwn_7)
    // 0.9 * (DBMSM_7 + DBMCN_7);
  );
};

import { Pixel, PixelClass } from '../models/pixel';
import { CenterOfBiomassSum } from '../models/shared';
import { calculateCenterOfBiomass } from '../pixelCalculations';

// equations from:
// https://ucdavis.app.box.com/file/593365602124
export const processTimberSalvage = (pixels: Pixel[], centerOfBiomassSum: CenterOfBiomassSum) => {
  console.log('timberSalvage: processing pixels');
  const treatedPixels = pixels.map(pixel => {
    // treat pixel
    const treatedPixel = timberSalvage(pixel);
    // this will update centerOfBiomassSum
    calculateCenterOfBiomass(centerOfBiomassSum, treatedPixel);
    return treatedPixel;
  });
  return treatedPixels;
};

// Remove all dead trees, either for timber (fire salvage) or for biomass (die-off salvage)
const timberSalvage = (pixel: Pixel) => {
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
    vmsg_40: pixel.vmsg_40,

    // ba
    ba_15: pixel.ba_15,
    ba_25: pixel.ba_25,
    ba_35: pixel.ba_35,
    ba_40: pixel.ba_40,

    basa_as: pixel.basa_as,
    basa_ra: pixel.basa_ra,
    basa_wi: pixel.basa_wi
  };
  return treatedPixel;
};

export const processTimberSalvageChipTreeRemoval = (
  pixels: Pixel[],
  centerOfBiomassSum: CenterOfBiomassSum
) => {
  const treatedPixels = pixels.map(pixel => {
    // treat pixel
    const treatedPixel = timberSalvageChipTreeRemoval(pixel);
    // this will update centerOfBiomassSum
    calculateCenterOfBiomass(centerOfBiomassSum, treatedPixel);
    return treatedPixel;
  });
  return treatedPixels;
};

// Same as Salvage thin but with the additionalremoval of:
// 0-1" DBH -30%, 1-5" DBH -60%, 5-10" DBH -90%
const timberSalvageChipTreeRemoval = (pixel: Pixel) => {
  // do basic timber salvage
  let treatedPixel = timberSalvage(pixel);
  const isPrivate = pixel.land_use === 'Private';
  const c0 = isPrivate ? 0.3 : 0.2;
  const c2 = isPrivate ? 0.6 : 0.85;
  const c7 = 0.9;
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

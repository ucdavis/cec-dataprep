import { Pixel, PixelClass } from '../models/pixel';
import { CenterOfBiomassSum } from '../models/shared';
import { calculateCenterOfBiomass, sumBiomass } from '../pixelCalculations';

// equations from:
// https://ucdavis.app.box.com/file/593365602124
export const processClearcut = (
  pixels: Pixel[],
  centerOfBiomassSum: CenterOfBiomassSum,
  treatmentName?: string
) => {
  if (treatmentName === 'clearcut' && pixels[0].land_use === 'Forest') {
    throw new Error('clearcut cannot be performed on forest land');
  }
  // console.log('clearcut: processing pixels');
  const treatedPixels = pixels.map(pixel => {
    // treat pixel
    const treatedPixel = clearcut(pixel);
    // this will update centerOfBiomassSum
    calculateCenterOfBiomass(centerOfBiomassSum, treatedPixel);
    return treatedPixel;
  });
  return treatedPixels;
};

// All live and dead trees over 10 inches cut.
// For smaller size classes, cut at the following proportions for both live and dead:
// 0-1" DBH -30%, 1-5" DBH -60%, 5-10" DBH -90%
const clearcut = (pixel: Pixel): Pixel => {
  let treatedPixel = new PixelClass();

  treatedPixel = {
    ...treatedPixel,
    cluster_no: pixel.cluster_no,
    elevation: pixel.elevation,
    county_name: pixel.county_name,
    land_use: pixel.land_use,
    site_class: pixel.site_class,
    lat: pixel.lat,
    lng: pixel.lng,
    forest_type: pixel.forest_type,
    haz_class: pixel.haz_class,

    bmfol_2: 0.6 * pixel.bmfol_2,
    bmfol_7: 0.9 * pixel.bmfol_7,
    bmfol_15: pixel.bmfol_15,
    bmfol_25: pixel.bmfol_25,
    bmfol_35: pixel.bmfol_35,
    bmfol_40: pixel.bmfol_40,

    // feedstock removed
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

    // saw log removed
    bmstm_15: pixel.bmstm_15,
    bmstm_25: pixel.bmstm_25,
    bmstm_35: pixel.bmstm_35,
    bmstm_40: pixel.bmstm_40,

    // tpa removed
    tpa_2: 0.6 * pixel.tpa_2,
    sng_2: 0.6 * pixel.sng_2,

    tpa_7: 0.9 * pixel.tpa_7,
    sng_7: 0.9 * pixel.sng_7,

    tpa_15: pixel.tpa_15,
    sng_15: pixel.sng_15,
    tpa_25: pixel.tpa_25,
    sng_25: pixel.sng_25,
    tpa_35: pixel.tpa_35,
    sng_35: pixel.sng_35,
    tpa_40: pixel.tpa_40,
    sng_40: pixel.sng_40,

    // volume removed
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
    vmsg_40: pixel.vmsg_40,

    // basal area
    ba_2: 0.6 * pixel.ba_2,
    ba_7: 0.9 * pixel.ba_7,
    ba_15: pixel.ba_15,
    ba_25: pixel.ba_25,
    ba_35: pixel.ba_35,
    ba_40: pixel.ba_40
  };
  return treatedPixel;
};

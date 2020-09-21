import { Pixel, PixelClass } from '../models/pixel';
import { CenterOfBiomassSum } from '../models/shared';
import { calculateCenterOfBiomass, sumBiomass } from '../pixelCalculations';

// equations from:
// https://ucdavis.app.box.com/file/593365602124
export const processBiomassSalvage = (pixels: Pixel[], centerOfBiomassSum: CenterOfBiomassSum) => {
  // console.log('biomassSalvage: processing pixels');
  const treatedPixels = pixels.map(pixel => {
    // treat pixel
    const treatedPixel = biomassSalvage(pixel);
    // this will update centerOfBiomassSum
    calculateCenterOfBiomass(centerOfBiomassSum, treatedPixel);
    return treatedPixel;
  });
  return treatedPixels;
};

// Remove small trees in the following proportions:
// 0-1" DBH - 30%, 1-5" DBH - 60%, 5-10" DBH - 90%
const biomassSalvage = (pixel: Pixel): Pixel => {
  const isPrivate = pixel.land_use === 'Private';
  const c2 = isPrivate ? 0.6 : 0.85;
  const c7 = 0.9;
  let treatedPixel = new PixelClass();

  treatedPixel = {
    ...treatedPixel,
    cluster_no: pixel.cluster_no,
    elevation: pixel.elevation,
    county_name: pixel.county_name,
    land_use: pixel.land_use,
    site_class: pixel.site_class,
    forest_type: pixel.forest_type,
    lng: pixel.lng,
    lat: pixel.lat,
    // biomass removed
    bmstm_2: c2 * pixel.bmstm_2,
    bmcwn_2: c2 * pixel.bmcwn_2,
    dbmsm_2: c2 * pixel.dbmsm_2,
    dbmcn_2: c2 * pixel.dbmcn_2,

    bmstm_7: c7 * pixel.bmstm_7,
    bmcwn_7: c7 * pixel.bmcwn_7,
    dbmsm_7: c7 * pixel.dbmsm_7,
    dbmcn_7: c7 * pixel.dbmcn_7,

    dbmsm_15: pixel.dbmsm_15,
    dbmcn_15: pixel.dbmcn_15,
    dbmsm_25: pixel.dbmsm_25,
    dbmcn_25: pixel.dbmcn_25,
    dbmsm_35: pixel.dbmsm_35,
    dbmcn_35: pixel.dbmcn_35,
    dbmsm_40: pixel.dbmsm_40,
    dbmcn_40: pixel.dbmcn_40,

    // tpa removed
    tpa_2: c2 * pixel.tpa_2,
    sng_2: c2 * pixel.sng_2,

    tpa_7: c7 * pixel.tpa_7,
    sng_7: c7 * pixel.sng_7,

    sng_15: pixel.sng_15,
    sng_25: pixel.sng_25,
    sng_35: pixel.sng_35,
    sng_40: pixel.sng_40,

    // volume removed
    vol_2: c2 * pixel.vol_2,
    vmsg_2: c2 * pixel.vmsg_2,
    vol_7: c7 * pixel.vol_7,
    vmsg_7: c7 * pixel.vmsg_7,

    vmsg_15: pixel.vmsg_15,
    vmsg_25: pixel.vmsg_25,
    vmsg_35: pixel.vmsg_35,
    vmsg_40: pixel.vmsg_40,

    ba_2: c2 * pixel.ba_2,
    ba_7: c7 * pixel.ba_7,

    ba_15: pixel.ba_15,
    ba_25: pixel.ba_25,
    ba_35: pixel.ba_35,
    ba_40: pixel.ba_40
  };
  return treatedPixel;
};

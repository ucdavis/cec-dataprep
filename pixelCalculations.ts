import { Pixel, PixelVariables } from 'models/pixel';
import { CenterOfBiomassSum } from 'models/shared';
const metersToAcresConstant = 0.000247105;
const pixelsToAcreConstant = 30 * 30 * metersToAcresConstant;

export const sumNumberOfTrees = (pixel: Pixel) => {
  return (
    pixel.sng_0 +
    pixel.sng_2 +
    pixel.sng_7 +
    pixel.sng_15 +
    pixel.sng_25 +
    // pixel.sng_35 +
    // pixel.sng_40 +
    pixel.tpa_0 +
    pixel.tpa_2 +
    pixel.tpa_7 +
    pixel.tpa_15 +
    pixel.tpa_25
    // pixel.tpa_35
    // pixel.tpa_40
  );
};

export const sumBiomass = (pixel: Pixel) => {
  return (
    pixel.bmfol_0 +
    pixel.bmfol_2 +
    pixel.bmfol_7 +
    pixel.bmfol_15 +
    pixel.bmfol_25 +
    // pixel.bmfol_35 +
    // pixel.bmfol_40 +
    pixel.bmcwn_0 +
    pixel.bmcwn_2 +
    pixel.bmcwn_7 +
    pixel.bmcwn_15 +
    pixel.bmcwn_25 +
    // pixel.bmcwn_35 +
    // pixel.bmcwn_40 +
    pixel.bmstm_0 +
    pixel.bmstm_2 +
    pixel.bmstm_7 +
    pixel.bmstm_15 +
    pixel.bmstm_25 +
    // + pixel.bmstm_35 +
    // pixel.bmstm_40
    pixel.dbmsm_0 +
    pixel.dbmsm_2 +
    pixel.dbmsm_7 +
    pixel.dbmsm_15 +
    pixel.dbmsm_25 +
    // + pixel.dbmsm_35 +
    // pixel.dbmsm_40
    pixel.dbmcn_0 +
    pixel.dbmcn_2 +
    pixel.dbmcn_7 +
    pixel.dbmcn_15 +
    pixel.dbmcn_25
    // + pixel.dbmcn_35 +
    // pixel.dbmcn_40
  );
};

export const sumPixel = (pixelSummation: PixelVariables, p: Pixel) => {
  const pixelSum: PixelVariables = {
    bmcwn_0: pixelSummation.bmcwn_0 + p.bmcwn_0,
    bmcwn_2: pixelSummation.bmcwn_2 + p.bmcwn_2,
    bmcwn_7: pixelSummation.bmcwn_7 + p.bmcwn_7,
    bmcwn_15: pixelSummation.bmcwn_15 + p.bmcwn_15,
    bmcwn_25: pixelSummation.bmcwn_25 + p.bmcwn_25,
    bmcwn_35: pixelSummation.bmcwn_35 + p.bmcwn_35,
    bmcwn_40: pixelSummation.bmcwn_40 + p.bmcwn_40,

    bmfol_0: pixelSummation.bmfol_0 + p.bmfol_0,
    bmfol_2: pixelSummation.bmfol_2 + p.bmfol_2,
    bmfol_7: pixelSummation.bmfol_7 + p.bmfol_7,
    bmfol_15: pixelSummation.bmfol_15 + p.bmfol_15,
    bmfol_25: pixelSummation.bmfol_25 + p.bmfol_25,
    bmfol_35: pixelSummation.bmfol_35 + p.bmfol_35,
    bmfol_40: pixelSummation.bmfol_40 + p.bmfol_40,

    bmstm_0: pixelSummation.bmstm_0 + p.bmstm_0,
    bmstm_2: pixelSummation.bmstm_2 + p.bmstm_2,
    bmstm_7: pixelSummation.bmstm_7 + p.bmstm_7,
    bmstm_15: pixelSummation.bmstm_15 + p.bmstm_15,
    bmstm_25: pixelSummation.bmstm_25 + p.bmstm_25,
    bmstm_35: pixelSummation.bmstm_35 + p.bmstm_35,
    bmstm_40: pixelSummation.bmstm_40 + p.bmstm_40,

    // get # of trees per pixel
    tpa_0: pixelSummation.tpa_0 + p.tpa_0,
    tpa_15: pixelSummation.tpa_15 + p.tpa_15,
    tpa_2: pixelSummation.tpa_2 + p.tpa_2,
    tpa_25: pixelSummation.tpa_25 + p.tpa_25,
    tpa_35: pixelSummation.tpa_35 + p.tpa_35,
    tpa_40: pixelSummation.tpa_40 + p.tpa_40,
    tpa_7: pixelSummation.tpa_7 + p.tpa_7,
    // dead biomass
    dbmsm_0: pixelSummation.dbmsm_0 + p.dbmsm_0,
    dbmsm_2: pixelSummation.dbmsm_2 + p.dbmsm_2,
    dbmsm_7: pixelSummation.dbmsm_7 + p.dbmsm_7,
    dbmsm_15: pixelSummation.dbmsm_15 + p.dbmsm_15,
    dbmsm_25: pixelSummation.dbmsm_25 + p.dbmsm_25,
    dbmsm_35: pixelSummation.dbmsm_35 + p.dbmsm_35,
    dbmsm_40: pixelSummation.dbmsm_40 + p.dbmsm_40,

    dbmcn_0: pixelSummation.dbmcn_0 + p.dbmcn_0,
    dbmcn_2: pixelSummation.dbmcn_2 + p.dbmcn_2,
    dbmcn_7: pixelSummation.dbmcn_7 + p.dbmcn_7,
    dbmcn_15: pixelSummation.dbmcn_15 + p.dbmcn_15,
    dbmcn_25: pixelSummation.dbmcn_25 + p.dbmcn_25,
    dbmcn_35: pixelSummation.dbmcn_35 + p.dbmcn_35,
    dbmcn_40: pixelSummation.dbmcn_40 + p.dbmcn_40,

    sng_0: pixelSummation.sng_0 + p.sng_0,
    sng_2: pixelSummation.sng_2 + p.sng_2,
    sng_7: pixelSummation.sng_7 + p.sng_7,
    sng_15: pixelSummation.sng_15 + p.sng_15,
    sng_25: pixelSummation.sng_25 + p.sng_25,
    sng_35: pixelSummation.sng_35 + p.sng_35,
    sng_40: pixelSummation.sng_40 + p.sng_40,

    // volume
    // F3 not giving us vol_0
    // vol_0: pixelSummation.vol_0 + p.vol_0,
    vol_2: pixelSummation.vol_2 + p.vol_2,
    vol_7: pixelSummation.vol_7 + p.vol_7,
    vol_15: pixelSummation.vol_15 + p.vol_15,
    vol_25: pixelSummation.vol_25 + p.vol_25,
    vol_35: pixelSummation.vol_35 + p.vol_35,
    vol_40: pixelSummation.vol_40 + p.vol_40,

    vmsg_0: pixelSummation.vmsg_0 + p.vmsg_0,
    vmsg_2: pixelSummation.vmsg_2 + p.vmsg_2,
    vmsg_7: pixelSummation.vmsg_7 + p.vmsg_7,
    vmsg_15: pixelSummation.vmsg_15 + p.vmsg_15,
    vmsg_25: pixelSummation.vmsg_25 + p.vmsg_25,
    vmsg_35: pixelSummation.vmsg_35 + p.vmsg_35,
    vmsg_40: pixelSummation.vmsg_40 + p.vmsg_40,

    // basal area
    ba_0: pixelSummation.ba_0 + p.ba_0,
    ba_2: pixelSummation.ba_2 + p.ba_2,
    ba_7: pixelSummation.ba_7 + p.ba_7,
    ba_15: pixelSummation.ba_15 + p.ba_15,
    ba_25: pixelSummation.ba_25 + p.ba_25,
    ba_35: pixelSummation.ba_35 + p.ba_35,
    ba_40: pixelSummation.ba_40 + p.ba_40,

    //
    basa_as: pixelSummation.basa_as + p.basa_as,
    basa_ra: pixelSummation.basa_ra + p.basa_ra,
    basa_wi: pixelSummation.basa_wi + p.basa_wi
  };
  return pixelSum;
};

export const calculateCenterOfBiomass = (
  centerOfBiomassSum: CenterOfBiomassSum,
  treatedPixel: Pixel
) => {
  const biomassInPixel = sumBiomass(treatedPixel); // excludes 35, 40 size classes
  centerOfBiomassSum.lat += treatedPixel.y * biomassInPixel;
  centerOfBiomassSum.lng += treatedPixel.x * biomassInPixel;
  centerOfBiomassSum.biomassSum += biomassInPixel;
};

import { Pixel } from 'models/pixel';

export const sumBiomass = (pixel: Pixel) => {
  return (
    pixel.total3run_sng_0_nomgt_2016_v20190630 +
    pixel.total3run_sng_2_nomgt_2016_v20190630 +
    pixel.total3run_sng_7_nomgt_2016_v20190630 +
    pixel.total3run_sng_15_nomgt_2016_v20190630 +
    pixel.total3run_sng_25_nomgt_2016_v20190630 +
    pixel.total3run_sng_35_nomgt_2016_v20190630 +
    pixel.total3run_sng_40_nomgt_2016_v20190630 +
    pixel.total3run_tpa_0_nomgt_2016_v20190630 +
    pixel.total3run_tpa_2_nomgt_2016_v20190630 +
    pixel.total3run_tpa_7_nomgt_2016_v20190630 +
    pixel.total3run_tpa_15_nomgt_2016_v20190630 +
    pixel.total3run_tpa_25_nomgt_2016_v20190630 +
    pixel.total3run_tpa_35_nomgt_2016_v20190630 +
    pixel.total3run_tpa_40_nomgt_2016_v20190630
  );
};

// these equations come from this sheet:
// https://ucdavis.app.box.com/file/566320916282
export const calcRemovalsCT = (pixel: Pixel) => {
  return (
    pixel.total3run_tpa_0_nomgt_2016_v20190630 +
    pixel.total3run_tpa_2_nomgt_2016_v20190630 +
    pixel.total3run_tpa_7_nomgt_2016_v20190630 +
    pixel.total3run_tpa_15_nomgt_2016_v20190630 +
    pixel.total3run_sng_0_nomgt_2016_v20190630 +
    pixel.total3run_sng_2_nomgt_2016_v20190630 +
    pixel.total3run_sng_7_nomgt_2016_v20190630 +
    pixel.total3run_sng_15_nomgt_2016_v20190630
  );
};

export const calcRemovalsSLT = (pixel: Pixel) => {
  return pixel.total3run_tpa_15_nomgt_2016_v20190630 + pixel.total3run_sng_15_nomgt_2016_v20190630;
};

export const calcRemovalsLLT = (pixel: Pixel) => {
  return (
    pixel.total3run_tpa_25_nomgt_2016_v20190630 +
    pixel.total3run_tpa_35_nomgt_2016_v20190630 +
    pixel.total3run_tpa_40_nomgt_2016_v20190630 +
    pixel.total3run_sng_25_nomgt_2016_v20190630 +
    pixel.total3run_sng_35_nomgt_2016_v20190630 +
    pixel.total3run_sng_40_nomgt_2016_v20190630
  );
};

export const calcTreeVolCT = (pixel: Pixel) => {
  return (
    pixel.total3run_bmfol_0_nomgt_2016_v20190630 +
    pixel.total3run_bmfol_2_nomgt_2016_v20190630 +
    pixel.total3run_bmfol_7_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_0_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_2_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_7_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_0_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_2_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_7_nomgt_2016_v20190630
    // TODO: add DBMCN and DBMSM
  );
};

export const calcTreeVolSLT = (pixel: Pixel) => {
  return (
    pixel.total3run_bmfol_15_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_15_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_15_nomgt_2016_v20190630
    // TODO: add DBMCN 15 and DBMSM 15
  );
};

export const calcTreeVolLLT = (pixel: Pixel) => {
  return (
    pixel.total3run_bmfol_25_nomgt_2016_v20190630 +
    pixel.total3run_bmfol_35_nomgt_2016_v20190630 +
    pixel.total3run_bmfol_40_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_25_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_35_nomgt_2016_v20190630 +
    pixel.total3run_bmcwn_40_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_25_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_35_nomgt_2016_v20190630 +
    pixel.total3run_bmstm_40_nomgt_2016_v20190630
    // TODO: add DBMCN and DBMSM
  );
};

export const sumPixel = (pixelSummation: Pixel, p: Pixel) => {
  pixelSummation = {
    ...pixelSummation,
    total3run_bmcwn_0_nomgt_2016_v20190630:
      pixelSummation.total3run_bmcwn_0_nomgt_2016_v20190630 +
      p.total3run_bmcwn_0_nomgt_2016_v20190630,
    total3run_bmcwn_15_nomgt_2016_v20190630:
      pixelSummation.total3run_bmcwn_15_nomgt_2016_v20190630 +
      p.total3run_bmcwn_15_nomgt_2016_v20190630,
    total3run_bmcwn_2_nomgt_2016_v20190630:
      pixelSummation.total3run_bmcwn_2_nomgt_2016_v20190630 +
      p.total3run_bmcwn_2_nomgt_2016_v20190630,
    total3run_bmcwn_25_nomgt_2016_v20190630:
      pixelSummation.total3run_bmcwn_25_nomgt_2016_v20190630 +
      p.total3run_bmcwn_25_nomgt_2016_v20190630,
    total3run_bmcwn_35_nomgt_2016_v20190630:
      pixelSummation.total3run_bmcwn_35_nomgt_2016_v20190630 +
      p.total3run_bmcwn_35_nomgt_2016_v20190630,
    total3run_bmcwn_40_nomgt_2016_v20190630:
      pixelSummation.total3run_bmcwn_40_nomgt_2016_v20190630 +
      p.total3run_bmcwn_40_nomgt_2016_v20190630,
    total3run_bmcwn_7_nomgt_2016_v20190630:
      pixelSummation.total3run_bmcwn_7_nomgt_2016_v20190630 +
      p.total3run_bmcwn_7_nomgt_2016_v20190630,
    total3run_bmfol_0_nomgt_2016_v20190630:
      pixelSummation.total3run_bmfol_0_nomgt_2016_v20190630 +
      p.total3run_bmfol_0_nomgt_2016_v20190630,
    total3run_bmfol_15_nomgt_2016_v20190630:
      pixelSummation.total3run_bmfol_15_nomgt_2016_v20190630 +
      p.total3run_bmfol_15_nomgt_2016_v20190630,
    total3run_bmfol_2_nomgt_2016_v20190630:
      pixelSummation.total3run_bmfol_2_nomgt_2016_v20190630 +
      p.total3run_bmfol_2_nomgt_2016_v20190630,
    total3run_bmfol_25_nomgt_2016_v20190630:
      pixelSummation.total3run_bmfol_25_nomgt_2016_v20190630 +
      p.total3run_bmfol_25_nomgt_2016_v20190630,
    total3run_bmfol_35_nomgt_2016_v20190630:
      pixelSummation.total3run_bmfol_35_nomgt_2016_v20190630 +
      p.total3run_bmfol_35_nomgt_2016_v20190630,
    total3run_bmfol_40_nomgt_2016_v20190630:
      pixelSummation.total3run_bmfol_40_nomgt_2016_v20190630 +
      p.total3run_bmfol_40_nomgt_2016_v20190630,
    total3run_bmfol_7_nomgt_2016_v20190630:
      pixelSummation.total3run_bmfol_7_nomgt_2016_v20190630 +
      p.total3run_bmfol_7_nomgt_2016_v20190630,
    total3run_bmstm_0_nomgt_2016_v20190630:
      pixelSummation.total3run_bmstm_0_nomgt_2016_v20190630 +
      p.total3run_bmstm_0_nomgt_2016_v20190630,
    total3run_bmstm_15_nomgt_2016_v20190630:
      pixelSummation.total3run_bmstm_15_nomgt_2016_v20190630 +
      p.total3run_bmstm_15_nomgt_2016_v20190630,
    total3run_bmstm_2_nomgt_2016_v20190630:
      pixelSummation.total3run_bmstm_2_nomgt_2016_v20190630 +
      p.total3run_bmstm_2_nomgt_2016_v20190630,
    total3run_bmstm_25_nomgt_2016_v20190630:
      pixelSummation.total3run_bmstm_25_nomgt_2016_v20190630 +
      p.total3run_bmstm_25_nomgt_2016_v20190630,
    total3run_bmstm_35_nomgt_2016_v20190630:
      pixelSummation.total3run_bmstm_35_nomgt_2016_v20190630 +
      p.total3run_bmstm_35_nomgt_2016_v20190630,
    total3run_bmstm_40_nomgt_2016_v20190630:
      pixelSummation.total3run_bmstm_40_nomgt_2016_v20190630 +
      p.total3run_bmstm_40_nomgt_2016_v20190630,
    total3run_bmstm_7_nomgt_2016_v20190630:
      pixelSummation.total3run_bmstm_7_nomgt_2016_v20190630 +
      p.total3run_bmstm_7_nomgt_2016_v20190630,
    total3run_sng_0_nomgt_2016_v20190630:
      pixelSummation.total3run_sng_0_nomgt_2016_v20190630 + p.total3run_sng_0_nomgt_2016_v20190630,
    total3run_sng_15_nomgt_2016_v20190630:
      pixelSummation.total3run_sng_15_nomgt_2016_v20190630 +
      p.total3run_sng_15_nomgt_2016_v20190630,
    total3run_sng_2_nomgt_2016_v20190630:
      pixelSummation.total3run_sng_2_nomgt_2016_v20190630 + p.total3run_sng_2_nomgt_2016_v20190630,
    total3run_sng_25_nomgt_2016_v20190630:
      pixelSummation.total3run_sng_25_nomgt_2016_v20190630 +
      p.total3run_sng_25_nomgt_2016_v20190630,
    total3run_sng_35_nomgt_2016_v20190630:
      pixelSummation.total3run_sng_35_nomgt_2016_v20190630 +
      p.total3run_sng_35_nomgt_2016_v20190630,
    total3run_sng_40_nomgt_2016_v20190630:
      pixelSummation.total3run_sng_40_nomgt_2016_v20190630 +
      p.total3run_sng_40_nomgt_2016_v20190630,
    total3run_sng_7_nomgt_2016_v20190630:
      pixelSummation.total3run_sng_7_nomgt_2016_v20190630 + p.total3run_sng_7_nomgt_2016_v20190630,
    total3run_tpa_0_nomgt_2016_v20190630:
      pixelSummation.total3run_tpa_0_nomgt_2016_v20190630 + p.total3run_tpa_0_nomgt_2016_v20190630,
    total3run_tpa_15_nomgt_2016_v20190630:
      pixelSummation.total3run_tpa_15_nomgt_2016_v20190630 +
      p.total3run_tpa_15_nomgt_2016_v20190630,
    total3run_tpa_2_nomgt_2016_v20190630:
      pixelSummation.total3run_tpa_2_nomgt_2016_v20190630 + p.total3run_tpa_2_nomgt_2016_v20190630,
    total3run_tpa_25_nomgt_2016_v20190630:
      pixelSummation.total3run_tpa_25_nomgt_2016_v20190630 +
      p.total3run_tpa_25_nomgt_2016_v20190630,
    total3run_tpa_35_nomgt_2016_v20190630:
      pixelSummation.total3run_tpa_35_nomgt_2016_v20190630 +
      p.total3run_tpa_35_nomgt_2016_v20190630,
    total3run_tpa_40_nomgt_2016_v20190630:
      pixelSummation.total3run_tpa_40_nomgt_2016_v20190630 +
      p.total3run_tpa_40_nomgt_2016_v20190630,
    total3run_tpa_7_nomgt_2016_v20190630:
      pixelSummation.total3run_tpa_7_nomgt_2016_v20190630 + p.total3run_tpa_7_nomgt_2016_v20190630
  };
  return pixelSummation;
};

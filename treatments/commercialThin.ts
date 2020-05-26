import { Pixel, PixelClass, PixelVariables, PixelVariablesClass } from '../models/pixel';
import { CenterOfBiomassSum } from '../models/shared';
import { calculateCenterOfBiomass, sumBiomass, sumPixel } from '../pixelCalculations';

// equations from:
// https://ucdavis.app.box.com/file/593365602124
export const processCommercialThin = async (
  pixels: Pixel[],
  centerOfBiomassSum: CenterOfBiomassSum
) => {
  if (pixels[0].land_use === 'Forest') {
    throw new Error('commercial thin cannot be performed on forest land');
  }
  console.log('calculating p values...');
  const { p15, p25, p35, p40 } = await calculatePValues(pixels);
  console.log(`p15: ${p15} p25:${p25} p35:${p35} p40:${p40}`);
  console.log('treating pixels...');
  const treatedPixels = pixels.map(pixel => {
    // treat pixel
    const treatedPixel = commercialThin(pixel, p15, p25, p35, p40);
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
    cluster1: pixel.cluster1,
    cluster2: pixel.cluster2,
    x: pixel.x,
    y: pixel.y,

    bmcwn_15: (p15 / 100) * pixel.bmcwn_15,
    bmcwn_25: (p25 / 100) * pixel.bmcwn_25,
    bmcwn_35: (p35 / 100) * pixel.bmcwn_35,
    bmcwn_40: (p40 / 100) * pixel.bmcwn_40,

    // tpa removed
    tpa_15: (p15 / 100) * pixel.tpa_15,
    tpa_25: (p25 / 100) * pixel.tpa_25,
    tpa_35: (p35 / 100) * pixel.tpa_35,
    tpa_40: (p40 / 100) * pixel.tpa_40,

    vol_15: (p15 / 100) * pixel.vol_15,
    vol_25: (p25 / 100) * pixel.vol_25,
    vol_35: (p35 / 100) * pixel.vol_35,
    vol_40: (p40 / 100) * pixel.vol_40,

    // basal area
    ba_15: (p15 / 100) * pixel.ba_15, // is this right?
    ba_25: (p25 / 100) * pixel.ba_25,
    ba_35: (p35 / 100) * pixel.ba_35,
    ba_40: (p40 / 100) * pixel.ba_40,

    basa_as: pixel.basa_as,
    basa_ra: pixel.basa_ra,
    basa_wi: pixel.basa_wi
  };
  return treatedPixel;
};

const calculatePValues = async (pixels: Pixel[]): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    // first get cluster level data
    console.log('summing pixels...');
    let pixelSum = new PixelVariablesClass();
    pixels.map(p => (pixelSum = sumPixel(pixelSum, p)));
    pixelSum.ba_15 = pixelSum.ba_15 / pixels.length;
    pixelSum.ba_25 = pixelSum.ba_25 / pixels.length;
    pixelSum.ba_35 = pixelSum.ba_35 / pixels.length;
    pixelSum.ba_40 = pixelSum.ba_40 / pixels.length;

    console.log('pixel sum:');
    console.log(pixelSum);
    const residualBaTarget = 100; // ft^2/ac
    let p15 = 0;
    let p25 = 0;
    let p35 = 0;
    let p40 = 0;
    let residualBa = calculateResidualBa(pixelSum, p15, p25, p35, p40);
    console.log(`residualBa: ${residualBa}`);
    while (residualBa > residualBaTarget && p15 < 100) {
      console.log(`p15: ${p15}, residualBa: ${residualBa}, residualBaTarget: ${residualBaTarget}`);
      p15 += 10;
      residualBa = calculateResidualBa(pixelSum, p15, p25, p35, p40);
    }
    console.log(`p15: ${p15}, residualBa: ${residualBa}`);
    console.log('-----------------');
    while (residualBa > residualBaTarget && p25 < 100) {
      console.log(`p25: ${p25}, residualBa: ${residualBa}, residualBaTarget: ${residualBaTarget}`);
      p25 += 10;
      residualBa = calculateResidualBa(pixelSum, p15, p25, p35, p40);
    }
    console.log(`p25: ${p25}, residualBa: ${residualBa}`);
    console.log('-----------------');
    while (residualBa > residualBaTarget && p35 < 100) {
      console.log(`p35: ${p35}, residualBa: ${residualBa}, residualBaTarget: ${residualBaTarget}`);
      p35 += 10;
      residualBa = calculateResidualBa(pixelSum, p15, p25, p35, p40);
    }
    console.log(`p35: ${p35}, residualBa: ${residualBa}`);
    console.log('-----------------');

    while (residualBa > residualBaTarget && p40 < 100) {
      console.log(`p40: ${p40}, residualBa: ${residualBa}, residualBaTarget: ${residualBaTarget}`);
      p40 += 10;
      residualBa = calculateResidualBa(pixelSum, p15, p25, p35, p40);
    }
    console.log(`p40: ${p40}, residualBa: ${residualBa}`);
    console.log('-----------------');
    resolve({ p15, p25, p35, p40 });
  });
};

const calculateResidualBa = (
  pixelSum: PixelVariables,
  p15: number,
  p25: number,
  p35: number,
  p40: number
) => {
  return (
    (100 - p15) * pixelSum.ba_15 +
    (100 - p25) * pixelSum.ba_25 +
    (100 - p35) * pixelSum.ba_35 +
    (100 - p40) * pixelSum.ba_40
  );
};

import { Pixel, PixelClass } from '../models/pixel';

// equations from:
// https://ucdavis.app.box.com/file/593365602124

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

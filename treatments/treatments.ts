import { Pixel, PixelClass } from '../models/pixel';

// equations from:
// https://ucdavis.app.box.com/file/593365602124

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

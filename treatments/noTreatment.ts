import { Pixel } from '../models/pixel';
import { CenterOfBiomassSum } from '../models/shared';
import { calculateCenterOfBiomass } from '../pixelCalculations';

// Just spit out a pixel with the same values as the input pixel since we are doing no treatment
export const processNoTreatment = (pixels: Pixel[], centerOfBiomassSum: CenterOfBiomassSum) => {
  const treatedPixels = pixels.map((pixel) => {
    // treat pixel
    const treatedPixel = { ...pixel };
    // this will update centerOfBiomassSum
    calculateCenterOfBiomass(centerOfBiomassSum, treatedPixel);
    return treatedPixel;
  });

  return treatedPixels;
};

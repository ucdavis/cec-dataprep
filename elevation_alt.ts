import * as gdal from 'gdal';

export const getElevation = (lat: number, lng: number): Promise<number> => {
  const latCeil = Math.ceil(Math.abs(lat));
  const lngCeil = Math.ceil(Math.abs(lng));

  const elevFile = `./data/ca_elev_files/USGS_13_n${Math.abs(latCeil)}w${lngCeil}.tif`;

    return new Promise((resolve, reject) => {
    try {
      const dataset = gdal.open(elevFile);

      // get elev band
      const band = dataset.bands.get(1);

      const [originX, pixelWidth, , originY, , pixelHeight] = dataset.geoTransform;

      // convert coords
      const xPixel = Math.floor((lng - originX) / pixelWidth);
      const yPixel = Math.floor((lat - originY) / pixelHeight);

      // extract elev  value
      const buffer = band.pixels.read(xPixel, yPixel, 1, 1);
      const elevation = buffer[0]; // Access the elevation value

      resolve(elevation);
    } catch (err) {
      console.error(`Error reading file ${elevFile}:`, err);
      reject(err);
    }
  });
};

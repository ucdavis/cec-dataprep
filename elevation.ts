import { TileSet } from 'srtm-elevation';

// TODO: preload dataset w/ california hgt data
const tileset = new TileSet(process.env.HGT_FILES || './data/');

export const getElevation = (lat: number, lng: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    tileset.getElevation([lat, lng], (err: any, elevation: number) => {
      if (err) {
        reject('getElevation failed: ' + err.message);
      } else {
        resolve(elevation);
      }
    });
  });
};

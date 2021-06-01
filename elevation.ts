import { SyncTileSet } from 'srtm-elevation';

export const getElevation = (lat: number, lng: number): Promise<number> => {
  const latFloor = Math.floor(lat);
  const lngFloor = Math.floor(lng);
  return new Promise((resolve, reject) => {
    const tileset = new SyncTileSet(
      process.env.HGT_FILES || './data/',
      [latFloor, lngFloor],
      [latFloor + 1, lngFloor + 1],
      (err: any) => {
        if (err) {
          console.log(err);
          reject(err);
          return;
        }

        // All tiles are loaded (or downloaded, if they were not already on disk)
        // and queries can be made synchronous.

        const elevation = tileset.getElevation([lat, lng]);
        console.log(elevation);

        resolve(elevation);
      },
      {
        username: process.env.HGT_USER || 'srkirkland',
        password: process.env.HGT_PASS,
      }
    );
  });
};

import { SyncTileSet } from 'srtm-elevation';

const tileset = new SyncTileSet(
  process.env.HGT_FILES || './data/',
  [32.5, -124.4],
  [42, -114.133333],
  (err: any) => {
    if (err) {
      console.log(err);
      return;
    }

    // All tiles are loaded (or downloaded, if they were not already on disk)
    // and queries can be made synchronous.
    console.log('All California Tiles loaded');
  },
  {
    username: process.env.HGT_USER || 'srkirkland',
    password: process.env.HGT_PASS,
  }
);

import dotenv from 'dotenv';
import OSRM from '@project-osrm/osrm';

dotenv.config();

// just test that OSRM is working
const osrm = new OSRM(process.env.OSRM_FILE || './data/california-latest.osrm');

// two points in california
const coordinates = [
  [-121.80343822102913, 38.56096682527048],
  [-122.260564188382, 38.91280398475923],
];

osrm.route({ coordinates: coordinates }, function (err, result) {
  if (err) throw err;
  console.log(result.waypoints); // array of Waypoint objects representing all waypoints in order
  console.log(result.routes); // array of Route objects ordered by descending recommendation rank
});

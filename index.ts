import dotenv from 'dotenv';
import knex from 'knex';
import OSRM from 'osrm';

const main = async () => {
  dotenv.config();

  console.log('connecting to db', process.env.DB_HOST);
  // https://knexjs.org/
  const pg = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: 'plumas-kmeans'
    }
  });

  const osrm = new OSRM('./data/california-latest.osrm');
  const options: OSRM.NearestOptions = {
    coordinates: [[-121.716557, 38.592383]]
  };
  osrm.nearest(options, (err, response) => {
    console.log(response.waypoints);
  });
  return;
};

main();

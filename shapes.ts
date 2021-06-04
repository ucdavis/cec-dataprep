import fs from 'fs';
import shp from 'shpjs';

import knex from 'knex';

interface TreatedClusterInfo {
  cluster_no: number;
  geography: any;
  county_name: string;
}

const process = (fileName: string): Promise<TreatedClusterInfo[]> => {
  return new Promise((resolve, reject) => {
    const file = fs.readFileSync(fileName);

    console.log('processing shape file');

    shp(file)
      .then((geojson: any) => {
        // see bellow for whats here this internally call shp.parseZip()
        console.log('processed');
        // console.log(geojson.features);

        const structuredResults: TreatedClusterInfo[] = geojson.features.map((result: any) => ({
          cluster_no: result.properties.cluster_no,
          geography: {
            type: 'Feature',
            id: result.properties.cluster_no,
            geometry: result.geometry,
          },
          county_name: 'NA',
        }));

        console.log('example row', structuredResults[0]);

        resolve(structuredResults);
      })
      .catch(console.error);
  });
};

const upload = async (clusterInfo: TreatedClusterInfo[]) => {
  const db = knex({
    client: 'pg',
    connection: {
      host: 'cecdss.postgres.database.azure.com',
      user: 'cec@cecdss',
      password: '',
      database: 'cecdss',
      port: 5432,
    },
  });

  console.log('connected to pg');
  console.log('about to upload ' + clusterInfo.length + ' clusters');

  try {
    await db.transaction(async (txn) => {
      await txn.table('treatedclustersInfo').truncate();

      // try with batch insert
      await txn.batchInsert('treatedclustersInfo', clusterInfo);
    });
  } catch (error) {
    console.error(error);
  }

  console.log('insert complete');
};

process('./data/Sierra_Nevada_shapes.zip')
  .then(upload)
  .then(() => console.log('done'));

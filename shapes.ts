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
      password: 'wSypXRU99AGOUJdPHvI9YB8CwcxpCD9B',
      database: 'plumas',
      port: 5432,
    },
  });

  console.log('connected to pg');

  await db.table('treatedclustersInfo').truncate();

  const result = await db.table('treatedclustersInfo').insert(clusterInfo);

  console.log('inserted', result);
};

process('./data/Yuba_cluster.zip')
  .then(upload)
  .then(() => console.log('done'));
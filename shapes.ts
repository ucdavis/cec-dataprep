import fs from 'fs';
import shp from 'shpjs';

import knex from 'knex';


interface TreatedClusterInfo {
  cluster_no: number;
  geography: any;
  county_name: string;
}


const cluster_no_property_name = 'DEM360';

const process = (fileName: string): Promise<TreatedClusterInfo[]> => {
  return new Promise((resolve, reject) => {
    const file = fs.readFileSync(fileName);

    console.log('processing shape file');

    shp(file)
      .then((geojson: any) => {
        console.log('processed');

        const structuredResults: TreatedClusterInfo[] = geojson.features.map((result: any) => ({
          cluster_no: result.properties[cluster_no_property_name],
          geography: {
            type: 'Feature',
            id: result.properties[cluster_no_property_name],
            geometry: result.geometry,
          },
          county_name: 'NA',
        }));

        console.log('total clusters: ' + structuredResults.length);
        console.log('example rows', structuredResults.slice(3));

        resolve(structuredResults);
      })
      .catch(console.error);
  });
};

const upload = async (clusterInfo: TreatedClusterInfo[]) => {
  const db = knex({
    client: 'pg',
    connection: {
      host: 'cecdssdb.postgres.database.azure.com',
      user: 'cec',
      password: '',
      database: 'cecdss',
      port: 5432,
      ssl: true,
    },
  });

  console.log('connected to pg');
  console.log('about to upload ' + clusterInfo.length + ' clusters');

  try {
    await db.transaction(async (txn) => {
      await txn.table('treatedclustersInfo').truncate();

      // try with batch insert
      await txn.batchInsert('treatedclustersInfo', clusterInfo);
      await txn.commit();
    });
  } catch (error) {
    console.error(error);
  }

  console.log('insert complete');
};

process('./data/clusters.zip')
  .then(upload)
  .then(() => console.log('done'));

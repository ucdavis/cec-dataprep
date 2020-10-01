import csv from 'csv-parser';
import fs from 'fs';
import { Pixel } from 'models/pixel';
import { TreatedCluster } from 'models/treatedcluster';

interface ClusterMap {
  [cluster: string]: Pixel[];
}

// read the csv can call `cb` whenever a new cluster is ready
export const processPixelsCsv = (
  filePath: string,
  clusterReady: (cluster: number, pixels: Pixel[]) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    let currentCluster = -1;
    let currentPixels: Pixel[] = [];

    fs.createReadStream(filePath)
      .pipe(
        csv({
          mapHeaders: ({ header, index }) => {
            if (header === 'reg_d') {
              return 'forest_type';
            } else if (header === '') {
              // sometimes we get a blank first column, remove that data
              return null;
            }

            return header;
          },
          mapValues: ({ header, index, value }) => {
            // we want to convert numeric values to their proper format
            const floatValue = Number.parseFloat(value);
            return isNaN(floatValue) ? value : floatValue;
          },
        })
      )
      .on('data', (data: Pixel) => {
        if (currentCluster === -1) {
          console.log('reading csv file -- first line of data for reference', data);
        }
        if (data.cluster_no === currentCluster) {
          // we are still in the current cluster, let's add to the pixels list
          currentPixels.push(data);
        } else {
          // we are in a new cluster, so callback that the previous cluster
          if (currentPixels.length > 0) {
            // wait for the cluster callback to completed before we go on
            clusterReady(currentCluster, currentPixels);
          }

          // and then update for the next cluster
          currentCluster = data.cluster_no;
          currentPixels = [data];
        }
      })
      .on('error', reject)
      .on('end', () => {
        console.log('done reading file');
        resolve();
      });
  });
};

// Creates the pixels table and inserts the contents of the filePath into that table
export const importFromCsv = (filePath: string): Promise<ClusterMap> => {
  return new Promise<ClusterMap>((resolve, reject) => {
    const clusters: ClusterMap = {};

    fs.createReadStream(filePath)
      .pipe(
        csv({
          mapValues: ({ header, index, value }) => {
            // we want to convert numeric values to their proper format
            const floatValue = Number.parseFloat(value);
            return isNaN(floatValue) ? value : floatValue;
          },
        })
      )
      .on('data', (data: Pixel) => {
        // determine if we are already tracking this cluster
        if (clusters.hasOwnProperty(data.cluster_no)) {
          clusters[data.cluster_no].push(data);
        } else {
          clusters[data.cluster_no] = [data];
        }
      })
      .on('error', reject)
      .on('end', () => {
        console.log('done reading file');
        resolve(clusters);
      });
  });
};

export const getCsvWriteStream = (
  filePath: string
): { writeTreatedClusters: (treatedClusters: TreatedCluster[]) => void; closeCsv: () => void } => {
  // tslint:disable-next-line:max-line-length
  const header =
    'cluster_no, treatmentid, year, landing_lat, landing_lng, landing_elevation, center_lat, center_lng, center_elevation, slope, area, mean_yarding, site_class, county_name, land_use, forest_type, ba_15, ba_2, ba_25, ba_35, ba_40, ba_7, bmcwn_15, bmcwn_2, bmcwn_25, bmcwn_35, bmcwn_40, bmcwn_7, bmfol_15, bmfol_2, bmfol_25, bmfol_35, bmfol_40, bmfol_7, bmstm_15, bmstm_2, bmstm_25, bmstm_35, bmstm_40, bmstm_7, dbmcn_15, dbmcn_2, dbmcn_25, dbmcn_35, dbmcn_40, dbmcn_7, dbmsm_15, dbmsm_2, dbmsm_25, dbmsm_35, dbmsm_40, dbmsm_7, sng_15, sng_2, sng_25, sng_35, sng_40, sng_7, tpa_15, tpa_2, tpa_25, tpa_35, tpa_40, tpa_7, vmsg_15, vmsg_2, vmsg_25, vmsg_35, vmsg_40, vmsg_7, vol_15, vol_2, vol_25, vol_35, vol_40, vol_7';

  const headerSplit = header.split(',');

  const writeStream = fs.createWriteStream(filePath);

  // TODO: do we want a header for treated clusters?
  // write header
  writeStream.write(header + '\n');

  const writeTreatedClusters = (treatedClusters: TreatedCluster[]) => {
    for (let index = 0; index < treatedClusters.length; index++) {
      // need to cast treated cluster to any so we can dynamically index its values
      const tc: any = treatedClusters[index];

      const lineData = [];

      // loop through each header value and write the property, then newline when finished
      for (let j = 0; j < headerSplit.length; j++) {
        const col = headerSplit[j].trim();
        lineData.push(tc[col]);
      }

      writeStream.write(lineData.join(',') + '\n');
    }
  };

  const closeCsv = () => {
    writeStream.end();
  };

  return {
    writeTreatedClusters,
    closeCsv,
  };
};

export const exportToCsv = async (treatedClusters: TreatedCluster[], filePath: string) => {
  // tslint:disable-next-line:max-line-length
  const header =
    'cluster_no, treatmentid, year, landing_lat, landing_lng, landing_elevation, center_lat, center_lng, center_elevation, slope, area, mean_yarding, site_class, county_name, land_use, forest_type, ba_15, ba_2, ba_25, ba_35, ba_40, ba_7, bmcwn_15, bmcwn_2, bmcwn_25, bmcwn_35, bmcwn_40, bmcwn_7, bmfol_15, bmfol_2, bmfol_25, bmfol_35, bmfol_40, bmfol_7, bmstm_15, bmstm_2, bmstm_25, bmstm_35, bmstm_40, bmstm_7, dbmcn_15, dbmcn_2, dbmcn_25, dbmcn_35, dbmcn_40, dbmcn_7, dbmsm_15, dbmsm_2, dbmsm_25, dbmsm_35, dbmsm_40, dbmsm_7, sng_15, sng_2, sng_25, sng_35, sng_40, sng_7, tpa_15, tpa_2, tpa_25, tpa_35, tpa_40, tpa_7, vmsg_15, vmsg_2, vmsg_25, vmsg_35, vmsg_40, vmsg_7, vol_15, vol_2, vol_25, vol_35, vol_40, vol_7';

  const headerSplit = header.split(',');

  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);

    // TODO: do we want a header for treated clusters?
    // write header
    writeStream.write(header + '\n');

    for (let index = 0; index < treatedClusters.length; index++) {
      // need to cast treated cluster to any so we can dynamically index its values
      const tc: any = treatedClusters[index];

      const lineData = [];

      // loop through each header value and write the property, then newline when finished
      for (let j = 0; j < headerSplit.length; j++) {
        const col = headerSplit[j].trim();
        lineData.push(tc[col]);
      }

      writeStream.write(lineData.join(',') + '\n');
    }

    writeStream.end();
    resolve();
  });
};

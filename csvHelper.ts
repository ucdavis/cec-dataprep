import stringify from 'csv-stringify';
import es from 'event-stream';
import fs from 'fs';
import Knex from 'knex';

// Creates the pixels table and inserts the contents of the filePath into that table
export const importCsv = async (db: Knex, filePath: string) => {
  await db.raw(createStatement);

  await insertFileContents(db, filePath);

  await db.table('pixels').count();
};

export const exportCsv = async (db: Knex, filePath: string) => {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);

    // write header
    writeStream.write('header header header\n');

    const stringifier = stringify({ delimiter: ',' });

    db.table('treatedclusters')
      .stream((stream) => stream.pipe(stringifier).pipe(writeStream))
      .then(() => {
        console.log('end, closing stream');
        writeStream.end();
        resolve();
      });
  });
};

const insertFileContents = async (db: Knex, filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const s = fs
      .createReadStream(filePath)
      .pipe(es.split())
      .pipe(
        es
          .mapSync((line: string) => {
            // pause the readstream
            s.pause();

            // skip the header and any lines that are too short (blank lines)
            if (line.startsWith('"elevation"') || line.length < 2) {
              console.log('skipping header or blank row');
              s.resume();
            } else {
              db.raw(`INSERT INTO pixels VALUES (${line})`).then(() => {
                // once inserted go onto the next line
                s.resume();
              });
            }
          })
          .on('error', reject)
          .on('end', () => {
            console.log('Read entire file.');
            resolve();
          })
      );
  });
};

const createStatement = `
create table if not exists pixels
(
	elevation double precision,
	county_name text,
	ba_15 double precision,
	ba_2 double precision,
	ba_25 double precision,
	ba_35 double precision,
	ba_40 double precision,
	ba_7 double precision,
	bmcwn_15 double precision,
	bmcwn_2 double precision,
	bmcwn_25 double precision,
	bmcwn_35 double precision,
	bmcwn_40 double precision,
	bmcwn_7 double precision,
	bmfol_15 double precision,
	bmfol_2 double precision,
	bmfol_25 double precision,
	bmfol_35 double precision,
	bmfol_40 double precision,
	bmfol_7 double precision,
	bmstm_15 double precision,
	bmstm_2 double precision,
	bmstm_25 double precision,
	bmstm_35 double precision,
	bmstm_40 double precision,
	bmstm_7 double precision,
	dbmcn_15 double precision,
	dbmcn_2 double precision,
	dbmcn_25 double precision,
	dbmcn_35 double precision,
	dbmcn_40 double precision,
	dbmcn_7 double precision,
	dbmsm_15 double precision,
	dbmsm_2 double precision,
	dbmsm_25 double precision,
	dbmsm_35 double precision,
	dbmsm_40 double precision,
	dbmsm_7 double precision,
	sng_15 double precision,
	sng_2 double precision,
	sng_25 double precision,
	sng_35 double precision,
	sng_40 double precision,
	sng_7 double precision,
	tpa_15 double precision,
	tpa_2 double precision,
	tpa_25 double precision,
	tpa_35 double precision,
	tpa_40 double precision,
	tpa_7 double precision,
	vmsg_15 double precision,
	vmsg_2 double precision,
	vmsg_25 double precision,
	vmsg_35 double precision,
	vmsg_40 double precision,
	vmsg_7 double precision,
	vol_15 double precision,
	vol_2 double precision,
	vol_25 double precision,
	vol_35 double precision,
	vol_40 double precision,
	vol_7 double precision,
	site_class bigint,
	land_use text,
	lng double precision,
	lat double precision,
	cluster_no bigint,
	reg_d text
);
`;

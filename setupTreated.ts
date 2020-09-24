import Knex from 'knex';

// Creates the treatments and treatedClusters tables
export const setupTreated = async (db: Knex) => {
  await db.raw(createTreatedClusters);
  await db.raw(createTreatments);
  await db.raw(populateTreatments);
};

const createTreatments = `
create table if not exists treatments
(
  id       serial not null
    constraint treatments_pk
      primary key,
  name     varchar(32),
  land_use text
);
`;

const populateTreatments = `
insert into treatments values
(1,'clearcut','Private'),
  (2,'commercialThin','Private'),
  (3,'commercialThinChipTreeRemoval','Private,Forest'),
  (4,'timberSalvage','Private,Forest'),
  (5,'timberSalvageChipTreeRemoval','Private,Forest'),
  (6,'selection','Private'),
  (7,'selectionChipTreeRemoval','Private'),
  (8,'tenPercentGroupSelection','Private,Forest'),
  (9,'twentyPercentGroupSelection','Private'),
	(10,'biomassSalvage','Private,Forest');
	`;

const createTreatedClusters = `
create table if not exists treatedclusters
(
	cluster_no integer,
	treatmentid integer,
	year integer,
	landing_lat double precision,
	landing_lng double precision,
	landing_elevation double precision,
	center_lat double precision,
	center_lng double precision,
	center_elevation double precision,
	slope double precision,
	area double precision,
	mean_yarding double precision,
	site_class integer,
	county_name text,
	land_use text,
	forest_type text,
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
	vol_7 double precision
);

create index treatedclusters_cluster_no
	on treatedclusters (cluster_no);
`;
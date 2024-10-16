-- aggregrated pixel data, processed with treatment equations
create table treatedclusters
(
	cluster_no varchar(80),
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
	haz_class integer,
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

create index idx_find_clusters
	on treatedclusters (year, treatmentid, center_lat, center_lng, haz_class, land_use, cluster_no);

create table "treatedclustersInfo"
(
	cluster_no varchar(80),
	geography json,
	county_name text
);

create table substations
(
	objectid integer,
	"Substation" text,
	"Substation_Name" text,
	"Alias" text,
	"Status" text,
	"Owner" text,
	"Map_Owner" text,
	"Map_Part" text,
	"Engineerin" text,
	"kV_12_TO_3" boolean,
	"kV_33_TO_9" boolean,
	"kV_110_TO_" boolean,
	"kV_220_To_" boolean,
	"kV_345_To_" boolean,
	"kV_500_DC" boolean,
	"Postal_Cit" text,
	"County" text,
	"Zip_Code" integer,
	"State" text,
	longitude double precision,
	latitude double precision,
	"Creator_Da" numeric(1000),
	"highest_kV_lower" integer,
	"highest_kV_upper" integer
);

create table treatments
(
  id       serial not null
    constraint treatments_pk
      primary key,
  name     varchar(32),
  land_use text
);

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
  (10,'biomassSalvage','Private,Forest')
  

-- Create the url table
CREATE TABLE url (
    url_id SERIAL PRIMARY KEY,
    data JSONB NOT NULL,
    short_url VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the user_details table
CREATE TABLE user_details (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    organization VARCHAR(100) NOT NULL,
    org_type VARCHAR(50) NOT NULL,
    org_website VARCHAR(255),
    job_title VARCHAR(100) NOT NULL,
    linkedin VARCHAR(255),
    expertise VARCHAR(50),
    about_me TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on email in user_details
CREATE INDEX idx_user_details_email ON user_details(email);
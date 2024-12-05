-- Create processed cluster data table
CREATE TABLE treatedclusters (
	cluster_no varchar(80),
	treatmentid int4,
	year int4,
	landing_lat double precision, 
	landing_lng double precision,
	landing_elevation double precision,
	center_lat double precision, 
	center_lng double precision, 
	center_elevation double precision,
	slope double precision,
	area double precision,
	mean_yarding double precision,
	site_class int4,
	county_name text, 
	land_use text, 
	forest_type text, 
	haz_class int4, 
	stem6to9_tonsacre double precision, 
	stem4to6_tonsacre double precision, 
	stem9Plus_tonsacre double precision, 
	branch_tonsacre double precision, 
	foliage_tonsacre double precision,
	wood_density double precision
);

-- Index on the treatedclusters table 
CREATE INDEX idx_find_clusters
	on treatedclusters (year, treatmentid, center_lat, center_lng, haz_class, land_use, cluster_no);

-- Create table for clusters information
CREATE TABLE "treatedclustersInfo"
(
	cluster_no varchar(80),
	geography json,
	county_name text
);

-- Create substation table
CREATE TABLE substations
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

-- Create treatment table
CREATE TABLE treatments
(
  id serial not null constraint treatments_pk primary key,
  name varchar(32),
  land_use text
);

-- Insert forest treatment types into the treatment table 
INSERT INTO treatments VALUES
(1,'RM100','Private'),
  (2,'SDI55','Private'),
  (3,'SDI30','Private,Forest'),
  (4,'TFA_20','Private,Forest'),
  (5,'TFA_40','Private,Forest'),
  (6,'TFA_60','Private'),
  (7,'TFA_80','Private'),
  (8,'TFB_20','Private,Forest'),
  (9,'TFB_40','Private'),
  (10,'TFB_60','Private,Forest'),
  (11,'TFB_80','Private,Forest'),
  

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
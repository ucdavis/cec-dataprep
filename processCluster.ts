import { getPreciseDistance } from 'geolib';
import OSRM from '@project-osrm/osrm';
import pg from 'pg';
import { getElevation } from './elevation_alt';
import { TreatedCluster } from './models/treatedcluster';
import fs from 'fs';
import csv from 'csv-parser';

const metersToFeetConstant = 3.28084;

const PG_DECIMAL_OID = 1700;
pg.types.setTypeParser(PG_DECIMAL_OID, parseFloat);

// read wood density from CSV, create lookup table
const loadWoodDensity = (filePath: string): Promise<Map<string, number>> => {
  return new Promise((resolve, reject) => {
    const woodDensity = new Map<string, number>();
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        woodDensity.set(row.ForestType, parseFloat(row.Density));
      })
      .on('end', () => {
        resolve(woodDensity);
      })
      .on('error', reject);
  });
};

// Load the forest density data (update the file path as needed)
const woodDensityMapPromise = loadWoodDensity('data/Density_for_Volume.csv');

export const processCluster = async (
  treatedClusters: TreatedCluster[],
  osrm: OSRM,

): Promise<TreatedCluster[]> => {
  const woodDensityMap = await woodDensityMapPromise;

  return new Promise(async (resolve, reject) => {
    
    const firstCluster = treatedClusters[0]
    //const cluster_ID = firstCluster.DEM360
    //console.log(firstCluster['Treatment Name'])
    const year = firstCluster.year;
    const centerOfBiomassLat = firstCluster.lat;
    const centerOfBiomassLng = firstCluster.lng;
    //console.log(centerOfBiomassLat,centerOfBiomassLng)

    const centerElevationInMeters = await getElevation(centerOfBiomassLat,centerOfBiomassLng);
    const centerElevation = centerElevationInMeters*metersToFeetConstant;
    //console.log(centerElevation)

    const options: OSRM.NearestOptions = {
      coordinates: [[centerOfBiomassLng, centerOfBiomassLat]],
    };
    //console.log('landing',options)

    // console.log(`running osrm for treatment ${treatmentName}...`);
    await osrm.nearest(options, async (err, response) => {
      const landing = {
        latitude: response.waypoints[0].location[1],
        longitude: response.waypoints[0].location[0],
      };
      // get distance between pixel and landing site
      let centerOfBiomassDistanceToLanding = response.waypoints[0].distance;
      centerOfBiomassDistanceToLanding = centerOfBiomassDistanceToLanding *metersToFeetConstant ; // meters to feet conversion
      const mean_yarding = ((0.002*(centerOfBiomassDistanceToLanding**2)+0.044*(centerOfBiomassDistanceToLanding))+137.5815) * metersToFeetConstant; // feet

      // get landing elevation
      const landingElevationInMeters = await getElevation(landing.latitude, landing.longitude);
      const landingElevation = landingElevationInMeters * metersToFeetConstant;

      const area = 32.024857 ; // pixels are 1.296000e+05m^2 according to the expanse() function in R, area needs to be in acres

      const centerOfBiomassElevationInMeters = await getElevation(
        centerOfBiomassLat,
        centerOfBiomassLng
      );
      const centerOfBiomassElevation = centerOfBiomassElevationInMeters * metersToFeetConstant;
      
      let land_own = "private"
      if (firstCluster.Land_Ownership !== null && firstCluster.Land_Ownership !== undefined && firstCluster.Land_Ownership !== '') {
        land_own = firstCluster.Land_Ownership
      }


      // get density
      //console.log(firstCluster.Forest_type)
      const wood_density = woodDensityMap.get(firstCluster.Forest_type) || 589.68; //kg/m^3, 589.68 is the average wood density of all forest types in the USDA raster
      //console.log(wood_density)

      //NEVER READ
      //const meanYardingDistance = 6 //totalBiomassDistance / totalBiomass;

      const averageSlope =
        Math.abs((landingElevation - centerOfBiomassElevation) / centerOfBiomassDistanceToLanding) *
        100;


      //update treated clusters with new data
      treatedClusters.forEach((cluster_ID) => {
        cluster_ID.cluster_no = firstCluster.DEM360;
        cluster_ID.foliage_tonsAcre = firstCluster.Foliage_tonsAcre;
        //cluster_ID.branch_tonsAcre = firstCluster.Branch_tonsAcre;
        //cluster_ID.stem4to6_tonsAcre = firstCluster.Stem4to6_tonsAcre;
        //cluster_ID.stem6to9_tonsAcre = firstCluster.Stem6to9_tonsAcre;
        //cluster_ID.stem9Plus_tonsAcre = firstCluster.Stem9Plus_tonsAcre;
        cluster_ID.center_lng = centerOfBiomassLng;
        cluster_ID.center_lat = centerOfBiomassLat;
        cluster_ID.land_use = land_own;
        cluster_ID.county_name = firstCluster.County;
        cluster_ID.forest_type = firstCluster.Forest_type;
        cluster_ID.site_class = '0';
        cluster_ID.haz_class = firstCluster.Hazard_Class;
        //cluster_ID.treatment = firstCluster['Treatment Name'];
        cluster_ID.center_elevation = centerElevation;
        cluster_ID.landing_lat = landing.latitude;
        cluster_ID.landing_lng = landing.longitude;
        cluster_ID.landing_elevation = landingElevation; 
        cluster_ID.area = area;
        cluster_ID.mean_yarding = mean_yarding; 
        cluster_ID.slope = averageSlope;
        cluster_ID.year = year;
        cluster_ID.wood_density = wood_density;
      })
      
      resolve(treatedClusters);
    });
  });
};
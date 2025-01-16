export interface TreatedCluster {
  DEM360: string;
  cluster_no: string;
  'Treatment Name': string;
  treatmentid: number;
  center_lng: number;
  lng: number;
  center_lat: number;
  lat: number;
  Stem6to9_tonsAcre: number;
  stem6to9_tonsAcre: number;
  Stem4to6_tonsAcre: number;
  stem4to6_tonsAcre: number;
  Stem9Plus_tonsAcre: number;
  stem9plus_tonsacre: number;
  Branch_tonsAcre: number;
  branch_tonsAcre: number;
  Foliage_tonsAcre: number;
  foliage_tonsAcre: number;
  Forest_type: string;
  forest_type: string;
  County: string;
  county_name: string;
  Hazard_Class: number;
  haz_class: number;
  Land_Ownership: string;
  land_use: string; ///Below needs to be added in data prep
  site_class: string;
  center_elevation: number;
  slope: number;
  area: number;
  landing_lng: number;
  landing_lat: number;
  landing_elevation: number;
  mean_yarding: number;
  year: number;
  wood_density: number;
}

export interface PixelVariables {
  cluster_no: string;
  county_name: string;
  land_use: string;
  site_class: number;
  forest_type: string;
  haz_class: number;
  year: number;

  ba_15: number;
  ba_2: number;
  ba_25: number;
  ba_35: number;
  ba_40: number;
  ba_7: number;
  bmcwn_15: number;
  bmcwn_2: number;
  bmcwn_25: number;
  bmcwn_35: number;
  bmcwn_40: number;
  bmcwn_7: number;
  bmfol_15: number;
  bmfol_2: number;
  bmfol_25: number;
  bmfol_35: number;
  bmfol_40: number;
  bmfol_7: number;
  bmstm_15: number;
  bmstm_2: number;
  bmstm_25: number;
  bmstm_35: number;
  bmstm_40: number;
  bmstm_7: number;
  dbmcn_15: number;
  dbmcn_2: number;
  dbmcn_25: number;
  dbmcn_35: number;
  dbmcn_40: number;
  dbmcn_7: number;
  dbmsm_15: number;
  dbmsm_2: number;
  dbmsm_25: number;
  dbmsm_35: number;
  dbmsm_40: number;
  dbmsm_7: number;
  sng_15: number;
  sng_2: number;
  sng_25: number;
  sng_35: number;
  sng_40: number;
  sng_7: number;
  tpa_15: number;
  tpa_2: number;
  tpa_25: number;
  tpa_35: number;
  tpa_40: number;
  tpa_7: number;
  vmsg_15: number;
  vmsg_2: number;
  vmsg_25: number;
  vmsg_35: number;
  vmsg_40: number;
  vmsg_7: number;
  vol_15: number;
  vol_2: number;
  vol_25: number;
  vol_35: number;
  vol_40: number;
  vol_7: number;
}

export class PixelVariablesClass implements PixelVariables {
  cluster_no = '';
  county_name = '';
  land_use = '';
  site_class = 0;
  forest_type = '';
  haz_class = 0;
  year = 0;
  ba_2 = 0;
  ba_7 = 0;
  ba_15 = 0;
  ba_25 = 0;
  ba_35 = 0;
  ba_40 = 0;
  bmcwn_15 = 0;
  bmcwn_2 = 0;
  bmcwn_25 = 0;
  bmcwn_35 = 0;
  bmcwn_40 = 0;
  bmcwn_7 = 0;
  dbmcn_2 = 0;
  dbmcn_7 = 0;
  dbmcn_15 = 0;
  dbmcn_25 = 0;
  dbmcn_35 = 0;
  dbmcn_40 = 0;
  dbmsm_2 = 0;
  dbmsm_7 = 0;
  dbmsm_15 = 0;
  dbmsm_25 = 0;
  dbmsm_35 = 0;
  dbmsm_40 = 0;
  bmfol_15 = 0;
  bmfol_2 = 0;
  bmfol_25 = 0;
  bmfol_35 = 0;
  bmfol_40 = 0;
  bmfol_7 = 0;
  bmstm_15 = 0;
  bmstm_2 = 0;
  bmstm_25 = 0;
  bmstm_35 = 0;
  bmstm_40 = 0;
  bmstm_7 = 0;
  sng_15 = 0;
  sng_2 = 0;
  sng_25 = 0;
  sng_35 = 0;
  sng_40 = 0;
  sng_7 = 0;
  tpa_15 = 0;
  tpa_2 = 0;
  tpa_25 = 0;
  tpa_35 = 0;
  tpa_40 = 0;
  tpa_7 = 0;
  vol_15 = 0;
  vol_2 = 0;
  vol_25 = 0;
  vol_35 = 0;
  vol_40 = 0;
  vol_7 = 0;
  vmsg_15 = 0;
  vmsg_2 = 0;
  vmsg_25 = 0;
  vmsg_35 = 0;
  vmsg_40 = 0;
  vmsg_7 = 0;
}

export interface Pixel extends PixelVariables {
  elevation: number;
  lat: number;
  lng: number;
}

export class PixelClass extends PixelVariablesClass implements Pixel {
  site_class = 0;
  elevation = 0;
  county_name = '';
  land_use = 'Private';
  lat = 0;
  lng = 0;
  cluster_no = '';
  haz_class = 0;
}

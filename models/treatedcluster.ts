import { PixelVariables } from './pixel';

export interface TreatedCluster extends PixelVariables {
  cluster_no: string;
  treatmentid: number;
  year: number;
  landing_lat: number;
  landing_lng: number;
  landing_elevation: number;
  center_lng: number;
  center_lat: number;
  center_elevation: number;
  slope: number;
  area: number;
  mean_yarding: number;
}

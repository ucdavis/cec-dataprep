import { getElevation } from './elevation_alt';

const testElevation = async () => {
  const elevation = await getElevation(41.1, -123.1);

  return elevation;
};

testElevation().then(console.log).catch(console.error);

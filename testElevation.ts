import { getElevation } from './elevation';

const testElevation = async () => {
  const elevation = await getElevation(39.29701, -121.2147);

  return elevation;
};

testElevation().then(console.log).catch(console.error);

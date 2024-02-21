import { MikroORM } from '@mikro-orm/core';
import config from '../mikro-orm.config';

const script = async (orm: MikroORM) => {};

const execute = async () => {
  const orm = await MikroORM.init(config);
  await script(orm);
  await orm.close(true);
};

execute()
  .then(console.log)
  .catch(console.error);

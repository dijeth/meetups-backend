import { MikroORM } from '@mikro-orm/core';
import config from '../mikro-orm.config';
import { UserEntity } from '../users/user.entity';

const script = async (orm: MikroORM) => {
  console.log(await orm.em.find(UserEntity, { email: 'demo@email' }));
};

const execute = async () => {
  const orm = await MikroORM.init(config);
  await script(orm);
  await orm.close(true);
};

execute()
  .then(() => {
    console.log('Done!');
  })
  .catch(console.error);

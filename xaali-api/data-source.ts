import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';

export const AppDataSource = new DataSource({
  type: 'mongodb',
  url: process.env.MONGODB_URI,
  database: 'xaali-db',
  entities: [join(__dirname, '**/*.entity.{js,ts}')],
  migrations: [join(__dirname, 'migrations/*.{js,ts}')],
  synchronize: false,
});

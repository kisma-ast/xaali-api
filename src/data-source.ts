import 'dotenv/config';
import { DataSource } from 'typeorm';
import { join } from 'path';

export const AppDataSource = new DataSource({
  type: 'mongodb',
  url: process.env.MONGODB_URI,
  database: 'xaali-db',
  entities: [join(__dirname, '/**/*.entity.{ts,js}')],
  migrations: [join(__dirname, '/migrations/*.{ts,js}')],
  synchronize: true,
  logging: false,
});
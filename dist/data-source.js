"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("dotenv/config");
const typeorm_1 = require("typeorm");
const path_1 = require("path");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: +(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '1107',
    database: process.env.DB_DATABASE || 'xaali',
    entities: [(0, path_1.join)(__dirname, 'src/**/*.entity.{ts,js}')],
    migrations: [(0, path_1.join)(__dirname, 'src/migrations/*.{ts,js}')],
    synchronize: false,
});
//# sourceMappingURL=data-source.js.map
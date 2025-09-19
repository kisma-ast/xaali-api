"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("dotenv/config");
const typeorm_1 = require("typeorm");
const path_1 = require("path");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'mongodb',
    url: process.env.MONGODB_URI,
    database: 'xaali-db',
    entities: [(0, path_1.join)(__dirname, 'src/**/*.entity.{ts,js}')],
    migrations: [(0, path_1.join)(__dirname, 'src/migrations/*.{ts,js}')],
    synchronize: false,
});
//# sourceMappingURL=data-source.js.map
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
    entities: [(0, path_1.join)(__dirname, '/**/*.entity.{ts,js}')],
    migrations: [(0, path_1.join)(__dirname, '/migrations/*.{ts,js}')],
    synchronize: true,
    logging: false,
});
//# sourceMappingURL=data-source.js.map
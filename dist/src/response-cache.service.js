"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ResponseCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseCacheService = void 0;
const common_1 = require("@nestjs/common");
let ResponseCacheService = ResponseCacheService_1 = class ResponseCacheService {
    logger = new common_1.Logger(ResponseCacheService_1.name);
    cache = new Map();
    TTL = 10 * 60 * 1000;
    MAX_SIZE = 1000;
    generateKey(query, category) {
        return `${query.toLowerCase().trim()}_${category || 'all'}`;
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() - entry.timestamp > this.TTL) {
            this.cache.delete(key);
            return null;
        }
        entry.hits++;
        this.logger.log(`💨 Cache hit pour: ${key} (${entry.hits} hits)`);
        return entry.data;
    }
    set(key, data) {
        if (this.cache.size >= this.MAX_SIZE) {
            this.evictOldest();
        }
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            hits: 0
        });
    }
    evictOldest() {
        let oldestKey = '';
        let oldestTime = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.MAX_SIZE,
            ttl: this.TTL
        };
    }
};
exports.ResponseCacheService = ResponseCacheService;
exports.ResponseCacheService = ResponseCacheService = ResponseCacheService_1 = __decorate([
    (0, common_1.Injectable)()
], ResponseCacheService);
//# sourceMappingURL=response-cache.service.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PineconeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PineconeService = void 0;
const common_1 = require("@nestjs/common");
const pinecone_1 = require("@pinecone-database/pinecone");
const config_1 = require("../config");
let PineconeService = PineconeService_1 = class PineconeService {
    logger = new common_1.Logger(PineconeService_1.name);
    pinecone;
    index;
    constructor() {
        this.logger.log(` Configuration PineconeService:`);
        this.logger.log(`  - Index: ${config_1.PINECONE_CONFIG.INDEX_NAME}`);
        this.logger.log(`  - Dimensions: ${config_1.PINECONE_CONFIG.DIMENSIONS}`);
        this.logger.log(`  - Environnement: ${config_1.PINECONE_CONFIG.ENVIRONMENT}`);
        this.initializePinecone();
    }
    async initializePinecone() {
        try {
            const { API_KEY, ENVIRONMENT, INDEX_NAME } = config_1.PINECONE_CONFIG;
            if (!API_KEY || API_KEY === 'your_pinecone_api_key_here') {
                this.logger.warn('Pinecone API key not configured. Service will run in limited mode.');
                return;
            }
            this.pinecone = new pinecone_1.Pinecone({ apiKey: API_KEY });
            this.index = this.pinecone.index(INDEX_NAME);
            this.logger.log(`Pinecone initialized successfully with index: ${INDEX_NAME}`);
        }
        catch (error) {
            this.logger.error('Failed to initialize Pinecone:', error);
            this.logger.warn('Continuing without Pinecone...');
        }
    }
    async uploadDocument(document) {
        try {
            await this.index.upsert([{
                    id: document.id,
                    values: document.values,
                    metadata: document.metadata,
                }]);
            this.logger.log(`Document uploaded successfully: ${document.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to upload document ${document.id}:`, error);
            throw error;
        }
    }
    async uploadDocuments(documents) {
        try {
            const vectors = documents.map((doc) => ({
                id: doc.id,
                values: doc.values,
                metadata: doc.metadata,
            }));
            await this.index.upsert(vectors);
            this.logger.log(`${documents.length} documents uploaded successfully`);
        }
        catch (error) {
            this.logger.error('Failed to upload documents:', error);
            throw error;
        }
    }
    async searchSimilar(queryVector, topK = 5, filter) {
        try {
            if (!this.index) {
                this.logger.warn('Pinecone not initialized, returning empty results');
                return [];
            }
            this.logger.log(` Recherche Pinecone: topK=${topK}, dimensions=${queryVector.length}`);
            if (filter) {
                this.logger.log(` Filtre appliqué: ${JSON.stringify(filter)}`);
            }
            const queryResponse = await this.index.query({
                vector: queryVector,
                topK,
                includeMetadata: true,
                filter,
            });
            this.logger.log(` Recherche Pinecone terminée: ${queryResponse.matches.length} résultats trouvés`);
            const results = queryResponse.matches.map((match) => ({
                id: match.id,
                score: match.score,
                metadata: match.metadata,
            }));
            results.forEach((result, index) => {
                this.logger.log(`  📄 Résultat ${index + 1}: ID=${result.id}, Score=${(result.score * 100).toFixed(1)}%`);
            });
            return results;
        }
        catch (error) {
            this.logger.error(' Erreur lors de la recherche Pinecone:', error);
            throw error;
        }
    }
    async deleteDocument(id) {
        try {
            await this.index.deleteOne(id);
            this.logger.log(`Document deleted successfully: ${id}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete document ${id}:`, error);
            throw error;
        }
    }
    async deleteDocuments(ids) {
        try {
            await this.index.deleteMany(ids);
            this.logger.log(`${ids.length} documents deleted successfully`);
        }
        catch (error) {
            this.logger.error('Failed to delete documents:', error);
            throw error;
        }
    }
    async getIndexStats() {
        try {
            const stats = await this.index.describeIndexStats();
            return stats;
        }
        catch (error) {
            this.logger.error('Failed to get index stats:', error);
            throw error;
        }
    }
    async parsePDF(buffer) {
        try {
            if (!buffer || buffer.length === 0) {
                throw new Error('Invalid or empty buffer provided');
            }
            const pdfParse = require('pdf-parse');
            const data = await pdfParse(buffer);
            return data.text;
        }
        catch (error) {
            this.logger.error('Error parsing PDF:', error);
            throw new Error(`Failed to parse PDF: ${error.message}`);
        }
    }
    splitTextIntoChunks(text, chunkSize, overlap) {
        if (!text || text.length === 0) {
            return [];
        }
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            const end = Math.min(start + chunkSize, text.length);
            const chunk = text.substring(start, end).trim();
            if (chunk.length > 0) {
                chunks.push(chunk);
            }
            start = end - overlap;
            if (start >= text.length)
                break;
        }
        return chunks;
    }
};
exports.PineconeService = PineconeService;
exports.PineconeService = PineconeService = PineconeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PineconeService);
//# sourceMappingURL=pinecone.service.js.map
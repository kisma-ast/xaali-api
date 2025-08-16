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
var EmbeddingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("../config");
let EmbeddingService = EmbeddingService_1 = class EmbeddingService {
    logger = new common_1.Logger(EmbeddingService_1.name);
    openaiApiKey;
    constructor() {
        if (!config_1.AI_CONFIG.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not configured');
        }
        this.openaiApiKey = config_1.AI_CONFIG.OPENAI_API_KEY;
    }
    async generateEmbedding(text) {
        try {
            this.logger.log(`🧠 Génération d'embedding avec le modèle: ${config_1.AI_CONFIG.MODELS.EMBEDDING}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: text,
                    model: config_1.AI_CONFIG.MODELS.EMBEDDING,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
            }
            const data = await response.json();
            const embedding = data.data[0].embedding;
            this.logger.log(`✅ Embedding généré avec succès: ${embedding.length} dimensions`);
            return embedding;
        }
        catch (error) {
            this.logger.error('Error generating embedding:', error);
            if (error.name === 'AbortError') {
                throw new Error('OpenAI API request timed out after 30 seconds');
            }
            if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message.includes('timeout')) {
                throw new Error('Connection timeout to OpenAI API. Please check your internet connection.');
            }
            throw error;
        }
    }
    async generateEmbeddings(texts) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.openaiApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: texts,
                    model: config_1.AI_CONFIG.MODELS.EMBEDDING,
                }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
            }
            const data = await response.json();
            return data.data.map((item) => item.embedding);
        }
        catch (error) {
            this.logger.error('Error generating embeddings:', error);
            if (error.name === 'AbortError') {
                throw new Error('OpenAI API request timed out after 60 seconds');
            }
            if (error.code === 'UND_ERR_CONNECT_TIMEOUT' || error.message.includes('timeout')) {
                throw new Error('Connection timeout to OpenAI API. Please check your internet connection.');
            }
            throw error;
        }
    }
    validateConfig() {
        if (!this.openaiApiKey) {
            this.logger.error('OpenAI API key is not configured');
            return false;
        }
        return true;
    }
};
exports.EmbeddingService = EmbeddingService;
exports.EmbeddingService = EmbeddingService = EmbeddingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmbeddingService);
//# sourceMappingURL=embedding.service.js.map
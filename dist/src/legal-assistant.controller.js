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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LegalAssistantController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalAssistantController = void 0;
const common_1 = require("@nestjs/common");
const legal_assistant_service_1 = require("./legal-assistant.service");
let LegalAssistantController = LegalAssistantController_1 = class LegalAssistantController {
    legalAssistantService;
    logger = new common_1.Logger(LegalAssistantController_1.name);
    constructor(legalAssistantService) {
        this.legalAssistantService = legalAssistantService;
    }
    async searchDocuments(legalQuery) {
        try {
            this.logger.log(`Search request: ${legalQuery.query}`);
            const results = await this.legalAssistantService.searchLegalDocuments(legalQuery);
            if (results.formattedResponse) {
                return {
                    success: true,
                    data: {
                        query: results.query,
                        formattedResponse: results.formattedResponse,
                        documentCount: results.relevantDocuments.length,
                    },
                };
            }
            return {
                success: true,
                data: results,
            };
        }
        catch (error) {
            this.logger.error('Error in search:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async searchInstant(legalQuery, res) {
        try {
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            const immediateResponse = {
                success: true,
                status: 'processing',
                message: 'Analyse en cours...',
                query: legalQuery.query
            };
            res.write(`data: ${JSON.stringify(immediateResponse)}\n\n`);
            const results = await this.legalAssistantService.searchLegalDocuments(legalQuery);
            const finalResponse = {
                success: true,
                status: 'completed',
                data: {
                    query: results.query,
                    formattedResponse: results.formattedResponse,
                    documentCount: results.relevantDocuments.length,
                }
            };
            res.write(`data: ${JSON.stringify(finalResponse)}\n\n`);
            res.end();
        }
        catch (error) {
            const errorResponse = {
                success: false,
                status: 'error',
                error: error.message
            };
            res.write(`data: ${JSON.stringify(errorResponse)}\n\n`);
            res.end();
        }
    }
    async searchDocumentsFormatted(legalQuery) {
        try {
            this.logger.log(`Formatted search request: ${legalQuery.query}`);
            const results = await this.legalAssistantService.searchLegalDocuments(legalQuery);
            return {
                success: true,
                data: {
                    query: results.query,
                    formattedResponse: results.formattedResponse,
                    documentCount: results.relevantDocuments.length,
                },
            };
        }
        catch (error) {
            this.logger.error('Error in formatted search:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async getLegalAdvice(body) {
        try {
            this.logger.log(`Legal advice request: ${body.query}`);
            const advice = await this.legalAssistantService.getLegalAdvice(body.query, body.category);
            return {
                success: true,
                data: advice,
            };
        }
        catch (error) {
            this.logger.error('Error getting legal advice:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async searchByCategory(category, query, topK) {
        try {
            this.logger.log(`Category search: ${category}`);
            const results = await this.legalAssistantService.searchByCategory(category, query, topK ? parseInt(topK.toString()) : 10);
            return {
                success: true,
                data: results,
            };
        }
        catch (error) {
            this.logger.error('Error in category search:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async getStats() {
        try {
            const stats = await this.legalAssistantService.getDocumentStats();
            return {
                success: true,
                data: stats,
            };
        }
        catch (error) {
            this.logger.error('Error getting stats:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
};
exports.LegalAssistantController = LegalAssistantController;
__decorate([
    (0, common_1.Post)('search'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LegalAssistantController.prototype, "searchDocuments", null);
__decorate([
    (0, common_1.Post)('search-instant'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LegalAssistantController.prototype, "searchInstant", null);
__decorate([
    (0, common_1.Post)('search-formatted'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LegalAssistantController.prototype, "searchDocumentsFormatted", null);
__decorate([
    (0, common_1.Post)('advice'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LegalAssistantController.prototype, "getLegalAdvice", null);
__decorate([
    (0, common_1.Get)('search-by-category'),
    __param(0, (0, common_1.Query)('category')),
    __param(1, (0, common_1.Query)('query')),
    __param(2, (0, common_1.Query)('topK')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], LegalAssistantController.prototype, "searchByCategory", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LegalAssistantController.prototype, "getStats", null);
exports.LegalAssistantController = LegalAssistantController = LegalAssistantController_1 = __decorate([
    (0, common_1.Controller)('legal-assistant'),
    __metadata("design:paramtypes", [legal_assistant_service_1.LegalAssistantService])
], LegalAssistantController);
//# sourceMappingURL=legal-assistant.controller.js.map
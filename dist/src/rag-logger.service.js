"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGLoggerService = void 0;
const common_1 = require("@nestjs/common");
let RAGLoggerService = class RAGLoggerService {
    logger = new common_1.Logger('RAG-SYSTEM');
    logRAGResponse(query, response, processingTime) {
        const logData = {
            timestamp: new Date().toISOString(),
            system: 'RAG',
            query: query.substring(0, 100),
            confidence: response.confidence,
            processingTime: `${processingTime}ms`,
            sourcesCount: response.sources?.length || 0,
            pineconeHits: response.metadata?.pineconeHits || 0,
            webSearchUsed: response.metadata?.webSearchUsed || false,
        };
        this.logger.log(`🤖 RAG Response Generated: ${JSON.stringify(logData)}`);
    }
    logRAGError(query, error) {
        this.logger.error(`❌ RAG Error for query "${query.substring(0, 50)}": ${error.message}`);
    }
};
exports.RAGLoggerService = RAGLoggerService;
exports.RAGLoggerService = RAGLoggerService = __decorate([
    (0, common_1.Injectable)()
], RAGLoggerService);
//# sourceMappingURL=rag-logger.service.js.map
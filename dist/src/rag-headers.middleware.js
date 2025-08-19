"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAGHeadersMiddleware = void 0;
const common_1 = require("@nestjs/common");
let RAGHeadersMiddleware = class RAGHeadersMiddleware {
    use(req, res, next) {
        if (req.path.includes('/rag/') || req.path.includes('/legal-assistant/') || req.path.includes('/citizens/')) {
            res.setHeader('X-AI-System', 'Xaali-RAG');
            res.setHeader('X-RAG-Enabled', 'true');
            res.setHeader('X-RAG-Components', 'Pinecone,OpenAI,NestJS');
            res.setHeader('X-Response-Type', 'AI-Generated');
            res.setHeader('X-Legal-Disclaimer', 'AI-assisted legal information - consult a lawyer for specific advice');
        }
        next();
    }
};
exports.RAGHeadersMiddleware = RAGHeadersMiddleware;
exports.RAGHeadersMiddleware = RAGHeadersMiddleware = __decorate([
    (0, common_1.Injectable)()
], RAGHeadersMiddleware);
//# sourceMappingURL=rag-headers.middleware.js.map
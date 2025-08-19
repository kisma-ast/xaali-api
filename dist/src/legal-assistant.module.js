"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LegalAssistantModule = void 0;
const common_1 = require("@nestjs/common");
const legal_assistant_controller_1 = require("./legal-assistant.controller");
const rag_controller_1 = require("./rag.controller");
const legal_assistant_service_1 = require("./legal-assistant.service");
const ai_response_service_1 = require("./ai-response.service");
const rag_orchestrator_service_1 = require("./rag-orchestrator.service");
const pinecone_1 = require("./pinecone");
let LegalAssistantModule = class LegalAssistantModule {
};
exports.LegalAssistantModule = LegalAssistantModule;
exports.LegalAssistantModule = LegalAssistantModule = __decorate([
    (0, common_1.Module)({
        imports: [pinecone_1.PineconeModule],
        controllers: [legal_assistant_controller_1.LegalAssistantController, rag_controller_1.RAGController],
        providers: [
            legal_assistant_service_1.LegalAssistantService,
            ai_response_service_1.AIResponseService,
            rag_orchestrator_service_1.RAGOrchestratorService
        ],
        exports: [legal_assistant_service_1.LegalAssistantService, rag_orchestrator_service_1.RAGOrchestratorService],
    })
], LegalAssistantModule);
//# sourceMappingURL=legal-assistant.module.js.map
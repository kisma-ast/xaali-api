"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const webrtc_signaling_gateway_1 = require("./webrtc-signaling.gateway");
const pinecone_1 = require("./pinecone");
const legal_assistant_index_1 = require("./legal-assistant.index");
const bictorys_module_1 = require("./bictorys.module");
const paytech_module_1 = require("./paytech.module");
const fine_tuning_service_1 = require("./fine-tuning.service");
const memory_auth_controller_1 = require("./memory-auth.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            pinecone_1.PineconeModule,
            legal_assistant_index_1.LegalAssistantModule,
            bictorys_module_1.BictorysModule,
            paytech_module_1.PayTechModule,
        ],
        controllers: [app_controller_1.AppController, memory_auth_controller_1.MemoryAuthController],
        providers: [app_service_1.AppService, webrtc_signaling_gateway_1.WebRTCSignalingGateway, fine_tuning_service_1.FineTuningService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
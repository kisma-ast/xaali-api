"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CitizensModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const citizens_controller_1 = require("./citizens.controller");
const citizens_service_1 = require("./citizens.service");
const citizen_entity_1 = require("./citizen.entity");
const ai_question_entity_1 = require("./ai-question.entity");
const case_entity_1 = require("./case.entity");
let CitizensModule = class CitizensModule {
};
exports.CitizensModule = CitizensModule;
exports.CitizensModule = CitizensModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([citizen_entity_1.Citizen, ai_question_entity_1.AiQuestion, case_entity_1.Case])],
        controllers: [citizens_controller_1.CitizensController],
        providers: [citizens_service_1.CitizensService],
        exports: [citizens_service_1.CitizensService],
    })
], CitizensModule);
//# sourceMappingURL=citizens.module.js.map
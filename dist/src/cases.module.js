"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CasesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cases_service_1 = require("./cases.service");
const cases_controller_1 = require("./cases.controller");
const case_entity_1 = require("./case.entity");
const lawyer_entity_1 = require("./lawyer.entity");
const lawyer_notification_entity_1 = require("./lawyer-notification.entity");
let CasesModule = class CasesModule {
};
exports.CasesModule = CasesModule;
exports.CasesModule = CasesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([case_entity_1.Case, lawyer_entity_1.Lawyer, lawyer_notification_entity_1.LawyerNotification])],
        controllers: [cases_controller_1.CasesController],
        providers: [cases_service_1.CasesService],
    })
], CasesModule);
//# sourceMappingURL=cases.module.js.map
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const payments_service_1 = require("./payments.service");
const payments_controller_1 = require("./payments.controller");
const payment_entity_1 = require("./payment.entity");
const case_entity_1 = require("./case.entity");
const bictorys_module_1 = require("./bictorys.module");
const paytech_module_1 = require("./paytech.module");
const simplified_case_service_1 = require("./simplified-case.service");
const email_service_1 = require("./email.service");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([payment_entity_1.Payment, case_entity_1.Case]), bictorys_module_1.BictorysModule, paytech_module_1.PayTechModule],
        controllers: [payments_controller_1.PaymentsController],
        providers: [payments_service_1.PaymentsService, simplified_case_service_1.SimplifiedCaseService, email_service_1.EmailService],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map
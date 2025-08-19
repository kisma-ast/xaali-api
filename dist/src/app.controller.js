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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const app_service_1 = require("./app.service");
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return this.appService.getHello();
    }
    getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
    testBictorys(body) {
        const { phoneNumber, amount } = body;
        if (!phoneNumber) {
            return { success: false, message: 'Numéro de téléphone requis' };
        }
        if (!amount) {
            return { success: false, message: 'Montant requis' };
        }
        const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '');
        const isValid = /^[67][0-9]{8}$/.test(cleanPhone) || /^\+221[67][0-9]{8}$/.test(cleanPhone);
        if (!isValid) {
            return { success: false, message: 'Format numéro invalide' };
        }
        const prefix = cleanPhone.substring(0, 2);
        let provider = 'wave';
        if (['77', '78'].includes(prefix))
            provider = 'orange_money';
        else if (['70', '75', '76'].includes(prefix))
            provider = 'mtn_mobile_money';
        else if (['60', '61'].includes(prefix))
            provider = 'moov_money';
        const formattedPhone = cleanPhone.startsWith('+221') ? cleanPhone : `+221${cleanPhone}`;
        return {
            success: true,
            data: {
                phoneNumber: formattedPhone,
                provider,
                amount,
                message: 'Validation réussie'
            }
        };
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AppController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Post)('test-bictorys'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "testBictorys", null);
exports.AppController = AppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
//# sourceMappingURL=app.controller.js.map
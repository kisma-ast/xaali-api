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
exports.CitizensController = void 0;
const common_1 = require("@nestjs/common");
const citizens_service_1 = require("./citizens.service");
let CitizensController = class CitizensController {
    citizensService;
    constructor(citizensService) {
        this.citizensService = citizensService;
    }
    async createCitizen() {
        const citizen = await this.citizensService.createCitizen();
        return {
            citizen,
            message: 'Citizen created successfully. You can ask 2 questions for free.',
        };
    }
    async getCitizen(id) {
        const citizen = await this.citizensService.getCitizen(id);
        if (!citizen) {
            throw new common_1.HttpException('Citizen not found', common_1.HttpStatus.NOT_FOUND);
        }
        return citizen;
    }
    async askQuestion(citizenId, body) {
        const canAsk = await this.citizensService.canAskQuestion(citizenId);
        if (!canAsk) {
            throw new common_1.HttpException('You have reached the limit of 2 free questions. Please pay to continue.', common_1.HttpStatus.FORBIDDEN);
        }
        return await this.citizensService.askQuestion(citizenId, body.question);
    }
    async getQuestionsHistory(citizenId) {
        return await this.citizensService.getQuestionsHistory(citizenId);
    }
    async createCase(citizenId, body) {
        return await this.citizensService.createCase(citizenId, body.title, body.description);
    }
    async markAsPaid(citizenId, body) {
        await this.citizensService.markAsPaid(citizenId, body.paymentId);
        return { message: 'Payment processed successfully' };
    }
    async getCitizenCases(citizenId) {
        return await this.citizensService.getCitizenCases(citizenId);
    }
};
exports.CitizensController = CitizensController;
__decorate([
    (0, common_1.Post)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CitizensController.prototype, "createCitizen", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CitizensController.prototype, "getCitizen", null);
__decorate([
    (0, common_1.Post)(':id/questions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CitizensController.prototype, "askQuestion", null);
__decorate([
    (0, common_1.Get)(':id/questions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CitizensController.prototype, "getQuestionsHistory", null);
__decorate([
    (0, common_1.Post)(':id/cases'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CitizensController.prototype, "createCase", null);
__decorate([
    (0, common_1.Post)(':id/payment'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CitizensController.prototype, "markAsPaid", null);
__decorate([
    (0, common_1.Get)(':id/cases'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CitizensController.prototype, "getCitizenCases", null);
exports.CitizensController = CitizensController = __decorate([
    (0, common_1.Controller)('citizens'),
    __metadata("design:paramtypes", [citizens_service_1.CitizensService])
], CitizensController);
//# sourceMappingURL=citizens.controller.js.map
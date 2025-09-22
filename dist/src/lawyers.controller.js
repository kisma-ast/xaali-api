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
var LawyersController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LawyersController = void 0;
const common_1 = require("@nestjs/common");
const lawyers_service_1 = require("./lawyers.service");
let LawyersController = LawyersController_1 = class LawyersController {
    lawyersService;
    logger = new common_1.Logger(LawyersController_1.name);
    constructor(lawyersService) {
        this.lawyersService = lawyersService;
    }
    findAll() {
        return this.lawyersService.findAll();
    }
    findOne(id) {
        return this.lawyersService.findOne(id);
    }
    findLawyerCases(id) {
        return this.lawyersService.findLawyerCases(id);
    }
    findLawyerWithDetails(id) {
        return this.lawyersService.findLawyerWithDetails(id);
    }
    async create(lawyer) {
        try {
            this.logger.log(`Requête de création d'avocat reçue:`, lawyer);
            return await this.lawyersService.create(lawyer);
        }
        catch (error) {
            this.logger.error(`Erreur dans le contrôleur:`, error);
            throw new common_1.HttpException(error.message || 'Erreur lors de la création de l\'avocat', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    update(id, lawyer) {
        return this.lawyersService.update(id, lawyer);
    }
    remove(id) {
        return this.lawyersService.remove(id);
    }
};
exports.LawyersController = LawyersController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LawyersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LawyersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/cases'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LawyersController.prototype, "findLawyerCases", null);
__decorate([
    (0, common_1.Get)(':id/details'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LawyersController.prototype, "findLawyerWithDetails", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LawyersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LawyersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LawyersController.prototype, "remove", null);
exports.LawyersController = LawyersController = LawyersController_1 = __decorate([
    (0, common_1.Controller)('lawyers'),
    __metadata("design:paramtypes", [lawyers_service_1.LawyersService])
], LawyersController);
//# sourceMappingURL=lawyers.controller.js.map
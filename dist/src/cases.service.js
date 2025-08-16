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
exports.CasesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const case_entity_1 = require("./case.entity");
const lawyer_entity_1 = require("./lawyer.entity");
const lawyer_notification_entity_1 = require("./lawyer-notification.entity");
let CasesService = class CasesService {
    casesRepository;
    lawyersRepository;
    notificationsRepository;
    constructor(casesRepository, lawyersRepository, notificationsRepository) {
        this.casesRepository = casesRepository;
        this.lawyersRepository = lawyersRepository;
        this.notificationsRepository = notificationsRepository;
    }
    findAll() {
        return this.casesRepository.find({
            relations: ['citizen', 'lawyer'],
        });
    }
    findOne(id) {
        return this.casesRepository.findOne({
            where: { id },
            relations: ['citizen', 'lawyer'],
        });
    }
    async create(caseData) {
        const newCase = this.casesRepository.create(caseData);
        const savedCase = await this.casesRepository.save(newCase);
        await this.notifyAllLawyers(savedCase.id);
        return savedCase;
    }
    async update(id, caseData) {
        await this.casesRepository.update(id, caseData);
        return this.findOne(id);
    }
    async remove(id) {
        await this.casesRepository.delete(id);
    }
    async getPendingCases() {
        return this.casesRepository.find({
            where: { status: 'pending' },
            relations: ['citizen'],
            order: { createdAt: 'DESC' },
        });
    }
    async getCasesByLawyer(lawyerId) {
        return this.casesRepository.find({
            where: { lawyerId },
            relations: ['citizen'],
            order: { createdAt: 'DESC' },
        });
    }
    async assignLawyer(caseId, lawyerId) {
        const case_ = await this.findOne(caseId);
        if (!case_) {
            throw new Error('Case not found');
        }
        case_.lawyerId = lawyerId;
        case_.assignedLawyerId = lawyerId;
        case_.status = 'assigned';
        return await this.casesRepository.save(case_);
    }
    async notifyAllLawyers(caseId) {
        const lawyers = await this.lawyersRepository.find();
        for (const lawyer of lawyers) {
            const notification = this.notificationsRepository.create({
                lawyerId: lawyer.id,
                caseId,
                type: 'new_case',
                isRead: false,
                isAccepted: false,
            });
            await this.notificationsRepository.save(notification);
        }
    }
    async getLawyerNotifications(lawyerId) {
        return this.notificationsRepository.find({
            where: { lawyerId },
            relations: ['case', 'case.citizen'],
            order: { createdAt: 'DESC' },
        });
    }
    async markNotificationAsRead(notificationId) {
        await this.notificationsRepository.update(notificationId, { isRead: true });
    }
    async acceptCase(notificationId, lawyerId) {
        const notification = await this.notificationsRepository.findOne({
            where: { id: notificationId },
            relations: ['case'],
        });
        if (!notification) {
            throw new Error('Notification not found');
        }
        notification.isAccepted = true;
        await this.notificationsRepository.save(notification);
        return await this.assignLawyer(notification.case.id, lawyerId);
    }
};
exports.CasesService = CasesService;
exports.CasesService = CasesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(case_entity_1.Case)),
    __param(1, (0, typeorm_1.InjectRepository)(lawyer_entity_1.Lawyer)),
    __param(2, (0, typeorm_1.InjectRepository)(lawyer_notification_entity_1.LawyerNotification)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CasesService);
//# sourceMappingURL=cases.service.js.map
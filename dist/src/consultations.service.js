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
exports.ConsultationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const consultation_entity_1 = require("./consultation.entity");
let ConsultationsService = class ConsultationsService {
    consultationsRepository;
    constructor(consultationsRepository) {
        this.consultationsRepository = consultationsRepository;
    }
    findAll() {
        return this.consultationsRepository.find();
    }
    findOne(id) {
        return this.consultationsRepository.findOne({ where: { id } });
    }
    create(consultation) {
        const newConsultation = this.consultationsRepository.create(consultation);
        return this.consultationsRepository.save(newConsultation);
    }
    update(id, consultation) {
        return this.consultationsRepository.save({ id, ...consultation });
    }
    async remove(id) {
        await this.consultationsRepository.delete(id);
    }
    async createVideoConsultation(consultationData) {
        const meetingId = this.generateMeetingId();
        const meetingPassword = this.generateMeetingPassword();
        const consultation = this.consultationsRepository.create({
            ...consultationData,
            meetingId,
            meetingPassword,
            status: 'pending',
            meetingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/consultation/${meetingId}`,
        });
        return this.consultationsRepository.save(consultation);
    }
    async startConsultation(id) {
        const consultation = await this.findOne(id);
        if (!consultation)
            return null;
        consultation.status = 'active';
        consultation.startTime = new Date();
        consultation.isVideoEnabled = true;
        consultation.isAudioEnabled = true;
        return this.consultationsRepository.save(consultation);
    }
    async endConsultation(id) {
        const consultation = await this.findOne(id);
        if (!consultation)
            return null;
        consultation.status = 'completed';
        consultation.endTime = new Date();
        return this.consultationsRepository.save(consultation);
    }
    async findByMeetingId(meetingId) {
        return this.consultationsRepository.findOne({ where: { meetingId } });
    }
    async findByStatus(status) {
        return this.consultationsRepository.find({ where: { status } });
    }
    generateMeetingId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    generateMeetingPassword() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
};
exports.ConsultationsService = ConsultationsService;
exports.ConsultationsService = ConsultationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(consultation_entity_1.Consultation)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ConsultationsService);
//# sourceMappingURL=consultations.service.js.map
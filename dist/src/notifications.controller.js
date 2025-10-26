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
var NotificationsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const email_service_1 = require("./email.service");
let NotificationsController = NotificationsController_1 = class NotificationsController {
    emailService;
    logger = new common_1.Logger(NotificationsController_1.name);
    constructor(emailService) {
        this.emailService = emailService;
    }
    async sendTrackingNotifications(data) {
        try {
            console.log('📧 Envoi notifications de suivi:', data);
            console.log('📋 Données de suivi:', {
                trackingCode: data.trackingCode,
                caseId: data.caseId,
                citizenName: data.citizenName,
                amount: data.amount
            });
            if (data.email) {
                await this.emailService.sendTrackingNotification(data.email, data.trackingCode, data.trackingLink, data.amount);
                console.log('✅ Email envoyé à', data.email);
            }
            await this.sendWhatsAppNotification(data.phone, data.trackingCode, data.trackingLink, data.amount);
            console.log('✅ WhatsApp envoyé à', data.phone);
            return { success: true, message: 'Dossier complet créé et notifications envoyées' };
        }
        catch (error) {
            console.error('❌ Erreur envoi notifications:', error);
            return { success: false, message: 'Erreur envoi notifications' };
        }
    }
    async getTrackingInfo(trackingCode) {
        return { success: false, message: 'Service de suivi temporairement indisponible' };
    }
    async getAllTrackings() {
        return { success: false, message: 'Service de suivi temporairement indisponible' };
    }
    async sendTrackingEmail(data) {
        try {
            await this.emailService.sendTrackingEmail(data.trackingCode, data.trackingLink, data.email, data.caseData);
            console.log('✅ Email avec lien de suivi envoyé à:', data.email);
            return {
                success: true,
                message: 'Email avec lien de suivi envoyé'
            };
        }
        catch (error) {
            console.error('❌ Erreur envoi email suivi:', error);
            return {
                success: false,
                message: 'Erreur lors de l\'envoi de l\'email'
            };
        }
    }
    async getCaseByTracking(trackingCode) {
        try {
            const caseData = this.emailService.getCaseData(trackingCode);
            if (caseData) {
                return {
                    success: true,
                    caseData
                };
            }
            return {
                success: false,
                message: 'Dossier non trouvé'
            };
        }
        catch (error) {
            console.error('❌ Erreur récupération dossier:', error);
            return {
                success: false,
                message: 'Erreur lors de la récupération du dossier'
            };
        }
    }
    async sendWhatsAppNotification(phone, trackingCode, trackingLink, amount) {
        try {
            const message = `🎉 Paiement confirmé !

Montant: ${amount} FCFA
Code de suivi: ${trackingCode}

Suivez votre dossier ici:
${trackingLink}

Un avocat va bientôt prendre en charge votre cas.

- Équipe Xaali`;
            console.log('📱 WhatsApp à envoyer à', phone, ':', message);
            return { success: true };
        }
        catch (error) {
            console.error('❌ Erreur WhatsApp:', error);
            throw error;
        }
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Post)('send-tracking'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "sendTrackingNotifications", null);
__decorate([
    (0, common_1.Get)('tracking/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getTrackingInfo", null);
__decorate([
    (0, common_1.Get)('trackings/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getAllTrackings", null);
__decorate([
    (0, common_1.Post)('send-tracking-email'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "sendTrackingEmail", null);
__decorate([
    (0, common_1.Get)('get-case/:trackingCode'),
    __param(0, (0, common_1.Param)('trackingCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getCaseByTracking", null);
exports.NotificationsController = NotificationsController = NotificationsController_1 = __decorate([
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [email_service_1.EmailService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map
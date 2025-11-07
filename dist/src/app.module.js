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
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const lawyers_module_1 = require("./lawyers.module");
const cases_module_1 = require("./cases.module");
const consultations_module_1 = require("./consultations.module");
const payments_module_1 = require("./payments.module");
const notifications_module_1 = require("./notifications.module");
const citizens_module_1 = require("./citizens.module");
const auth_module_1 = require("./auth.module");
const webrtc_signaling_gateway_1 = require("./webrtc-signaling.gateway");
const pinecone_1 = require("./pinecone");
const legal_assistant_index_1 = require("./legal-assistant.index");
const bictorys_module_1 = require("./bictorys.module");
const paytech_module_1 = require("./paytech.module");
const payment_module_1 = require("./payment/payment.module");
const messages_module_1 = require("./messages.module");
const fine_tuning_service_1 = require("./fine-tuning.service");
const real_auth_controller_1 = require("./real-auth.controller");
const citizen_auth_controller_1 = require("./citizen-auth.controller");
const messages_controller_1 = require("./messages.controller");
const notification_service_1 = require("./notification.service");
const google_auth_service_1 = require("./google-auth.service");
const legal_documents_service_1 = require("./legal-documents.service");
const legal_documents_controller_1 = require("./legal-documents.controller");
const email_service_1 = require("./email.service");
const simplified_case_controller_1 = require("./simplified-case.controller");
const simplified_case_service_1 = require("./simplified-case.service");
const tracking_controller_1 = require("./tracking.controller");
const tracking_service_1 = require("./tracking.service");
const tracking_entity_1 = require("./tracking.entity");
const lawyer_entity_1 = require("./lawyer.entity");
const case_entity_1 = require("./case.entity");
const citizen_entity_1 = require("./citizen.entity");
const consultation_entity_1 = require("./consultation.entity");
const message_entity_1 = require("./message.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    type: 'mongodb',
                    url: configService.get('MONGODB_URI'),
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    entities: [lawyer_entity_1.Lawyer, case_entity_1.Case, citizen_entity_1.Citizen, consultation_entity_1.Consultation, message_entity_1.Message, tracking_entity_1.Tracking],
                    synchronize: true,
                    ssl: true,
                    tlsAllowInvalidCertificates: true,
                }),
                inject: [config_1.ConfigService],
            }),
            users_module_1.UsersModule,
            lawyers_module_1.LawyersModule,
            cases_module_1.CasesModule,
            consultations_module_1.ConsultationsModule,
            payments_module_1.PaymentsModule,
            notifications_module_1.NotificationsModule,
            citizens_module_1.CitizensModule,
            auth_module_1.AuthModule,
            pinecone_1.PineconeModule,
            legal_assistant_index_1.LegalAssistantModule,
            bictorys_module_1.BictorysModule,
            paytech_module_1.PayTechModule,
            payment_module_1.PaymentModule,
            messages_module_1.MessagesModule,
            typeorm_1.TypeOrmModule.forFeature([lawyer_entity_1.Lawyer, case_entity_1.Case, citizen_entity_1.Citizen, consultation_entity_1.Consultation, message_entity_1.Message, tracking_entity_1.Tracking]),
        ],
        controllers: [app_controller_1.AppController, real_auth_controller_1.RealAuthController, citizen_auth_controller_1.CitizenAuthController, messages_controller_1.MessagesController, legal_documents_controller_1.LegalDocumentsController, simplified_case_controller_1.SimplifiedCaseController, tracking_controller_1.TrackingController],
        providers: [
            google_auth_service_1.GoogleAuthService, notification_service_1.NotificationService, app_service_1.AppService, webrtc_signaling_gateway_1.WebRTCSignalingGateway, fine_tuning_service_1.FineTuningService, legal_documents_service_1.LegalDocumentsService, email_service_1.EmailService, simplified_case_service_1.SimplifiedCaseService, tracking_service_1.TrackingService
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
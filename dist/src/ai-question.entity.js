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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiQuestion = void 0;
const typeorm_1 = require("typeorm");
const citizen_entity_1 = require("./citizen.entity");
let AiQuestion = class AiQuestion {
    id;
    question;
    answer;
    citizenId;
    createdAt;
    citizen;
};
exports.AiQuestion = AiQuestion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], AiQuestion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], AiQuestion.prototype, "question", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], AiQuestion.prototype, "answer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AiQuestion.prototype, "citizenId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AiQuestion.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => citizen_entity_1.Citizen),
    (0, typeorm_1.JoinColumn)({ name: 'citizenId' }),
    __metadata("design:type", citizen_entity_1.Citizen)
], AiQuestion.prototype, "citizen", void 0);
exports.AiQuestion = AiQuestion = __decorate([
    (0, typeorm_1.Entity)()
], AiQuestion);
//# sourceMappingURL=ai-question.entity.js.map
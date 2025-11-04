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
exports.Case = void 0;
const typeorm_1 = require("typeorm");
const citizen_entity_1 = require("./citizen.entity");
const lawyer_entity_1 = require("./lawyer.entity");
let Case = class Case {
    _id;
    get id() {
        return this._id.toHexString();
    }
    title;
    description;
    status;
    citizenId;
    category;
    citizenName;
    citizenPhone;
    citizenEmail;
    lawyerId;
    urgency;
    estimatedTime;
    isPaid;
    paymentAmount;
    paymentId;
    aiResponse;
    clientQuestion;
    firstQuestion;
    firstResponse;
    secondQuestion;
    secondResponse;
    thirdQuestion;
    thirdResponse;
    trackingCode;
    trackingToken;
    lawyerName;
    acceptedAt;
    createdAt;
    citizen;
    lawyer;
};
exports.Case = Case;
__decorate([
    (0, typeorm_1.ObjectIdColumn)(),
    __metadata("design:type", typeorm_1.ObjectId)
], Case.prototype, "_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Case.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], Case.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'pending' }),
    __metadata("design:type", String)
], Case.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "citizenId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "citizenName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "citizenPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "citizenEmail", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "lawyerId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'normal' }),
    __metadata("design:type", String)
], Case.prototype, "urgency", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 30 }),
    __metadata("design:type", Number)
], Case.prototype, "estimatedTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Case.prototype, "isPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Case.prototype, "paymentAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "paymentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "aiResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "clientQuestion", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "firstQuestion", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "firstResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "secondQuestion", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "secondResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "thirdQuestion", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "thirdResponse", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "trackingCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "trackingToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Case.prototype, "lawyerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Case.prototype, "acceptedAt", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], Case.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => citizen_entity_1.Citizen, citizen => citizen.cases),
    (0, typeorm_1.JoinColumn)({ name: 'citizenId' }),
    __metadata("design:type", citizen_entity_1.Citizen)
], Case.prototype, "citizen", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lawyer_entity_1.Lawyer, lawyer => lawyer.cases),
    (0, typeorm_1.JoinColumn)({ name: 'lawyerId' }),
    __metadata("design:type", lawyer_entity_1.Lawyer)
], Case.prototype, "lawyer", void 0);
exports.Case = Case = __decorate([
    (0, typeorm_1.Entity)('case')
], Case);
//# sourceMappingURL=case.entity.js.map
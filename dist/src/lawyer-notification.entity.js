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
exports.LawyerNotification = void 0;
const typeorm_1 = require("typeorm");
const lawyer_entity_1 = require("./lawyer.entity");
const case_entity_1 = require("./case.entity");
let LawyerNotification = class LawyerNotification {
    _id;
    get id() {
        return this._id.toHexString();
    }
    lawyerId;
    caseId;
    type;
    isRead;
    isAccepted;
    createdAt;
    lawyer;
    case;
};
exports.LawyerNotification = LawyerNotification;
__decorate([
    (0, typeorm_1.ObjectIdColumn)(),
    __metadata("design:type", typeorm_1.ObjectId)
], LawyerNotification.prototype, "_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LawyerNotification.prototype, "lawyerId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], LawyerNotification.prototype, "caseId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'new_case' }),
    __metadata("design:type", String)
], LawyerNotification.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], LawyerNotification.prototype, "isRead", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], LawyerNotification.prototype, "isAccepted", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], LawyerNotification.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lawyer_entity_1.Lawyer),
    (0, typeorm_1.JoinColumn)({ name: 'lawyerId' }),
    __metadata("design:type", lawyer_entity_1.Lawyer)
], LawyerNotification.prototype, "lawyer", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => case_entity_1.Case),
    (0, typeorm_1.JoinColumn)({ name: 'caseId' }),
    __metadata("design:type", case_entity_1.Case)
], LawyerNotification.prototype, "case", void 0);
exports.LawyerNotification = LawyerNotification = __decorate([
    (0, typeorm_1.Entity)()
], LawyerNotification);
//# sourceMappingURL=lawyer-notification.entity.js.map
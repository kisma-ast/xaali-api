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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mongodb_1 = require("mongodb");
const lawyer_entity_1 = require("./lawyer.entity");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    lawyersRepository;
    jwtService;
    constructor(lawyersRepository, jwtService) {
        this.lawyersRepository = lawyersRepository;
        this.jwtService = jwtService;
    }
    async register(lawyerData) {
        const existingLawyer = await this.lawyersRepository.findOne({
            where: { email: lawyerData.email },
        });
        if (existingLawyer) {
            throw new common_1.UnauthorizedException('Un avocat avec cet email existe déjà');
        }
        const hashedPassword = await bcrypt.hash(lawyerData.password, 10);
        const lawyer = this.lawyersRepository.create({
            name: lawyerData.name,
            email: lawyerData.email,
            password: hashedPassword,
            specialty: lawyerData.specialty,
            phone: lawyerData.phone,
            experience: lawyerData.experience,
            lawFirm: lawyerData.lawFirm,
            barNumber: lawyerData.barNumber,
            description: lawyerData.description,
            mobileMoneyAccount: lawyerData.mobileMoneyAccount,
            pricing: lawyerData.pricing,
            paymentMethod: lawyerData.paymentMethod,
            paymentAmount: lawyerData.paymentAmount,
        });
        const savedLawyer = await this.lawyersRepository.save(lawyer);
        const payload = { sub: savedLawyer.id, email: savedLawyer.email };
        const token = this.jwtService.sign(payload);
        const { password, ...lawyerWithoutPassword } = savedLawyer;
        return {
            lawyer: lawyerWithoutPassword,
            token,
        };
    }
    async login(email, password) {
        const lawyer = await this.lawyersRepository.findOne({
            where: { email },
        });
        if (!lawyer) {
            throw new common_1.UnauthorizedException('Email ou mot de passe incorrect');
        }
        const isPasswordValid = await bcrypt.compare(password, lawyer.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Email ou mot de passe incorrect');
        }
        const payload = { sub: lawyer.id, email: lawyer.email };
        const token = this.jwtService.sign(payload);
        const { password: _, ...lawyerWithoutPassword } = lawyer;
        return {
            lawyer: lawyerWithoutPassword,
            token,
        };
    }
    async validateToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            const lawyer = await this.lawyersRepository.findOne({
                where: { _id: new mongodb_1.ObjectId(payload.sub) },
            });
            if (!lawyer) {
                throw new common_1.UnauthorizedException('Token invalide');
            }
            const { password, ...lawyerWithoutPassword } = lawyer;
            return lawyerWithoutPassword;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Token invalide');
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lawyer_entity_1.Lawyer)),
    __metadata("design:paramtypes", [typeorm_2.MongoRepository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
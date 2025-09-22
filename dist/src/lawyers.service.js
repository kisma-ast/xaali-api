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
var LawyersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LawyersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const lawyer_entity_1 = require("./lawyer.entity");
const mongodb_1 = require("mongodb");
let LawyersService = LawyersService_1 = class LawyersService {
    lawyersRepository;
    logger = new common_1.Logger(LawyersService_1.name);
    constructor(lawyersRepository) {
        this.lawyersRepository = lawyersRepository;
    }
    findAll() {
        return this.lawyersRepository.find();
    }
    findOne(id) {
        return this.lawyersRepository.findOneBy({ _id: new mongodb_1.ObjectId(id) });
    }
    async create(lawyer) {
        try {
            this.logger.log(`Création d'un avocat: ${lawyer.name}`);
            if (!lawyer.name || !lawyer.email) {
                throw new Error('Nom et email sont requis');
            }
            const existingLawyer = await this.lawyersRepository.findOne({ where: { email: lawyer.email } });
            if (existingLawyer) {
                this.logger.warn(`Email déjà utilisé: ${lawyer.email}`);
                throw new Error('Cet email est déjà utilisé');
            }
            const newLawyer = this.lawyersRepository.create(lawyer);
            const savedLawyer = await this.lawyersRepository.save(newLawyer);
            this.logger.log(`Avocat créé avec succès: ID ${savedLawyer.id}`);
            return savedLawyer;
        }
        catch (error) {
            this.logger.error(`Erreur lors de la création de l'avocat:`, error);
            if (error.code === 11000) {
                throw new Error('Cet email est déjà utilisé');
            }
            throw error;
        }
    }
    async findByEmail(email) {
        return this.lawyersRepository.findOne({ where: { email } });
    }
    async update(id, lawyer) {
        await this.lawyersRepository.update({ _id: new mongodb_1.ObjectId(id) }, lawyer);
        return this.findOne(id);
    }
    async remove(id) {
        await this.lawyersRepository.delete({ _id: new mongodb_1.ObjectId(id) });
    }
    async findLawyerCases(lawyerId) {
        return this.lawyersRepository.findOne({
            where: { _id: new mongodb_1.ObjectId(lawyerId) },
            relations: ['cases', 'cases.citizen'],
            select: {
                id: true,
                name: true,
                email: true,
                specialty: true,
                cases: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    isPaid: true,
                    paymentAmount: true,
                    createdAt: true,
                    citizen: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
    }
    async findLawyerWithDetails(lawyerId) {
        const lawyer = await this.lawyersRepository.findOne({
            where: { _id: new mongodb_1.ObjectId(lawyerId) },
            relations: ['cases', 'cases.citizen']
        });
        if (!lawyer)
            return null;
        const stats = {
            totalCases: lawyer.cases.length,
            pendingCases: lawyer.cases.filter(c => c.status === 'pending').length,
            completedCases: lawyer.cases.filter(c => c.status === 'completed').length,
            totalRevenue: lawyer.cases
                .filter(c => c.isPaid)
                .reduce((sum, c) => sum + (c.paymentAmount || 0), 0)
        };
        return {
            ...lawyer,
            stats
        };
    }
};
exports.LawyersService = LawyersService;
exports.LawyersService = LawyersService = LawyersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lawyer_entity_1.Lawyer)),
    __metadata("design:paramtypes", [typeorm_2.MongoRepository])
], LawyersService);
//# sourceMappingURL=lawyers.service.js.map
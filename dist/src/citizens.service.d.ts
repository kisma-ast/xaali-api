import { Repository } from 'typeorm';
import { Citizen } from './citizen.entity';
import { AiQuestion } from './ai-question.entity';
import { Case } from './case.entity';
export declare class CitizensService {
    private citizensRepository;
    private aiQuestionsRepository;
    private casesRepository;
    constructor(citizensRepository: Repository<Citizen>, aiQuestionsRepository: Repository<AiQuestion>, casesRepository: Repository<Case>);
    createCitizen(): Promise<Citizen>;
    getCitizen(id: string): Promise<Citizen | null>;
    canAskQuestion(citizenId: string): Promise<boolean>;
    askQuestion(citizenId: string, question: string): Promise<AiQuestion>;
    getQuestionsHistory(citizenId: string): Promise<AiQuestion[]>;
    createCase(citizenId: string, title: string, description: string): Promise<Case>;
    markAsPaid(citizenId: string, paymentId: string): Promise<void>;
    getCitizenCases(citizenId: string): Promise<Case[]>;
}

import { Repository } from 'typeorm';
import { Citizen } from './citizen.entity';
import { RAGOrchestratorService } from './rag-orchestrator.service';
import { AiQuestion } from './ai-question.entity';
import { Case } from './case.entity';
export declare class CitizensService {
    private citizensRepository;
    private aiQuestionsRepository;
    private casesRepository;
    private readonly ragService;
    private readonly logger;
    constructor(citizensRepository: Repository<Citizen>, aiQuestionsRepository: Repository<AiQuestion>, casesRepository: Repository<Case>, ragService: RAGOrchestratorService);
    createCitizen(): Promise<Citizen>;
    getCitizen(id: string): Promise<Citizen | null>;
    canAskQuestion(citizenId: string): Promise<boolean>;
    askQuestion(citizenId: string, question: string, category?: string): Promise<AiQuestion>;
    getQuestionsHistory(citizenId: string): Promise<AiQuestion[]>;
    createCase(citizenId: string, title: string, description: string): Promise<Case>;
    markAsPaid(citizenId: string, paymentId: string): Promise<void>;
    getCitizenCases(citizenId: string): Promise<Case[]>;
    getPersonalizedAdvice(citizenId: string, situation: string): Promise<any>;
    private formatResponseForCitizen;
}

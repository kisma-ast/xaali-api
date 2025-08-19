import { Citizen } from './citizen.entity';
export declare class AiQuestion {
    id: number;
    question: string;
    answer: string;
    citizenId: string;
    metadata?: any;
    createdAt: Date;
    citizen: Citizen;
}

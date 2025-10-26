import { ConsultationsService } from './consultations.service';
import { Consultation } from './consultation.entity';
export declare class ConsultationsController {
    private readonly consultationsService;
    constructor(consultationsService: ConsultationsService);
    findAll(): Promise<Consultation[]>;
    findOne(id: string): Promise<Consultation | null>;
    create(consultation: Partial<Consultation>): Promise<Consultation>;
    createVideoConsultation(consultation: Partial<Consultation>): Promise<Consultation>;
    startConsultation(id: string): Promise<Consultation | null>;
    endConsultation(id: string): Promise<Consultation | null>;
    findByMeetingId(meetingId: string): Promise<Consultation | null>;
    findByStatus(status: 'pending' | 'active' | 'completed' | 'cancelled'): Promise<Consultation[]>;
    findPending(): Promise<{
        success: boolean;
        consultations: Consultation[];
    }>;
    acceptConsultation(id: string, body: {
        lawyerId: string;
    }): Promise<{
        success: boolean;
        consultation: Consultation | null;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
        consultation?: undefined;
    }>;
    update(id: string, consultation: Partial<Consultation>): Promise<Consultation | null>;
    remove(id: string): Promise<void>;
}

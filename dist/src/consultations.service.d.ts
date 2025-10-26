import { Repository } from 'typeorm';
import { Consultation } from './consultation.entity';
export declare class ConsultationsService {
    private consultationsRepository;
    constructor(consultationsRepository: Repository<Consultation>);
    findAll(): Promise<Consultation[]>;
    findOne(id: string): Promise<Consultation | null>;
    create(consultation: Partial<Consultation>): Promise<Consultation>;
    update(id: string, consultation: Partial<Consultation>): Promise<Consultation | null>;
    remove(id: string): Promise<void>;
    createVideoConsultation(consultationData: Partial<Consultation>): Promise<Consultation>;
    startConsultation(id: string): Promise<Consultation | null>;
    endConsultation(id: string): Promise<Consultation | null>;
    findByMeetingId(meetingId: string): Promise<Consultation | null>;
    findByStatus(status: 'pending' | 'active' | 'completed' | 'cancelled'): Promise<Consultation[]>;
    private generateMeetingId;
    private generateMeetingPassword;
}

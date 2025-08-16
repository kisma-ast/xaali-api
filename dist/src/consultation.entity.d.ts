export declare class Consultation {
    id: number;
    date: Date;
    caseId: number;
    lawyerId: number;
    userId: number;
    notes: string;
    meetingId: string;
    meetingPassword: string;
    status: 'pending' | 'active' | 'completed' | 'cancelled';
    startTime: Date;
    endTime: Date;
    duration: number;
    meetingUrl: string;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
}

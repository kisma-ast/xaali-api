import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class WebRTCSignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private meetings;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinMeeting(client: Socket, payload: {
        meetingId: string;
        participantId: string;
        participantName: string;
        role: 'lawyer' | 'client';
    }): void;
    handleLeaveMeeting(client: Socket, payload: {
        meetingId: string;
        participantId: string;
    }): void;
    handleSignalingMessage(client: Socket, message: {
        type: 'offer' | 'answer' | 'ice-candidate';
        data: any;
        from: string;
        to: string;
        meetingId: string;
    }): void;
    private removeParticipantFromMeeting;
    private removeParticipantFromAllMeetings;
    private broadcastParticipantsUpdate;
}

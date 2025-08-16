import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface Participant {
  id: string;
  name: string;
  role: 'lawyer' | 'client';
  socketId: string;
  isOnline: boolean;
}

interface Meeting {
  id: string;
  participants: Map<string, Participant>;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true
  }
})
export class WebRTCSignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private meetings: Map<string, Meeting> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.removeParticipantFromAllMeetings(client.id);
  }

  @SubscribeMessage('join-meeting')
  handleJoinMeeting(client: Socket, payload: {
    meetingId: string;
    participantId: string;
    participantName: string;
    role: 'lawyer' | 'client';
  }) {
    const { meetingId, participantId, participantName, role } = payload;

    // Créer ou récupérer la réunion
    if (!this.meetings.has(meetingId)) {
      this.meetings.set(meetingId, {
        id: meetingId,
        participants: new Map()
      });
    }

    const meeting = this.meetings.get(meetingId)!;

    // Ajouter le participant
    const participant: Participant = {
      id: participantId,
      name: participantName,
      role,
      socketId: client.id,
      isOnline: true
    };

    meeting.participants.set(participantId, participant);

    // Rejoindre la room Socket.IO
    client.join(meetingId);

    // Notifier tous les participants de la réunion
    this.broadcastParticipantsUpdate(meetingId);

    console.log(`Participant ${participantName} joined meeting ${meetingId}`);
  }

  @SubscribeMessage('leave-meeting')
  handleLeaveMeeting(client: Socket, payload: {
    meetingId: string;
    participantId: string;
  }) {
    const { meetingId, participantId } = payload;
    this.removeParticipantFromMeeting(meetingId, participantId);
  }

  @SubscribeMessage('signaling-message')
  handleSignalingMessage(client: Socket, message: {
    type: 'offer' | 'answer' | 'ice-candidate';
    data: any;
    from: string;
    to: string;
    meetingId: string;
  }) {
    const { meetingId, to } = message;
    const meeting = this.meetings.get(meetingId);

    if (meeting) {
      const targetParticipant = meeting.participants.get(to);
      if (targetParticipant) {
        // Envoyer le message au participant cible
        this.server.to(targetParticipant.socketId).emit('signaling-message', message);
      }
    }
  }

  private removeParticipantFromMeeting(meetingId: string, participantId: string) {
    const meeting = this.meetings.get(meetingId);
    if (meeting) {
      meeting.participants.delete(participantId);
      
      // Si la réunion est vide, la supprimer
      if (meeting.participants.size === 0) {
        this.meetings.delete(meetingId);
      } else {
        // Notifier les autres participants
        this.broadcastParticipantsUpdate(meetingId);
      }
    }
  }

  private removeParticipantFromAllMeetings(socketId: string) {
    for (const [meetingId, meeting] of this.meetings.entries()) {
      for (const [participantId, participant] of meeting.participants.entries()) {
        if (participant.socketId === socketId) {
          this.removeParticipantFromMeeting(meetingId, participantId);
          break;
        }
      }
    }
  }

  private broadcastParticipantsUpdate(meetingId: string) {
    const meeting = this.meetings.get(meetingId);
    if (meeting) {
      const participants = Array.from(meeting.participants.values()).map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        isOnline: p.isOnline
      }));

      this.server.to(meetingId).emit('participants-updated', participants);
    }
  }
} 
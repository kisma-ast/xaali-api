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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebRTCSignalingGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let WebRTCSignalingGateway = class WebRTCSignalingGateway {
    server;
    meetings = new Map();
    handleConnection(client) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        this.removeParticipantFromAllMeetings(client.id);
    }
    handleJoinMeeting(client, payload) {
        const { meetingId, participantId, participantName, role } = payload;
        if (!this.meetings.has(meetingId)) {
            this.meetings.set(meetingId, {
                id: meetingId,
                participants: new Map()
            });
        }
        const meeting = this.meetings.get(meetingId);
        const participant = {
            id: participantId,
            name: participantName,
            role,
            socketId: client.id,
            isOnline: true
        };
        meeting.participants.set(participantId, participant);
        client.join(meetingId);
        this.broadcastParticipantsUpdate(meetingId);
        console.log(`Participant ${participantName} joined meeting ${meetingId}`);
    }
    handleLeaveMeeting(client, payload) {
        const { meetingId, participantId } = payload;
        this.removeParticipantFromMeeting(meetingId, participantId);
    }
    handleSignalingMessage(client, message) {
        const { meetingId, to } = message;
        const meeting = this.meetings.get(meetingId);
        if (meeting) {
            const targetParticipant = meeting.participants.get(to);
            if (targetParticipant) {
                this.server.to(targetParticipant.socketId).emit('signaling-message', message);
            }
        }
    }
    removeParticipantFromMeeting(meetingId, participantId) {
        const meeting = this.meetings.get(meetingId);
        if (meeting) {
            meeting.participants.delete(participantId);
            if (meeting.participants.size === 0) {
                this.meetings.delete(meetingId);
            }
            else {
                this.broadcastParticipantsUpdate(meetingId);
            }
        }
    }
    removeParticipantFromAllMeetings(socketId) {
        for (const [meetingId, meeting] of this.meetings.entries()) {
            for (const [participantId, participant] of meeting.participants.entries()) {
                if (participant.socketId === socketId) {
                    this.removeParticipantFromMeeting(meetingId, participantId);
                    break;
                }
            }
        }
    }
    broadcastParticipantsUpdate(meetingId) {
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
};
exports.WebRTCSignalingGateway = WebRTCSignalingGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], WebRTCSignalingGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-meeting'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebRTCSignalingGateway.prototype, "handleJoinMeeting", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave-meeting'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebRTCSignalingGateway.prototype, "handleLeaveMeeting", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('signaling-message'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], WebRTCSignalingGateway.prototype, "handleSignalingMessage", null);
exports.WebRTCSignalingGateway = WebRTCSignalingGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            credentials: true
        }
    })
], WebRTCSignalingGateway);
//# sourceMappingURL=webrtc-signaling.gateway.js.map
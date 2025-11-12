import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './message.entity';
import { Case } from './case.entity';
import { Lawyer } from './lawyer.entity';
import { Citizen } from './citizen.entity';
import { EmailService } from './email.service';
import { NotificationService } from './notification.service';

@Controller('messages')
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Case)
    private caseRepository: Repository<Case>,
    @InjectRepository(Lawyer)
    private lawyerRepository: Repository<Lawyer>,
    @InjectRepository(Citizen)
    private citizenRepository: Repository<Citizen>,
    private emailService: EmailService,
    private notificationService: NotificationService,
  ) {}

  @Get(':caseId')
  async getMessages(@Param('caseId') caseId: string) {
    try {
      console.log('📨 Récupération messages pour cas:', caseId);
      
      // Essayer d'abord avec la requête normale
      let messages = await this.messageRepository.find({
        where: { caseId },
        order: { createdAt: 'ASC' }
      });

      console.log('🔍 Messages avec caseId exact:', messages.length);
      
      // Si aucun message trouvé, essayer une recherche plus large
      if (messages.length === 0) {
        console.log('🔍 Recherche alternative...');
        const allMessages = await this.messageRepository.find();
        console.log('📊 Total messages en base:', allMessages.length);
        
        // Filtrer manuellement
        messages = allMessages.filter(msg => msg.caseId === caseId);
        console.log('🎯 Messages filtrés manuellement:', messages.length);
        
        // Afficher quelques exemples pour debug
        if (allMessages.length > 0) {
          console.log('📋 Exemple de caseId en base:', allMessages[0].caseId);
          console.log('📋 CaseId recherché:', caseId);
        }
      }

      console.log('✅ Messages trouvés:', messages.length);

      return {
        success: true,
        messages: messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          senderName: msg.senderName,
          timestamp: msg.createdAt || msg.timestamp
        }))
      };
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      return { success: false, messages: [] };
    }
  }

  @Post()
  async sendMessage(@Body() messageData: {
    caseId: string;
    content: string;
    sender: 'citizen' | 'lawyer';
    senderName: string;
    senderId?: string;
  }) {
    try {
      console.log('📤 Envoi nouveau message:', messageData);

      const message = this.messageRepository.create({
        caseId: messageData.caseId,
        content: messageData.content,
        sender: messageData.sender,
        senderName: messageData.senderName,
        senderId: messageData.senderId,
        timestamp: new Date(),
        createdAt: new Date()
      });

      const savedMessage = await this.messageRepository.save(message);
      
      console.log('✅ Message sauvegardé:', savedMessage.id);

      // Récupérer le cas pour les notifications
      const case_ = await this.caseRepository.findOne({
        where: { _id: messageData.caseId as any }
      });

      if (case_) {
        // Notifier le destinataire selon le type d'expéditeur
        if (messageData.sender === 'lawyer') {
          // Message d'avocat → notifier le citoyen
          await this.notificationService.notifyCitizenNewMessage(
            case_,
            messageData.senderName,
            messageData.content
          );
        } else {
          // Message de citoyen → notifier l'avocat
          await this.notificationService.notifyLawyerNewMessage(
            case_,
            messageData.senderName,
            messageData.content
          );
        }
      }

      // Envoyer notification email au destinataire (méthode existante)
      await this.sendEmailNotification(messageData);

      return {
        success: true,
        message: {
          id: savedMessage.id,
          content: savedMessage.content,
          sender: savedMessage.sender,
          senderName: savedMessage.senderName,
          timestamp: savedMessage.timestamp
        }
      };
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      return { success: false, message: 'Erreur lors de l\'envoi du message' };
    }
  }

  @Get(':caseId/unread/:userType')
  async getUnreadCount(@Param('caseId') caseId: string, @Param('userType') userType: 'citizen' | 'lawyer') {
    try {
      const otherUserType = userType === 'citizen' ? 'lawyer' : 'citizen';
      
      const unreadCount = await this.messageRepository.count({
        where: {
          caseId,
          sender: otherUserType,
          isRead: false
        }
      });

      return {
        success: true,
        unreadCount
      };
    } catch (error) {
      console.error('❌ Erreur comptage messages non lus:', error);
      return { success: false, unreadCount: 0 };
    }
  }

  @Post(':caseId/mark-read/:userType')
  async markMessagesAsRead(@Param('caseId') caseId: string, @Param('userType') userType: 'citizen' | 'lawyer') {
    try {
      const otherUserType = userType === 'citizen' ? 'lawyer' : 'citizen';
      
      await this.messageRepository.update(
        {
          caseId,
          sender: otherUserType,
          isRead: false
        },
        {
          isRead: true,
          readAt: new Date()
        }
      );

      return { success: true };
    } catch (error) {
      console.error('❌ Erreur marquage messages lus:', error);
      return { success: false };
    }
  }

  private async sendEmailNotification(messageData: {
    caseId: string;
    content: string;
    sender: 'citizen' | 'lawyer';
    senderName: string;
  }) {
    try {
      // Récupérer les informations du cas
      const case_ = await this.caseRepository.findOne({
        where: { _id: messageData.caseId as any }
      });

      if (!case_) return;

      if (messageData.sender === 'lawyer') {
        // Message d'avocat vers citoyen - notifier le citoyen
        if (case_.citizenId) {
          const citizen = await this.citizenRepository.findOne({
            where: { _id: case_.citizenId as any }
          });
          
          if (citizen?.email) {
            await this.emailService.sendNewMessageNotification(
              citizen.email,
              citizen.name,
              messageData.senderName,
              messageData.content,
              messageData.caseId
            );
          }
        }
      } else {
        // Message de citoyen vers avocat - notifier l'avocat
        if (case_.lawyerId) {
          const lawyer = await this.lawyerRepository.findOne({
            where: { _id: case_.lawyerId as any }
          });
          
          if (lawyer?.email) {
            await this.emailService.sendNewMessageNotification(
              lawyer.email,
              lawyer.name,
              messageData.senderName,
              messageData.content,
              messageData.caseId
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur envoi notification email:', error);
    }
  }
}
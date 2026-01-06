import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { FeedbackService } from './feedback.service';

@Controller('feedback')
export class FeedbackController {
    private readonly logger = new Logger(FeedbackController.name);

    constructor(private readonly feedbackService: FeedbackService) { }

    @Post()
    async createFeedback(@Body() feedbackData: {
        caseId: string;
        userId: string;
        userType: 'lawyer' | 'citizen';
        rating: number;
        comment?: string;
        closureType: 'manual' | 'automatic';
    }) {
        try {
            this.logger.log(`📝 Création feedback: ${feedbackData.rating} étoiles pour cas ${feedbackData.caseId}`);

            const result = await this.feedbackService.createFeedback(feedbackData);

            return result;
        } catch (error) {
            this.logger.error(`❌ Erreur création feedback: ${error.message}`);
            return {
                success: false,
                message: error.message || 'Erreur lors de la création du feedback',
            };
        }
    }

    @Get('pending/:userId/:userType')
    async getPendingFeedback(
        @Param('userId') userId: string,
        @Param('userType') userType: 'lawyer' | 'citizen'
    ) {
        try {
            this.logger.log(`🔍 Recherche feedback en attente pour ${userType} ${userId}`);

            const pendingCases = await this.feedbackService.getPendingFeedbackForUser(userId, userType);

            return {
                success: true,
                pendingFeedback: pendingCases,
            };
        } catch (error) {
            this.logger.error(`❌ Erreur récupération feedback en attente: ${error.message}`);
            return {
                success: false,
                pendingFeedback: [],
            };
        }
    }

    @Get('check/:caseId/:userId/:userType')
    async checkFeedbackExists(
        @Param('caseId') caseId: string,
        @Param('userId') userId: string,
        @Param('userType') userType: 'lawyer' | 'citizen'
    ) {
        try {
            const exists = await this.feedbackService.hasFeedbackForCase(caseId, userId, userType);

            return {
                success: true,
                hasFeedback: exists,
            };
        } catch (error) {
            this.logger.error(`❌ Erreur vérification feedback: ${error.message}`);
            return {
                success: false,
                hasFeedback: false,
            };
        }
    }

    @Get('stats')
    @Get('stats/:caseId')
    async getFeedbackStats(@Param('caseId') caseId?: string) {
        try {
            this.logger.log(`📊 Récupération statistiques feedback${caseId ? ` pour cas ${caseId}` : ''}`);

            const stats = await this.feedbackService.getFeedbackStats(caseId);

            return {
                success: true,
                stats,
            };
        } catch (error) {
            this.logger.error(`❌ Erreur récupération statistiques: ${error.message}`);
            return {
                success: false,
                message: error.message,
            };
        }
    }
}

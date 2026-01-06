import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './feedback.entity';
import { Case } from './case.entity';
import { ObjectId } from 'mongodb';

@Injectable()
export class FeedbackService {
    private readonly logger = new Logger(FeedbackService.name);

    constructor(
        @InjectRepository(Feedback)
        private feedbackRepository: Repository<Feedback>,
        @InjectRepository(Case)
        private caseRepository: Repository<Case>,
    ) { }

    async createFeedback(data: {
        caseId: string;
        userId: string;
        userType: 'lawyer' | 'citizen';
        rating: number;
        comment?: string;
        closureType: 'manual' | 'automatic';
    }) {
        try {
            // Validate rating
            if (data.rating < 1 || data.rating > 5) {
                throw new Error('La note doit être entre 1 et 5 étoiles');
            }

            // Check if feedback already exists
            const existingFeedback = await this.feedbackRepository.findOne({
                where: {
                    caseId: data.caseId,
                    userId: data.userId,
                    userType: data.userType,
                } as any,
            });

            if (existingFeedback) {
                this.logger.warn(`Feedback already exists for case ${data.caseId} by ${data.userType} ${data.userId}`);
                return { success: false, message: 'Vous avez déjà soumis un feedback pour ce dossier' };
            }

            // Get case for tracking code
            const caseData = await this.caseRepository.findOne({
                where: { _id: new ObjectId(data.caseId) } as any,
            });

            // Create feedback
            const feedback = this.feedbackRepository.create({
                caseId: data.caseId,
                userId: data.userId,
                userType: data.userType,
                rating: data.rating,
                comment: data.comment || '',
                closureType: data.closureType,
                caseTrackingCode: caseData?.trackingCode || '',
                createdAt: new Date(),
            });

            const savedFeedback = await this.feedbackRepository.save(feedback);

            // Update case feedback completion flags
            if (caseData) {
                if (data.userType === 'lawyer') {
                    caseData.lawyerFeedbackCompleted = true;
                } else {
                    caseData.clientFeedbackCompleted = true;
                }
                await this.caseRepository.save(caseData);
            }

            this.logger.log(`✅ Feedback créé: ${data.rating} étoiles par ${data.userType} pour cas ${data.caseId}`);

            return {
                success: true,
                feedback: {
                    id: savedFeedback.id,
                    rating: savedFeedback.rating,
                    comment: savedFeedback.comment,
                },
            };
        } catch (error) {
            this.logger.error(`❌ Erreur création feedback: ${error.message}`);
            throw error;
        }
    }

    async getPendingFeedbackForUser(userId: string, userType: 'lawyer' | 'citizen') {
        try {
            // Find all closed cases where this user is involved
            const query: any = {
                exchangeStatus: 'closed',
            };

            if (userType === 'lawyer') {
                query.lawyerId = userId;
                query.lawyerFeedbackCompleted = { $ne: true };
            } else {
                query.citizenPhone = userId; // Using phone as citizen ID for now
                query.clientFeedbackCompleted = { $ne: true };
            }

            const closedCases = await this.caseRepository.find({
                where: query as any,
            });

            this.logger.log(`🔍 Found ${closedCases.length} cases pending feedback for ${userType} ${userId}`);

            return closedCases.map(caseData => ({
                caseId: caseData.id,
                trackingCode: caseData.trackingCode,
                closedAt: caseData.exchangeClosedAt,
                description: caseData.description,
                closureType: caseData.closureType || 'manual',
            }));
        } catch (error) {
            this.logger.error(`❌ Erreur récupération feedback en attente: ${error.message}`);
            return [];
        }
    }

    async hasFeedbackForCase(caseId: string, userId: string, userType: 'lawyer' | 'citizen') {
        try {
            const feedback = await this.feedbackRepository.findOne({
                where: {
                    caseId,
                    userId,
                    userType,
                } as any,
            });

            return !!feedback;
        } catch (error) {
            this.logger.error(`❌ Erreur vérification feedback: ${error.message}`);
            return false;
        }
    }

    async getFeedbackStats(caseId?: string) {
        try {
            const query: any = {};
            if (caseId) {
                query.caseId = caseId;
            }

            const feedbacks = await this.feedbackRepository.find({
                where: query,
            });

            const stats = {
                total: feedbacks.length,
                averageRating: feedbacks.length > 0
                    ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
                    : 0,
                byRating: {
                    5: feedbacks.filter(f => f.rating === 5).length,
                    4: feedbacks.filter(f => f.rating === 4).length,
                    3: feedbacks.filter(f => f.rating === 3).length,
                    2: feedbacks.filter(f => f.rating === 2).length,
                    1: feedbacks.filter(f => f.rating === 1).length,
                },
                byUserType: {
                    lawyer: feedbacks.filter(f => f.userType === 'lawyer').length,
                    citizen: feedbacks.filter(f => f.userType === 'citizen').length,
                },
                byClosureType: {
                    manual: feedbacks.filter(f => f.closureType === 'manual').length,
                    automatic: feedbacks.filter(f => f.closureType === 'automatic').length,
                },
            };

            return stats;
        } catch (error) {
            this.logger.error(`❌ Erreur récupération statistiques: ${error.message}`);
            throw error;
        }
    }
}

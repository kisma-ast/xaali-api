import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CasesService } from '../src/cases.service';
import { EmailService } from '../src/email.service';

async function bootstrap() {
    console.log('🏁 Starting Email Notification Test...');
    const app = await NestFactory.createApplicationContext(AppModule);
    const casesService = app.get(CasesService);
    const emailService = app.get(EmailService);

    console.log('1. 🔍 Finding any case...');
    const cases = await casesService.findAll();

    if (cases.length === 0) {
        console.error('❌ No cases found in database.');
        await app.close();
        return;
    }

    const testCase = cases[0];
    console.log(`✅ Found case: ${testCase.trackingCode} (ID: ${testCase.id})`);

    const testEmail = 'kismatandia0@gmail.com';
    const trackingLink = `https://xaali.net/suivi/${testCase.trackingToken || 'test-token'}`;

    console.log(`2. 📧 Sending notification to ${testEmail}...`);
    console.log(`🔗 Link: ${trackingLink}`);

    try {
        const result = await emailService.sendNewCaseNotificationToLawyers(
            testEmail,
            'Kissima',
            {
                title: testCase.caseTitle || 'Dossier de test',
                description: 'Ceci est une description de test pour vérifier le contenu de l\'email.',
                category: 'Test',
                paymentAmount: 10000
            }
        );
        console.log('✅ Lawyer notification sent successfully');
        console.log('📝 Result:', result);
    } catch (e) {
        console.error('❌ Notification failed:', e.message);
    }

    await app.close();
    console.log('🏁 Script finished.');
}

bootstrap();

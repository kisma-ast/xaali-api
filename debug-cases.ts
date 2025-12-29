
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Case } from './src/case.entity';
import { Lawyer } from './src/lawyer.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';

function log(message: string) {
    console.log(message);
    fs.appendFileSync('debug-results.log', message + '\n');
}

async function debugCases() {
    try {
        fs.writeFileSync('debug-results.log', '');

        const app = await NestFactory.createApplicationContext(AppModule, { logger: false });

        const caseRepo = app.get<Repository<Case>>(getRepositoryToken(Case));
        const lawyerRepo = app.get<Repository<Lawyer>>(getRepositoryToken(Lawyer));

        log('--- DEBUG START ---');

        console.log('Fetching accepted cases...');
        const acceptedCases = await caseRepo.find({ where: { status: 'accepted' } });
        log(`Total Accepted Cases: ${acceptedCases.length}`);
        acceptedCases.forEach(c => {
            log(`Case ID: ${c._id}, LawyerID: ${c.lawyerId} (Type: ${typeof c.lawyerId}), Title: ${c.title}, AcceptedAt: ${c.acceptedAt}`);
        });

        console.log('Fetching lawyers...');
        const lawyers = await lawyerRepo.find();
        log(`Total Lawyers: ${lawyers.length}`);
        lawyers.forEach(l => {
            log(`Lawyer ID: ${l._id} (String: ${l._id.toString()}), Email: ${l.email}, Name: ${l.name}`);
        });

        log('--- DEBUG END ---');
        await app.close();
    } catch (error) {
        log('ERROR: ' + error.message);
    }
}

debugCases();

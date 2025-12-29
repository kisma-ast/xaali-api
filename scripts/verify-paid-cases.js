const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI is missing');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();

        const casesCollection = db.collection('case');

        console.log('\n📊 Analyse des dossiers payés :');

        const totalCases = await casesCollection.countDocuments();

        const paidCases = await casesCollection.find({ isPaid: true }).toArray();

        const pendingPaid = paidCases.filter(c => c.status === 'pending');

        const acceptedPaid = paidCases.filter(c => c.status === 'accepted');

        const unpaidStatusPaid = paidCases.filter(c => c.status === 'unpaid');

        const noPaymentId = paidCases.filter(c => !c.paymentId);

        const noPaidAt = paidCases.filter(c => !c.paidAt);

        // Simulation de la logique actuelle du controller
        const visibleInDashboard = paidCases.filter(c =>
            c.status === 'pending' &&
            c.paymentId != null &&
            c.isPaid !== false
        );

        const missingFromDashboard = pendingPaid.filter(c => !c.paymentId);

        const report = {
            totalCases,
            paidCases: paidCases.length,
            pendingPaid: pendingPaid.length,
            acceptedPaid: acceptedPaid.length,
            unpaidStatusPaid: unpaidStatusPaid.length,
            noPaymentId: noPaymentId.length,
            noPaidAt: noPaidAt.length,
            visibleInDashboard: visibleInDashboard.length,
            missingFromDashboardCount: missingFromDashboard.length,
            missingCases: missingFromDashboard.map(c => ({ id: c._id, email: c.citizenEmail }))
        };

        const fs = require('fs');
        fs.writeFileSync('verification_results.json', JSON.stringify(report, null, 2));
        console.log('Results written to verification_results.json');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.close();
    }
}

run();

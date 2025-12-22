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
        const db = client.db(); // Use default db from URI

        const docsCount = await db.collection('legal_documents').countDocuments();
        const chunksCount = await db.collection('legal_doc_chunks').countDocuments();

        // Get list of documents
        const docs = await db.collection('legal_documents').find({}, { projection: { title: 1, chunkCount: 1 } }).toArray();

        console.log('\n📊 Bilan actuel de la base de données :');
        console.log(`- ${docsCount} Documents juridiques enregistrés.`);
        console.log(`- ${chunksCount} Segments de texte (chunks) indexés.`);
        console.log('\nListe des fichiers :');
        docs.forEach(d => console.log(`  📄 ${d.title} (${d.chunkCount || '?'} segments)`));

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.close();
    }
}

run();

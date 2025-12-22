const { MongoClient } = require('mongodb');
require('dotenv').config();

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI is missing in .env');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB');

        // Use the default database from the connection string, or fallback to 'xaali-db' if undefined
        const db = client.db();
        console.log('✅ Using database:', db.databaseName);
        const collection = db.collection('legal_doc_chunks');

        // Insert a dummy document to force collection creation
        const result = await collection.insertOne({
            text: 'INITIALIZATION_CHUNK',
            embedding: Array(1536).fill(0), // Dummy embedding
            metadata: { source: 'init_script' },
            createdAt: new Date()
        });

        console.log('✅ Collection "legal_doc_chunks" created!');
        console.log('✅ Inserted document ID:', result.insertedId);

        // Optional: Create the other collection too
        await db.collection('legal_documents').insertOne({
            title: 'INIT_DOC',
            uploadedBy: 'system',
            createdAt: new Date()
        });
        console.log('✅ Collection "legal_documents" created!');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.close();
    }
}

run();

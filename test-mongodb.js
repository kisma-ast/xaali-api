const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://kismart07_db_user:6pDhQrrBz0kx75hz@xaali-db.gca64sm.mongodb.net/xaali-db?retryWrites=true&w=majority&ssl=true&tlsAllowInvalidCertificates=true";

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔄 Tentative de connexion à MongoDB Atlas...');
    
    await client.connect();
    console.log('✅ Connexion MongoDB réussie !');
    
    const db = client.db('xaali-db');
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections disponibles:', collections.map(c => c.name));
    
    const stats = await db.stats();
    console.log('📊 Statistiques de la base:', {
      collections: stats.collections,
      dataSize: stats.dataSize,
      indexSize: stats.indexSize
    });
    
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
  } finally {
    await client.close();
    console.log('🔒 Connexion fermée');
  }
}

testConnection();
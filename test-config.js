const { AI_CONFIG, PINECONE_CONFIG } = require('./src/config');

console.log('=== TEST DE CONFIGURATION ===');
console.log('');

console.log('AI_CONFIG:');
console.log('  - OPENAI_API_KEY:', AI_CONFIG.OPENAI_API_KEY ? '✅ Configurée' : '❌ Manquante');
console.log('  - MODELS.OPENAI:', AI_CONFIG.MODELS.OPENAI);
console.log('  - MODELS.EMBEDDING:', AI_CONFIG.MODELS.EMBEDDING);
console.log('');

console.log('PINECONE_CONFIG:');
console.log('  - API_KEY:', PINECONE_CONFIG.API_KEY ? '✅ Configurée' : '❌ Manquante');
console.log('  - ENVIRONMENT:', PINECONE_CONFIG.ENVIRONMENT);
console.log('  - INDEX_NAME:', PINECONE_CONFIG.INDEX_NAME);
console.log('  - DIMENSIONS:', PINECONE_CONFIG.DIMENSIONS);
console.log('');

// Vérifier la cohérence
const embeddingModel = AI_CONFIG.MODELS.EMBEDDING;
const configuredDimensions = PINECONE_CONFIG.DIMENSIONS;

console.log('=== VÉRIFICATION DE COHÉRENCE ===');

if (embeddingModel === 'text-embedding-ada-002' && configuredDimensions === 1024) {
  console.log('✅ Configuration cohérente: text-embedding-ada-002 (1024 dimensions)');
} else if (embeddingModel === 'text-embedding-3-small' && configuredDimensions === 1536) {
  console.log('✅ Configuration cohérente: text-embedding-3-small (1536 dimensions)');
} else {
  console.log('❌ INCOHÉRENCE DÉTECTÉE:');
  console.log(`   - Modèle d'embedding: ${embeddingModel}`);
  console.log(`   - Dimensions configurées: ${configuredDimensions}`);
  
  if (embeddingModel === 'text-embedding-ada-002') {
    console.log('   → Ce modèle génère 1024 dimensions');
  } else if (embeddingModel === 'text-embedding-3-small') {
    console.log('   → Ce modèle génère 1536 dimensions');
  }
}

console.log('');
console.log('=== RECOMMANDATIONS ===');
if (embeddingModel === 'text-embedding-3-small' && configuredDimensions === 1024) {
  console.log('🔧 Pour corriger: Changer DIMENSIONS à 1536 dans config.ts');
} else if (embeddingModel === 'text-embedding-ada-002' && configuredDimensions === 1536) {
  console.log('🔧 Pour corriger: Changer DIMENSIONS à 1024 dans config.ts');
} else {
  console.log('✅ Configuration semble correcte');
}

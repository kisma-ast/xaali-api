// Configuration des tokens d'IA et services
// Remplacez ces valeurs par vos vrais tokens

export const AI_CONFIG = {
  // Token OpenAI - Clé API directe
  OPENAI_API_KEY: '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',
  
  // Configuration des modèles
  MODELS: {
    OPENAI: 'gpt-4o-mini', // Modèle le plus récent et performant
    EMBEDDING: 'text-embedding-ada-002' // Modèle compatible avec 1024 dimensions
  }
};

// Configuration Pinecone
export const PINECONE_CONFIG = {
  // Clé API Pinecone configurée
  API_KEY: process.env.PINECONE_API_KEY || 'pcsk_6nJG4B_ULWywbvyUGWAjGP3YNGVTeXDenrDSX9EsmPiRm9usaaiAgPs9q4jK9uH2b44C9B',
  ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || 'us-east-1',
  INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'xaali-agent',
  DIMENSIONS: 1024 // text-embedding-ada-002 génère des vecteurs de 1024 dimensions
};

// Configuration de l'application (pour compatibilité avec le frontend)
export const config = {
  // API Configuration
  apiUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  
  // WebRTC Configuration
  webrtc: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  },
  
  // Application Configuration
  app: {
    name: 'Xaali',
    version: '1.0.0',
    supportEmail: 'support@xaali.sn'
  },
  
  // OpenAI Configuration
  openai: {
    apiKey: AI_CONFIG.OPENAI_API_KEY,
    model: 'gpt-4o-mini', // Modèle le plus récent et performant
    maxTokens: 1000,
    temperature: 0.3
  },

  // Pinecone Configuration
  pinecone: {
    apiKey: PINECONE_CONFIG.API_KEY,
    environment: PINECONE_CONFIG.ENVIRONMENT,
    indexName: PINECONE_CONFIG.INDEX_NAME,
    dimensions: PINECONE_CONFIG.DIMENSIONS
  }
};

// Fonction pour vérifier si les tokens sont configurés
export const checkAIConfig = () => {
  const hasOpenAI = !!AI_CONFIG.OPENAI_API_KEY;
  const hasPinecone = !!PINECONE_CONFIG.API_KEY && PINECONE_CONFIG.API_KEY !== 'your_pinecone_api_key_here';
  
  console.log('🔧 Configuration IA Xaali (Backend):', {
    OpenAI: hasOpenAI ? '✅ Configuré' : '❌ Non configuré',
    Pinecone: hasPinecone ? '✅ Configuré' : '❌ Non configuré',
    'Mode': process.env.NODE_ENV === 'development' ? '✅ Développement' : '✅ Production'
  });
  
  if (hasOpenAI) {
    console.log('🚀 OpenAI API prête à être utilisée');
  } else {
    console.log('❌ Clé API OpenAI manquante');
  }

  if (hasPinecone) {
    console.log('🌲 Pinecone prêt à être utilisé');
  } else {
    console.log('❌ Clé API Pinecone manquante - Créez un fichier .env avec PINECONE_API_KEY');
  }
  
  return { hasOpenAI, hasPinecone };
};

// Fonction pour obtenir la configuration complète
export const getConfig = () => {
  return {
    ...config,
    ai: AI_CONFIG,
    pinecone: PINECONE_CONFIG
  };
};

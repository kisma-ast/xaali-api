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

// Configuration Bictorys Mobile Money
export const BICTORYS_CONFIG = {
  // Mode sandbox pour les tests
  SANDBOX: {
    API_URL: 'https://sandbox.bictorys.com/api/v1',
    MERCHANT_ID: process.env.BICTORYS_MERCHANT_ID || 'your_merchant_id_here',
    API_KEY: process.env.BICTORYS_API_KEY || 'your_api_key_here',
    SECRET_KEY: process.env.BICTORYS_SECRET_KEY || 'your_secret_key_here'
  },
  // Mode production
  PRODUCTION: {
    API_URL: 'https://api.bictorys.com/api/v1',
    MERCHANT_ID: process.env.BICTORYS_PROD_MERCHANT_ID,
    API_KEY: process.env.BICTORYS_PROD_API_KEY,
    SECRET_KEY: process.env.BICTORYS_PROD_SECRET_KEY
  },
  // Configuration des opérateurs mobile money supportés
  MOBILE_MONEY_PROVIDERS: {
    ORANGE_MONEY: 'orange_money',
    MTN_MOBILE_MONEY: 'mtn_mobile_money',
    MOOV_MONEY: 'moov_money',
    WAVE: 'wave',
    FREE_MONEY: 'free_money'
  }
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
  },

  // Bictorys Configuration
  bictorys: {
    isProduction: process.env.NODE_ENV === 'production',
    config: process.env.NODE_ENV === 'production' ? BICTORYS_CONFIG.PRODUCTION : BICTORYS_CONFIG.SANDBOX,
    providers: BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS
  }
};

// Fonction pour vérifier si les tokens sont configurés
export const checkAIConfig = () => {
  const hasOpenAI = !!AI_CONFIG.OPENAI_API_KEY;
  const hasPinecone = !!PINECONE_CONFIG.API_KEY && PINECONE_CONFIG.API_KEY !== 'your_pinecone_api_key_here';
  const hasBictorys = !!BICTORYS_CONFIG.SANDBOX.MERCHANT_ID && BICTORYS_CONFIG.SANDBOX.MERCHANT_ID !== 'your_merchant_id_here';
  
  console.log('🔧 Configuration IA Xaali (Backend):', {
    OpenAI: hasOpenAI ? '✅ Configuré' : '❌ Non configuré',
    Pinecone: hasPinecone ? '✅ Configuré' : '❌ Non configuré',
    Bictorys: hasBictorys ? '✅ Configuré' : '❌ Non configuré',
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

  if (hasBictorys) {
    console.log('💰 Bictorys Mobile Money prêt à être utilisé');
  } else {
    console.log('❌ Configuration Bictorys manquante - Configurez BICTORYS_MERCHANT_ID, BICTORYS_API_KEY, BICTORYS_SECRET_KEY');
  }
  
  return { hasOpenAI, hasPinecone, hasBictorys };
};

// Fonction pour obtenir la configuration complète
export const getConfig = () => {
  return {
    ...config,
    ai: AI_CONFIG,
    pinecone: PINECONE_CONFIG,
    bictorys: BICTORYS_CONFIG
  };
};

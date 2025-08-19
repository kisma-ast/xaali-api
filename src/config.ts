// Configuration des tokens d'IA et services
// Remplacez ces valeurs par vos vrais tokens

export const AI_CONFIG = {
  // Token OpenAI - Utiliser les variables d'environnement
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'your_openai_api_key_here',
  
  // Configuration des modèles
  MODELS: {
    OPENAI: 'gpt-4o-mini', // Modèle le plus récent et performant
    EMBEDDING: 'text-embedding-ada-002' // Modèle compatible avec 1024 dimensions
  }
};

// Configuration Pinecone
export const PINECONE_CONFIG = {
  // Clé API Pinecone - Utiliser les variables d'environnement
  API_KEY: process.env.PINECONE_API_KEY || 'your_pinecone_api_key_here',
  ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || 'us-east-1',
  INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'xaali-agent',
  DIMENSIONS: 1024 // text-embedding-ada-002 génère des vecteurs de 1024 dimensions
};

// Configuration Bictorys Mobile Money
export const BICTORYS_CONFIG = {
  // Mode sandbox pour les tests
  SANDBOX: {
    API_URL: 'https://sandbox.bictorys.com/api/v1',
    MERCHANT_ID: process.env.BICTORYS_MERCHANT_ID || 'test_merchant_id',
    API_KEY: process.env.BICTORYS_API_KEY || 'your_bictorys_api_key_here',
    SECRET_KEY: process.env.BICTORYS_SECRET_KEY || 'your_bictorys_secret_key_here'
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
  
  // OpenAI Configuration - Optimisé pour la rapidité
  openai: {
    apiKey: AI_CONFIG.OPENAI_API_KEY,
    model: 'gpt-4o-mini', // Modèle le plus rapide
    maxTokens: 500, // Réduit pour plus de rapidité
    temperature: 0.1, // Plus déterministe et rapide
    stream: true, // Activer le streaming
    timeout: 10000 // Timeout de 10 secondes
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

// Fonction pour tester la clé API OpenAI
export const testOpenAIKey = async () => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Clé API OpenAI valide');
      return true;
    } else {
      console.log('❌ Clé API OpenAI invalide');
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur lors du test de la clé API OpenAI:', error);
    return false;
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
    // Tester la clé API
    testOpenAIKey();
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

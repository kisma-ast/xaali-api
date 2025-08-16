"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.checkAIConfig = exports.config = exports.PINECONE_CONFIG = exports.AI_CONFIG = void 0;
exports.AI_CONFIG = {
    OPENAI_API_KEY: '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',
    MODELS: {
        OPENAI: 'gpt-4o-mini',
        EMBEDDING: 'text-embedding-ada-002'
    }
};
exports.PINECONE_CONFIG = {
    API_KEY: process.env.PINECONE_API_KEY || 'pcsk_6nJG4B_ULWywbvyUGWAjGP3YNGVTeXDenrDSX9EsmPiRm9usaaiAgPs9q4jK9uH2b44C9B',
    ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || 'us-east-1',
    INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'xaali-agent',
    DIMENSIONS: 1024
};
exports.config = {
    apiUrl: process.env.BACKEND_URL || 'http://localhost:3000',
    webrtc: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    },
    app: {
        name: 'Xaali',
        version: '1.0.0',
        supportEmail: 'support@xaali.sn'
    },
    openai: {
        apiKey: exports.AI_CONFIG.OPENAI_API_KEY,
        model: 'gpt-4o-mini',
        maxTokens: 1000,
        temperature: 0.3
    },
    pinecone: {
        apiKey: exports.PINECONE_CONFIG.API_KEY,
        environment: exports.PINECONE_CONFIG.ENVIRONMENT,
        indexName: exports.PINECONE_CONFIG.INDEX_NAME,
        dimensions: exports.PINECONE_CONFIG.DIMENSIONS
    }
};
const checkAIConfig = () => {
    const hasOpenAI = !!exports.AI_CONFIG.OPENAI_API_KEY;
    const hasPinecone = !!exports.PINECONE_CONFIG.API_KEY && exports.PINECONE_CONFIG.API_KEY !== 'your_pinecone_api_key_here';
    console.log('🔧 Configuration IA Xaali (Backend):', {
        OpenAI: hasOpenAI ? '✅ Configuré' : '❌ Non configuré',
        Pinecone: hasPinecone ? '✅ Configuré' : '❌ Non configuré',
        'Mode': process.env.NODE_ENV === 'development' ? '✅ Développement' : '✅ Production'
    });
    if (hasOpenAI) {
        console.log('🚀 OpenAI API prête à être utilisée');
    }
    else {
        console.log('❌ Clé API OpenAI manquante');
    }
    if (hasPinecone) {
        console.log('🌲 Pinecone prêt à être utilisé');
    }
    else {
        console.log('❌ Clé API Pinecone manquante - Créez un fichier .env avec PINECONE_API_KEY');
    }
    return { hasOpenAI, hasPinecone };
};
exports.checkAIConfig = checkAIConfig;
const getConfig = () => {
    return {
        ...exports.config,
        ai: exports.AI_CONFIG,
        pinecone: exports.PINECONE_CONFIG
    };
};
exports.getConfig = getConfig;
//# sourceMappingURL=config.js.map
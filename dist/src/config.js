"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.checkAIConfig = exports.testOpenAIKey = exports.config = exports.BICTORYS_CONFIG = exports.PINECONE_CONFIG = exports.PAYTECH_CONFIG = exports.AI_CONFIG = void 0;
exports.AI_CONFIG = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'your_openai_api_key_here',
    MODELS: {
        OPENAI: 'gpt-3.5-turbo',
        EMBEDDING: 'text-embedding-ada-002'
    }
};
exports.PAYTECH_CONFIG = {
    API_KEY: process.env.PAYTECH_API_KEY || '0a7be2ae03fbde423658f6a677dfafceb2c9019afff79cbe831106353e2281e9',
    SECRET_KEY: process.env.PAYTECH_SECRET_KEY || '25e90fec5ff9717a863d2a5323153fa7ca821ee741b2ca6a16b258fa5f64ef4d',
    BASE_URL: 'https://paytech.sn/api/payment/request-payment'
};
exports.PINECONE_CONFIG = {
    API_KEY: process.env.PINECONE_API_KEY || 'your_pinecone_api_key_here',
    ENVIRONMENT: process.env.PINECONE_ENVIRONMENT || 'us-east-1',
    INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'xaali-agent',
    DIMENSIONS: 1024
};
exports.BICTORYS_CONFIG = {
    SANDBOX: {
        API_URL: 'https://api.test.bictorys.com/pay/v1',
        MERCHANT_ID: process.env.BICTORYS_MERCHANT_ID || 'test_merchant_id',
        API_KEY: process.env.BICTORYS_API_KEY || 'your_bictorys_api_key_here',
        SECRET_KEY: process.env.BICTORYS_SECRET_KEY || 'your_bictorys_secret_key_here'
    },
    PRODUCTION: {
        API_URL: 'https://api.bictorys.com/pay/v1',
        MERCHANT_ID: process.env.BICTORYS_PROD_MERCHANT_ID,
        API_KEY: process.env.BICTORYS_PROD_API_KEY,
        SECRET_KEY: process.env.BICTORYS_PROD_SECRET_KEY
    },
    MOBILE_MONEY_PROVIDERS: {
        ORANGE_MONEY: 'orange_money',
        MTN_MOBILE_MONEY: 'mtn_mobile_money',
        MOOV_MONEY: 'moov_money',
        WAVE: 'wave',
        FREE_MONEY: 'free_money'
    }
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
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0.1,
        stream: true,
        timeout: 10000
    },
    pinecone: {
        apiKey: exports.PINECONE_CONFIG.API_KEY,
        environment: exports.PINECONE_CONFIG.ENVIRONMENT,
        indexName: exports.PINECONE_CONFIG.INDEX_NAME,
        dimensions: exports.PINECONE_CONFIG.DIMENSIONS
    },
    bictorys: {
        isProduction: process.env.NODE_ENV === 'production',
        config: process.env.NODE_ENV === 'production' ? exports.BICTORYS_CONFIG.PRODUCTION : exports.BICTORYS_CONFIG.SANDBOX,
        providers: exports.BICTORYS_CONFIG.MOBILE_MONEY_PROVIDERS
    },
    paytech: {
        apiKey: exports.PAYTECH_CONFIG.API_KEY,
        secretKey: exports.PAYTECH_CONFIG.SECRET_KEY,
        baseUrl: exports.PAYTECH_CONFIG.BASE_URL
    }
};
const testOpenAIKey = async () => {
    return new Promise((resolve) => {
        try {
            const https = require('https');
            const options = {
                hostname: 'api.openai.com',
                port: 443,
                path: '/v1/models',
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${exports.AI_CONFIG.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            };
            const req = https.request(options, (res) => {
                if (res.statusCode === 200) {
                    console.log('Clé API OpenAI valide');
                    resolve(true);
                }
                else {
                    console.log('Clé API OpenAI invalide - Status:', res.statusCode);
                    console.log('Clé utilisée:', exports.AI_CONFIG.OPENAI_API_KEY?.substring(0, 20) + '...');
                    resolve(false);
                }
            });
            req.on('error', (error) => {
                console.log('Erreur lors du test de la clé API OpenAI:', error.message);
                resolve(false);
            });
            req.on('timeout', () => {
                console.log('Timeout lors du test de la clé API OpenAI');
                req.destroy();
                resolve(false);
            });
            req.end();
        }
        catch (error) {
            console.log('Erreur lors du test de la clé API OpenAI:', error.message);
            resolve(false);
        }
    });
};
exports.testOpenAIKey = testOpenAIKey;
const checkAIConfig = () => {
    const hasOpenAI = !!exports.AI_CONFIG.OPENAI_API_KEY;
    const hasPinecone = !!exports.PINECONE_CONFIG.API_KEY && exports.PINECONE_CONFIG.API_KEY !== 'your_pinecone_api_key_here';
    const hasBictorys = !!exports.BICTORYS_CONFIG.SANDBOX.MERCHANT_ID && exports.BICTORYS_CONFIG.SANDBOX.MERCHANT_ID !== 'your_merchant_id_here';
    console.log('Configuration IA Xaali (Backend):', {
        OpenAI: hasOpenAI ? 'Configuré' : 'Non configuré',
        Pinecone: hasPinecone ? 'Configuré' : 'Non configuré',
        Bictorys: hasBictorys ? 'Configuré' : 'Non configuré',
        'Mode': process.env.NODE_ENV === 'development' ? 'Développement' : 'Production'
    });
    if (hasOpenAI) {
        console.log('OpenAI API prête à être utilisée');
        setTimeout(() => (0, exports.testOpenAIKey)(), 1000);
    }
    else {
        console.log('Clé API OpenAI manquante');
    }
    if (hasPinecone) {
        console.log('Pinecone prêt à être utilisé');
    }
    else {
        console.log('Clé API Pinecone manquante - Créez un fichier .env avec PINECONE_API_KEY');
    }
    if (hasBictorys) {
        console.log('Bictorys Mobile Money prêt à être utilisé');
    }
    else {
        console.log('Configuration Bictorys manquante - Configurez BICTORYS_MERCHANT_ID, BICTORYS_API_KEY, BICTORYS_SECRET_KEY');
    }
    return { hasOpenAI, hasPinecone, hasBictorys };
};
exports.checkAIConfig = checkAIConfig;
const getConfig = () => {
    return {
        ...exports.config,
        ai: exports.AI_CONFIG,
        pinecone: exports.PINECONE_CONFIG,
        bictorys: exports.BICTORYS_CONFIG,
        paytech: exports.PAYTECH_CONFIG
    };
};
exports.getConfig = getConfig;
//# sourceMappingURL=config.js.map
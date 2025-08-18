export declare const AI_CONFIG: {
    OPENAI_API_KEY: string;
    MODELS: {
        OPENAI: string;
        EMBEDDING: string;
    };
};
export declare const PINECONE_CONFIG: {
    API_KEY: string;
    ENVIRONMENT: string;
    INDEX_NAME: string;
    DIMENSIONS: number;
};
export declare const BICTORYS_CONFIG: {
    SANDBOX: {
        API_URL: string;
        MERCHANT_ID: string;
        API_KEY: string;
        SECRET_KEY: string;
    };
    PRODUCTION: {
        API_URL: string;
        MERCHANT_ID: string | undefined;
        API_KEY: string | undefined;
        SECRET_KEY: string | undefined;
    };
    MOBILE_MONEY_PROVIDERS: {
        ORANGE_MONEY: string;
        MTN_MOBILE_MONEY: string;
        MOOV_MONEY: string;
        WAVE: string;
        FREE_MONEY: string;
    };
};
export declare const config: {
    apiUrl: string;
    webrtc: {
        iceServers: {
            urls: string;
        }[];
    };
    app: {
        name: string;
        version: string;
        supportEmail: string;
    };
    openai: {
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
    };
    pinecone: {
        apiKey: string;
        environment: string;
        indexName: string;
        dimensions: number;
    };
    bictorys: {
        isProduction: boolean;
        config: {
            API_URL: string;
            MERCHANT_ID: string | undefined;
            API_KEY: string | undefined;
            SECRET_KEY: string | undefined;
        };
        providers: {
            ORANGE_MONEY: string;
            MTN_MOBILE_MONEY: string;
            MOOV_MONEY: string;
            WAVE: string;
            FREE_MONEY: string;
        };
    };
};
export declare const checkAIConfig: () => {
    hasOpenAI: boolean;
    hasPinecone: boolean;
    hasBictorys: boolean;
};
export declare const getConfig: () => {
    ai: {
        OPENAI_API_KEY: string;
        MODELS: {
            OPENAI: string;
            EMBEDDING: string;
        };
    };
    pinecone: {
        API_KEY: string;
        ENVIRONMENT: string;
        INDEX_NAME: string;
        DIMENSIONS: number;
    };
    bictorys: {
        SANDBOX: {
            API_URL: string;
            MERCHANT_ID: string;
            API_KEY: string;
            SECRET_KEY: string;
        };
        PRODUCTION: {
            API_URL: string;
            MERCHANT_ID: string | undefined;
            API_KEY: string | undefined;
            SECRET_KEY: string | undefined;
        };
        MOBILE_MONEY_PROVIDERS: {
            ORANGE_MONEY: string;
            MTN_MOBILE_MONEY: string;
            MOOV_MONEY: string;
            WAVE: string;
            FREE_MONEY: string;
        };
    };
    apiUrl: string;
    webrtc: {
        iceServers: {
            urls: string;
        }[];
    };
    app: {
        name: string;
        version: string;
        supportEmail: string;
    };
    openai: {
        apiKey: string;
        model: string;
        maxTokens: number;
        temperature: number;
    };
};

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
};
export declare const checkAIConfig: () => {
    hasOpenAI: boolean;
    hasPinecone: boolean;
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

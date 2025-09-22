"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = require("dotenv");
dotenv.config();
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const config_1 = require("./config");
async function bootstrap() {
    console.log('Démarrage de Xaali Backend...');
    (0, config_1.checkAIConfig)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    console.log('⚠️ Mode sans base de données - Authentification en mémoire uniquement');
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:4173',
        'http://localhost:3001',
        'https://xaali-1tneyr.live.cloudoor.com',
        'https://xaali-q6q6bc.live.cloudoor.com',
        'https://xaali-w0ilbs.live.cloudoor.com',
        /\.cloudoor\.com$/,
        'https://xaali-frontend.onrender.com',
        'https://xaali-backend.onrender.com',
        /\.onrender\.com$/
    ];
    console.log('🔧 Configuration CORS - Mode:', process.env.NODE_ENV);
    if (process.env.NODE_ENV === 'development') {
        console.log('🔓 CORS: Mode développement - Toutes origines autorisées');
        app.enableCors({
            origin: true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        });
    }
    else {
        console.log('🔒 CORS: Mode production - Origines restreintes:', allowedOrigins);
        app.enableCors({
            origin: allowedOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        });
    }
    app.use((req, res, next) => {
        console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
        console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
        console.log('🌐 Origin:', req.headers.origin || 'Aucune origine');
        next();
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`🚀 Serveur Xaali démarré sur http://localhost:${port}`);
    console.log('📚 Documentation: http://localhost:3000/api');
    console.log('🌲 Pinecone endpoints: http://localhost:3000/pinecone');
    console.log('⚖️ Legal Assistant: http://localhost:3000/legal-assistant');
    console.log('🔍 Health Check: http://localhost:3000/health');
    console.log('🤖 Fine-Tuning: http://localhost:3000/fine-tuning/ask');
    console.log('📊 Environnement:', process.env.NODE_ENV || 'development');
    console.log('🔗 CORS activé pour toutes les origines en mode développement');
}
bootstrap();
//# sourceMappingURL=main.js.map
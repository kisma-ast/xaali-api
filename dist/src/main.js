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
    app.enableCors({
        origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
        credentials: true,
    });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    console.log(`Serveur Xaali démarré sur http://localhost:${port}`);
    console.log('Documentation: http://localhost:3000/api');
    console.log('Pinecone endpoints: http://localhost:3000/pinecone');
    console.log('Legal Assistant: http://localhost:3000/legal-assistant');
}
bootstrap();
//# sourceMappingURL=main.js.map
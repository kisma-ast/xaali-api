"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PineconeController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PineconeController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const pinecone_service_1 = require("./pinecone.service");
const embedding_service_1 = require("./embedding.service");
let PineconeController = PineconeController_1 = class PineconeController {
    pineconeService;
    embeddingService;
    logger = new common_1.Logger(PineconeController_1.name);
    constructor(pineconeService, embeddingService) {
        this.pineconeService = pineconeService;
        this.embeddingService = embeddingService;
    }
    async uploadPDF(file, body) {
        try {
            if (!file) {
                throw new common_1.BadRequestException('No file uploaded');
            }
            this.logger.log(`Processing PDF: ${file.originalname}`);
            this.logger.log(`File size: ${file.size} bytes`);
            this.logger.log(`Buffer length: ${file.buffer?.length || 0} bytes`);
            const text = await this.pineconeService.parsePDF(file.buffer);
            const chunks = this.pineconeService.splitTextIntoChunks(text, 500, 100);
            const batchSize = 1;
            const allDocuments = [];
            for (let i = 0; i < chunks.length; i += batchSize) {
                const batch = chunks.slice(i, i + batchSize);
                this.logger.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} (${batch.length} chunks)`);
                let embeddings;
                let retryCount = 0;
                const maxRetries = 3;
                while (retryCount < maxRetries) {
                    try {
                        embeddings = await this.embeddingService.generateEmbeddings(batch);
                        break;
                    }
                    catch (error) {
                        retryCount++;
                        this.logger.warn(`Embedding generation failed (attempt ${retryCount}/${maxRetries}): ${error.message}`);
                        if (retryCount >= maxRetries) {
                            throw new Error(`Failed to generate embeddings after ${maxRetries} attempts: ${error.message}`);
                        }
                        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
                    }
                }
                const batchDocuments = batch.map((chunk, batchIndex) => ({
                    id: `${file.originalname}-chunk-${i + batchIndex}`,
                    values: embeddings[batchIndex],
                    metadata: {
                        text: chunk,
                        source: file.originalname,
                        page: Math.floor((i + batchIndex) / 2) + 1,
                        category: body.category || 'legal',
                        timestamp: new Date().toISOString(),
                    },
                }));
                allDocuments.push(...batchDocuments);
                await this.pineconeService.uploadDocuments(batchDocuments);
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (global.gc) {
                    global.gc();
                }
                this.logger.log(`Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
            }
            return {
                message: 'PDF uploaded and processed successfully',
                filename: file.originalname,
                chunks: allDocuments.length,
                documents: allDocuments.map(doc => ({
                    id: doc.id,
                    metadata: doc.metadata,
                })),
            };
        }
        catch (error) {
            this.logger.error('Error uploading PDF:', error);
            throw error;
        }
    }
    async uploadPDFSimple(file, body) {
        try {
            if (!file) {
                throw new common_1.BadRequestException('No file uploaded');
            }
            this.logger.log(`🚀 Starting simple upload for: ${file.originalname}`);
            this.logger.log(`📊 File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            this.logger.log('📖 Parsing PDF...');
            const text = await this.pineconeService.parsePDF(file.buffer);
            this.logger.log(`📝 Extracted ${text.length} characters`);
            const chunks = this.pineconeService.splitTextIntoChunks(text, 200, 50);
            this.logger.log(`✂️ Split into ${chunks.length} small chunks`);
            const testChunks = chunks.slice(0, 5);
            this.logger.log(`🧪 Testing with first ${testChunks.length} chunks`);
            const allDocuments = [];
            for (let i = 0; i < testChunks.length; i++) {
                const chunk = testChunks[i];
                this.logger.log(`🔄 Processing chunk ${i + 1}/${testChunks.length}`);
                try {
                    this.logger.log('🧠 Generating embedding...');
                    const embedding = await this.embeddingService.generateEmbedding(chunk);
                    this.logger.log('✅ Embedding generated successfully');
                    const document = {
                        id: `${file.originalname}-test-chunk-${i}`,
                        values: embedding,
                        metadata: {
                            text: chunk,
                            source: file.originalname,
                            page: i + 1,
                            category: body.category || 'legal',
                            timestamp: new Date().toISOString(),
                        },
                    };
                    allDocuments.push(document);
                    this.logger.log('🌲 Uploading to Pinecone...');
                    await this.pineconeService.uploadDocuments([document]);
                    this.logger.log('✅ Uploaded to Pinecone successfully');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                catch (error) {
                    this.logger.error(`❌ Error processing chunk ${i + 1}:`, error.message);
                    throw new Error(`Failed to process chunk ${i + 1}: ${error.message}`);
                }
            }
            this.logger.log('🎉 All chunks processed successfully!');
            return {
                message: 'PDF uploaded and processed successfully (test mode)',
                filename: file.originalname,
                chunksProcessed: allDocuments.length,
                totalChunks: chunks.length,
                documents: allDocuments.map(doc => ({
                    id: doc.id,
                    textPreview: doc.metadata.text.substring(0, 100) + '...',
                    category: doc.metadata.category,
                })),
            };
        }
        catch (error) {
            this.logger.error('❌ Error in simple upload:', error);
            throw error;
        }
    }
    async uploadPDFSimpleDummy(file, body) {
        try {
            if (!file) {
                throw new common_1.BadRequestException('No file uploaded');
            }
            this.logger.log(`🚀 Starting PDF upload: ${file.originalname}`);
            this.logger.log(`📊 File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            this.logger.log('📖 Parsing PDF...');
            const text = await this.pineconeService.parsePDF(file.buffer);
            this.logger.log(`📝 Extracted ${text.length} characters`);
            const chunks = this.pineconeService.splitTextIntoChunks(text, 300, 50);
            this.logger.log(`✂️ Split into ${chunks.length} chunks`);
            const testChunks = chunks.slice(0, 3);
            this.logger.log(`🧪 Processing ${testChunks.length} chunks`);
            const allDocuments = [];
            for (let i = 0; i < testChunks.length; i++) {
                const chunk = testChunks[i];
                this.logger.log(`🔄 Processing chunk ${i + 1}/${testChunks.length}`);
                const dummyVector = Array.from({ length: 1024 }, () => Math.random() - 0.5);
                const document = {
                    id: `${file.originalname}-dummy-chunk-${i}`,
                    values: dummyVector,
                    metadata: {
                        text: chunk,
                        source: file.originalname,
                        page: i + 1,
                        category: body.category || 'legal',
                        timestamp: new Date().toISOString(),
                    },
                };
                allDocuments.push(document);
                this.logger.log('🌲 Uploading to Pinecone...');
                await this.pineconeService.uploadDocuments([document]);
                this.logger.log('✅ Uploaded to Pinecone successfully');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            this.logger.log('🎉 PDF upload completed successfully!');
            return {
                message: 'PDF uploaded successfully (with dummy vectors)',
                filename: file.originalname,
                chunksProcessed: allDocuments.length,
                totalChunks: chunks.length,
                documents: allDocuments.map(doc => ({
                    id: doc.id,
                    textPreview: doc.metadata.text.substring(0, 100) + '...',
                    category: doc.metadata.category,
                })),
            };
        }
        catch (error) {
            this.logger.error('❌ Error in PDF upload:', error);
            throw error;
        }
    }
    async uploadVectors(documents) {
        try {
            await this.pineconeService.uploadDocuments(documents);
            return {
                message: 'Vectors uploaded successfully',
                count: documents.length,
            };
        }
        catch (error) {
            this.logger.error('Error uploading vectors:', error);
            throw error;
        }
    }
    async searchVectors(body) {
        try {
            const results = await this.pineconeService.searchSimilar(body.vector, body.topK || 5, body.filter);
            return {
                results,
                count: results.length,
            };
        }
        catch (error) {
            this.logger.error('Error searching vectors:', error);
            throw error;
        }
    }
    async searchByText(body) {
        try {
            const queryEmbedding = await this.embeddingService.generateEmbedding(body.query);
            const results = await this.pineconeService.searchSimilar(queryEmbedding, body.topK || 5, body.filter);
            return {
                query: body.query,
                results,
                count: results.length,
            };
        }
        catch (error) {
            this.logger.error('Error searching by text:', error);
            throw error;
        }
    }
    async uploadText(body) {
        try {
            if (!body.text || body.text.trim().length === 0) {
                throw new common_1.BadRequestException('Text is required');
            }
            this.logger.log('🚀 Starting text upload');
            this.logger.log(`📝 Text length: ${body.text.length} characters`);
            const chunks = this.pineconeService.splitTextIntoChunks(body.text, 200, 50);
            this.logger.log(`✂️ Split into ${chunks.length} chunks`);
            const testChunks = chunks.slice(0, 3);
            this.logger.log(`🧪 Testing with first ${testChunks.length} chunks`);
            const allDocuments = [];
            for (let i = 0; i < testChunks.length; i++) {
                const chunk = testChunks[i];
                this.logger.log(`🔄 Processing chunk ${i + 1}/${testChunks.length}`);
                try {
                    this.logger.log('🧠 Generating embedding...');
                    const embedding = await this.embeddingService.generateEmbedding(chunk);
                    this.logger.log('✅ Embedding generated successfully');
                    const document = {
                        id: `text-upload-${Date.now()}-chunk-${i}`,
                        values: embedding,
                        metadata: {
                            text: chunk,
                            source: body.source || 'manual-upload',
                            page: i + 1,
                            category: body.category || 'legal',
                            timestamp: new Date().toISOString(),
                        },
                    };
                    allDocuments.push(document);
                    this.logger.log('🌲 Uploading to Pinecone...');
                    await this.pineconeService.uploadDocuments([document]);
                    this.logger.log('✅ Uploaded to Pinecone successfully');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                catch (error) {
                    this.logger.error(`❌ Error processing chunk ${i + 1}:`, error.message);
                    throw new Error(`Failed to process chunk ${i + 1}: ${error.message}`);
                }
            }
            this.logger.log('🎉 All text chunks processed successfully!');
            return {
                message: 'Text uploaded and processed successfully',
                chunksProcessed: allDocuments.length,
                totalChunks: chunks.length,
                documents: allDocuments.map(doc => ({
                    id: doc.id,
                    textPreview: doc.metadata.text.substring(0, 100) + '...',
                    category: doc.metadata.category,
                })),
            };
        }
        catch (error) {
            this.logger.error('❌ Error in text upload:', error);
            throw error;
        }
    }
    async testSimple() {
        try {
            this.logger.log('🚀 Test simple upload starting...');
            const testText = "Le droit civil régit les relations entre les personnes.";
            this.logger.log('🧠 Generating embedding...');
            const embedding = await this.embeddingService.generateEmbedding(testText);
            this.logger.log('✅ Embedding generated successfully');
            const document = {
                id: `test-${Date.now()}`,
                values: embedding,
                metadata: {
                    text: testText,
                    source: 'test-simple',
                    page: 1,
                    category: 'droit-civil',
                    timestamp: new Date().toISOString(),
                },
            };
            this.logger.log('🌲 Uploading to Pinecone...');
            await this.pineconeService.uploadDocuments([document]);
            this.logger.log('✅ Uploaded to Pinecone successfully');
            return {
                message: 'Test upload successful!',
                document: {
                    id: document.id,
                    text: document.metadata.text,
                    category: document.metadata.category,
                },
            };
        }
        catch (error) {
            this.logger.error('❌ Test failed:', error.message);
            throw error;
        }
    }
    async testPineconeOnly() {
        try {
            this.logger.log('🚀 Testing Pinecone connection only...');
            const dummyVector = Array.from({ length: 1024 }, () => Math.random() - 0.5);
            const document = {
                id: `test-pinecone-${Date.now()}`,
                values: dummyVector,
                metadata: {
                    text: "Test document",
                    source: 'test-pinecone-only',
                    page: 1,
                    category: 'test',
                    timestamp: new Date().toISOString(),
                },
            };
            this.logger.log('🌲 Uploading dummy vector to Pinecone...');
            await this.pineconeService.uploadDocuments([document]);
            this.logger.log('✅ Pinecone upload successful!');
            return {
                message: 'Pinecone connection test successful!',
                documentId: document.id,
                vectorLength: dummyVector.length,
            };
        }
        catch (error) {
            this.logger.error('❌ Pinecone test failed:', error.message);
            throw error;
        }
    }
    async uploadSimple(body) {
        try {
            if (!body.text || body.text.trim().length === 0) {
                throw new common_1.BadRequestException('Text is required');
            }
            this.logger.log('🚀 Starting simple upload...');
            this.logger.log(`📝 Text: "${body.text}"`);
            const chunks = this.pineconeService.splitTextIntoChunks(body.text, 200, 50);
            this.logger.log(`✂️ Split into ${chunks.length} chunks`);
            const allDocuments = [];
            const testChunks = chunks.slice(0, 2);
            this.logger.log(`🧪 Processing ${testChunks.length} chunks`);
            for (let i = 0; i < testChunks.length; i++) {
                const chunk = testChunks[i];
                this.logger.log(`🔄 Processing chunk ${i + 1}/${testChunks.length}`);
                const dummyVector = Array.from({ length: 1024 }, () => Math.random() - 0.5);
                const document = {
                    id: `simple-upload-${Date.now()}-chunk-${i}`,
                    values: dummyVector,
                    metadata: {
                        text: chunk,
                        source: body.source || 'simple-upload',
                        page: i + 1,
                        category: body.category || 'legal',
                        timestamp: new Date().toISOString(),
                    },
                };
                allDocuments.push(document);
                this.logger.log('🌲 Uploading to Pinecone...');
                await this.pineconeService.uploadDocuments([document]);
                this.logger.log('✅ Uploaded to Pinecone successfully');
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            this.logger.log('🎉 All chunks processed successfully!');
            return {
                message: 'Simple upload completed successfully!',
                chunksProcessed: allDocuments.length,
                totalChunks: chunks.length,
                documents: allDocuments.map(doc => ({
                    id: doc.id,
                    textPreview: doc.metadata.text.substring(0, 50) + '...',
                    category: doc.metadata.category,
                })),
            };
        }
        catch (error) {
            this.logger.error('❌ Error in simple upload:', error);
            throw error;
        }
    }
    async uploadPDFUltraSimple(file, body) {
        try {
            if (!file) {
                throw new common_1.BadRequestException('No file uploaded');
            }
            this.logger.log(`🚀 ULTRA SIMPLE: Processing ${file.originalname}`);
            this.logger.log(`📊 File size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
            this.logger.log('📖 Parsing PDF...');
            const text = await this.pineconeService.parsePDF(file.buffer);
            this.logger.log(`📝 Extracted ${text.length} characters`);
            const shortText = text.substring(0, 100);
            this.logger.log(`✂️ Using first 100 characters: "${shortText}..."`);
            const dummyVector = Array.from({ length: 1024 }, () => Math.random() - 0.5);
            const document = {
                id: `ultra-simple-${Date.now()}`,
                values: dummyVector,
                metadata: {
                    text: shortText,
                    source: file.originalname,
                    page: 1,
                    category: body.category || 'legal',
                    timestamp: new Date().toISOString(),
                },
            };
            this.logger.log('🌲 Uploading to Pinecone...');
            await this.pineconeService.uploadDocuments([document]);
            this.logger.log('✅ Uploaded to Pinecone successfully!');
            return {
                message: 'PDF uploaded successfully (ultra simple mode)',
                filename: file.originalname,
                textPreview: shortText,
                documentId: document.id,
                category: body.category || 'legal',
            };
        }
        catch (error) {
            this.logger.error('❌ Error in ultra simple upload:', error);
            throw error;
        }
    }
    async uploadStructuredText(body) {
        try {
            if (!body.title || !body.content || !body.category) {
                throw new common_1.BadRequestException('Title, content and category are required');
            }
            this.logger.log('🚀 Starting structured text upload...');
            this.logger.log(`📝 Title: "${body.title}"`);
            this.logger.log(`📄 Content length: ${body.content.length} characters`);
            this.logger.log(`🏷️ Category: ${body.category}`);
            const chunks = this.pineconeService.splitTextIntoChunks(body.content, 500, 100);
            this.logger.log(`✂️ Split into ${chunks.length} chunks`);
            const allDocuments = [];
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                this.logger.log(`🔄 Processing chunk ${i + 1}/${chunks.length}`);
                const dummyVector = Array.from({ length: 1024 }, () => Math.random() - 0.5);
                const document = {
                    id: `structured-${Date.now()}-chunk-${i}`,
                    values: dummyVector,
                    metadata: {
                        text: chunk,
                        title: body.title,
                        source: body.source || 'structured-upload',
                        author: body.author || 'unknown',
                        date: body.date || new Date().toISOString(),
                        page: i + 1,
                        category: body.category,
                        timestamp: new Date().toISOString(),
                        chunkIndex: i,
                        totalChunks: chunks.length,
                    },
                };
                allDocuments.push(document);
                this.logger.log('🌲 Uploading to Pinecone...');
                await this.pineconeService.uploadDocuments([document]);
                this.logger.log('✅ Uploaded to Pinecone successfully');
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            this.logger.log('🎉 All structured text chunks processed successfully!');
            return {
                message: 'Structured text uploaded successfully!',
                title: body.title,
                category: body.category,
                chunksProcessed: allDocuments.length,
                totalChunks: chunks.length,
                documents: allDocuments.map(doc => ({
                    id: doc.id,
                    chunkIndex: doc.metadata.chunkIndex,
                    textPreview: doc.metadata.text.substring(0, 100) + '...',
                    category: doc.metadata.category,
                })),
            };
        }
        catch (error) {
            this.logger.error('❌ Error in structured text upload:', error);
            throw error;
        }
    }
    async getStats() {
        try {
            const stats = await this.pineconeService.getIndexStats();
            return stats;
        }
        catch (error) {
            this.logger.error('Error getting stats:', error);
            throw error;
        }
    }
    async deleteDocument(id) {
        try {
            await this.pineconeService.deleteDocument(id);
            return {
                message: 'Document deleted successfully',
                id,
            };
        }
        catch (error) {
            this.logger.error('Error deleting document:', error);
            throw error;
        }
    }
    async deleteDocuments(body) {
        try {
            await this.pineconeService.deleteDocuments(body.ids);
            return {
                message: 'Documents deleted successfully',
                count: body.ids.length,
            };
        }
        catch (error) {
            this.logger.error('Error deleting documents:', error);
            throw error;
        }
    }
    generateDummyVector(dimensions) {
        return Array.from({ length: dimensions }, () => Math.random() - 0.5);
    }
};
exports.PineconeController = PineconeController;
__decorate([
    (0, common_1.Post)('upload-pdf'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: undefined,
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'application/pdf') {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Only PDF files are allowed'), false);
            }
        },
        limits: {
            fileSize: 50 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "uploadPDF", null);
__decorate([
    (0, common_1.Post)('upload-pdf-simple'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: undefined,
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'application/pdf') {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Only PDF files are allowed'), false);
            }
        },
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "uploadPDFSimple", null);
__decorate([
    (0, common_1.Post)('upload-pdf-simple-dummy'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: undefined,
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'application/pdf') {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Only PDF files are allowed'), false);
            }
        },
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "uploadPDFSimpleDummy", null);
__decorate([
    (0, common_1.Post)('upload-vectors'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "uploadVectors", null);
__decorate([
    (0, common_1.Post)('search'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "searchVectors", null);
__decorate([
    (0, common_1.Post)('search-text'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "searchByText", null);
__decorate([
    (0, common_1.Post)('upload-text'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "uploadText", null);
__decorate([
    (0, common_1.Post)('test-simple'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "testSimple", null);
__decorate([
    (0, common_1.Post)('test-pinecone-only'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "testPineconeOnly", null);
__decorate([
    (0, common_1.Post)('upload-simple'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "uploadSimple", null);
__decorate([
    (0, common_1.Post)('upload-pdf-ultra-simple'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: undefined,
        fileFilter: (req, file, cb) => {
            if (file.mimetype === 'application/pdf') {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Only PDF files are allowed'), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "uploadPDFUltraSimple", null);
__decorate([
    (0, common_1.Post)('upload-structured-text'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "uploadStructuredText", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "getStats", null);
__decorate([
    (0, common_1.Delete)('document/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "deleteDocument", null);
__decorate([
    (0, common_1.Delete)('documents'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PineconeController.prototype, "deleteDocuments", null);
exports.PineconeController = PineconeController = PineconeController_1 = __decorate([
    (0, common_1.Controller)('pinecone'),
    __metadata("design:paramtypes", [pinecone_service_1.PineconeService,
        embedding_service_1.EmbeddingService])
], PineconeController);
//# sourceMappingURL=pinecone.controller.js.map
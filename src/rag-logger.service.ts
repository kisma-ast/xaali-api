import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RAGLoggerService {
  private readonly logger = new Logger('RAG-SYSTEM');

  logRAGResponse(query: string, response: any, processingTime: number) {
    const logData = {
      timestamp: new Date().toISOString(),
      system: 'RAG',
      query: query.substring(0, 100),
      confidence: response.confidence,
      processingTime: `${processingTime}ms`,
      sourcesCount: response.sources?.length || 0,
      pineconeHits: response.metadata?.pineconeHits || 0,
      webSearchUsed: response.metadata?.webSearchUsed || false,
    };

    this.logger.log(`🤖 RAG Response Generated: ${JSON.stringify(logData)}`);
  }

  logRAGError(query: string, error: any) {
    this.logger.error(`❌ RAG Error for query "${query.substring(0, 50)}": ${error.message}`);
  }
}
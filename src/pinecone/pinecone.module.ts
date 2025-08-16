import { Module } from '@nestjs/common';
import { PineconeService } from './pinecone.service';
import { EmbeddingService } from './embedding.service';

@Module({
  providers: [PineconeService, EmbeddingService],
  exports: [PineconeService, EmbeddingService],
})
export class PineconeModule {}

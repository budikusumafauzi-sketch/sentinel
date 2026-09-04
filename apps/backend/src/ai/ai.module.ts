import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ThreatIntelModule } from '../threat-intel/threat-intel.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PromptRegistry } from './prompts/prompt-registry';
import { OutputValidator } from './validation/output-validator';
import { GeminiProvider } from './providers/gemini.provider';
import { MockAiProvider } from './providers/mock.provider';
import { AI_PROVIDER_TOKEN } from './interfaces/ai-provider.interface';

@Module({
  imports: [PrismaModule, ThreatIntelModule],
  controllers: [AiController],
  providers: [
    PromptRegistry,
    OutputValidator,
    GeminiProvider,
    MockAiProvider,
    {
      provide: AI_PROVIDER_TOKEN,
      useClass: GeminiProvider,
    },
    AiService,
  ],
  exports: [AiService, AI_PROVIDER_TOKEN, PromptRegistry, OutputValidator],
})
export class AiModule {}

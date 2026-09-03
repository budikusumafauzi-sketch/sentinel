import { Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const SCAN_QUEUE = 'sentinel-scan';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('QueueModule');
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: configService.get<number>('REDIS_PORT', 6379),
            maxRetriesPerRequest: null, // BullMQ requirement
            retryStrategy: (times: number) => {
              if (times > 3) {
                logger.warn('BullMQ Redis connection failed, queues unavailable');
                return null;
              }
              return Math.min(times * 200, 2000);
            },
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: SCAN_QUEUE,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

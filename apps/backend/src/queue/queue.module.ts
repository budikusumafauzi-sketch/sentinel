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
              const delay = Math.min(100 * Math.pow(1.5, Math.min(times, 8)), 3000);
              if (times === 1 || times % 10 === 0) {
                logger.warn(
                  `BullMQ Redis connection lost; reconnecting in ${Math.round(delay)}ms (attempt ${times})`,
                );
              }
              return delay;
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

import { Global, Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);

        const client = new Redis({
          host,
          port,
          maxRetriesPerRequest: 3,
          retryStrategy: (times: number) => {
            // Bounded exponential backoff up to 3000ms, ensuring resilient recovery when Redis restarts
            const delay = Math.min(100 * Math.pow(1.5, Math.min(times, 8)), 3000);
            if (times === 1 || times % 10 === 0) {
              logger.warn(
                `Redis connection lost; reconnecting in ${Math.round(delay)}ms (attempt ${times})`,
              );
            }
            return delay;
          },
          lazyConnect: true,
        });

        client.on('connect', () => logger.log('Redis connected'));
        client.on('error', (err: Error) => logger.warn(`Redis error: ${err.message}`));

        // Attempt connection but don't block startup
        client.connect().catch((err: Error) => {
          logger.warn(`Redis initial connection failed: ${err.message}`);
        });

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}

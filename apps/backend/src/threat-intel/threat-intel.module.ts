import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from '../redis/redis.module';
import { ThreatIntelController } from './threat-intel.controller';
import { ThreatIntelService } from './threat-intel.service';
import { ThreatIntelCacheService } from './cache/threat-intel-cache.service';
import { ThreatIntelRateLimiterService } from './rate-limiting/threat-intel-rate-limiter.service';
import { CisaKevProvider } from './providers/cisa-kev.provider';
import { OsvProvider } from './providers/osv.provider';
import { UrlhausProvider } from './providers/urlhaus.provider';
import { OpenPhishProvider } from './providers/openphish.provider';
import { ExposureProvider } from './providers/exposure.provider';

@Module({
  imports: [ConfigModule, RedisModule],
  controllers: [ThreatIntelController],
  providers: [
    ThreatIntelCacheService,
    ThreatIntelRateLimiterService,
    CisaKevProvider,
    OsvProvider,
    UrlhausProvider,
    OpenPhishProvider,
    ExposureProvider,
    ThreatIntelService,
  ],
  exports: [
    ThreatIntelService,
    ThreatIntelCacheService,
    CisaKevProvider,
    OsvProvider,
    UrlhausProvider,
    OpenPhishProvider,
    ExposureProvider,
  ],
})
export class ThreatIntelModule {}

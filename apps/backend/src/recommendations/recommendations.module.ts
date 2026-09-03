import { Module } from '@nestjs/common';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [DevicesModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
  exports: [RecommendationsService],
})
export class RecommendationsModule {}

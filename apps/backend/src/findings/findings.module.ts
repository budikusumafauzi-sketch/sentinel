import { Module } from '@nestjs/common';
import { FindingsController } from './findings.controller';
import { FindingsService } from './findings.service';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [DevicesModule],
  controllers: [FindingsController],
  providers: [FindingsService],
  exports: [FindingsService],
})
export class FindingsModule {}

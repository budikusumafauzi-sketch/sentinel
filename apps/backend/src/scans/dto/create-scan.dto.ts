import { IsUUID, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ScanTypeDto {
  QUICK = 'QUICK',
  FULL = 'FULL',
  CUSTOM = 'CUSTOM',
}

export class CreateScanDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  deviceId: string;

  @ApiPropertyOptional({ enum: ScanTypeDto, default: 'QUICK' })
  @IsOptional()
  @IsEnum(ScanTypeDto)
  type?: ScanTypeDto;
}

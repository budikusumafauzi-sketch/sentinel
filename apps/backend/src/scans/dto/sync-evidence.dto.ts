import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EvidenceItemDto {
  @ApiProperty({ example: 'android.os.version' })
  @IsString()
  @MaxLength(100)
  checkId: string;

  @ApiProperty({ example: 'SYSTEM' })
  @IsString()
  @MaxLength(50)
  category: string;

  @ApiProperty({ example: 'OS Version' })
  @IsString()
  @MaxLength(200)
  checkName: string;

  @ApiPropertyOptional()
  @IsOptional()
  value: unknown;

  @ApiProperty({ example: 'VERIFIED' })
  @IsString()
  @MaxLength(50)
  trustState: string;

  @ApiProperty({ example: 'android.os.Build.VERSION' })
  @IsString()
  @MaxLength(500)
  source: string;

  @ApiProperty({ example: 'ANDROID' })
  @IsString()
  @MaxLength(50)
  platform: string;

  @ApiProperty({ example: '2026-09-03T08:00:00.000Z' })
  @IsString()
  @MaxLength(50)
  timestamp: string;

  @ApiProperty({ example: 'SUPPORTED' })
  @IsString()
  @MaxLength(50)
  capabilityStatus: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  permission?: string;

  @ApiPropertyOptional()
  @IsOptional()
  permissionGranted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class DeviceMetaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  osVersion?: string;
}

export class SyncEvidenceDto {
  @ApiProperty({ type: [EvidenceItemDto] })
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => EvidenceItemDto)
  rawEvidence: EvidenceItemDto[];

  @ApiProperty({ type: Object })
  @IsObject()
  capabilities: Record<string, string>;

  @ApiPropertyOptional({ type: DeviceMetaDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => DeviceMetaDto)
  deviceInfo?: DeviceMetaDto;

  @ApiPropertyOptional({ example: 'Inspection completed with platform visibility limitations' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  summary?: string;
}

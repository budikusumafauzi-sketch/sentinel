import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EvidenceItemDto {
  @ApiProperty({ example: 'android.os.version' })
  @IsString()
  checkId: string;

  @ApiProperty({ example: 'SYSTEM' })
  @IsString()
  category: string;

  @ApiProperty({ example: 'OS Version' })
  @IsString()
  checkName: string;

  @ApiPropertyOptional()
  @IsOptional()
  value: unknown;

  @ApiProperty({ example: 'VERIFIED' })
  @IsString()
  trustState: string;

  @ApiProperty({ example: 'android.os.Build.VERSION' })
  @IsString()
  source: string;

  @ApiProperty({ example: 'ANDROID' })
  @IsString()
  platform: string;

  @ApiProperty({ example: '2026-09-03T08:00:00.000Z' })
  @IsString()
  timestamp: string;

  @ApiProperty({ example: 'SUPPORTED' })
  @IsString()
  capabilityStatus: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  permission?: string;

  @ApiPropertyOptional()
  @IsOptional()
  permissionGranted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DeviceMetaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  osVersion?: string;
}

export class SyncEvidenceDto {
  @ApiProperty({ type: [EvidenceItemDto] })
  @IsArray()
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
  summary?: string;
}

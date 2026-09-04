import {
  IsUUID,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  MaxLength,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FindingSeverityDto {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

export enum FindingCategoryDto {
  SYSTEM = 'SYSTEM',
  APPLICATION = 'APPLICATION',
  NETWORK = 'NETWORK',
  PRIVACY = 'PRIVACY',
  AUTHENTICATION = 'AUTHENTICATION',
  ENCRYPTION = 'ENCRYPTION',
  PERMISSIONS = 'PERMISSIONS',
  UPDATE = 'UPDATE',
  CONFIGURATION = 'CONFIGURATION',
  OTHER = 'OTHER',
}

export enum FindingStatusDto {
  OPEN = 'OPEN',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
}

export class CreateFindingDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  scanId: string;

  @ApiProperty({ enum: FindingCategoryDto })
  @IsEnum(FindingCategoryDto)
  category: FindingCategoryDto;

  @ApiProperty({ example: 'Outdated OS version detected' })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ example: 'The device is running an outdated OS version.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: FindingSeverityDto })
  @IsEnum(FindingSeverityDto)
  severity: FindingSeverityDto;

  @ApiPropertyOptional({ example: 'system-scanner' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  source?: string;

  @ApiPropertyOptional({ example: 0.95 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  evidence?: Record<string, unknown>;

  @ApiPropertyOptional({ example: 'OS version is below the latest security patch.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  explanation?: string;

  @ApiPropertyOptional({ example: 'Update your device to the latest OS version.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  remediation?: string;
}

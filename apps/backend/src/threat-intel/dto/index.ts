import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsBoolean,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ThreatIntelType } from '@sentinel/types';

export class QueryThreatIntelDto {
  @ApiProperty({
    enum: ['URL', 'DOMAIN', 'CVE', 'EXPOSURE'],
    description: 'Type of cybersecurity intelligence requested',
    example: 'URL',
  })
  @IsEnum(['URL', 'DOMAIN', 'CVE', 'EXPOSURE'])
  type!: ThreatIntelType;

  @ApiProperty({
    description: 'Indicator string to query (URL, domain, CVE ID, or entity name)',
    example: 'https://malicious-phishing-example.com',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  indicator!: string;

  @ApiPropertyOptional({
    description: 'Bypass cache and query external providers directly',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;
}

export class UrlThreatDto {
  @ApiProperty({
    description: 'Full URL to analyze for malicious activity, phishing, or malware',
    example: 'https://suspicious-login-portal.com/login',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  url!: string;

  @ApiPropertyOptional({
    description: 'Bypass cache and fetch fresh external threat intelligence',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;
}

export class DomainThreatDto {
  @ApiProperty({
    description: 'Fully-qualified domain name or host to check against threat databases',
    example: 'malware-distribution-domain.org',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(253)
  @Matches(/^[a-zA-Z0-9.\-_:]+$/, { message: 'Domain contains invalid characters' })
  domain!: string;

  @ApiPropertyOptional({
    description: 'Bypass cache and fetch fresh external threat intelligence',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;
}

export class CveThreatDto {
  @ApiProperty({
    description: 'Standard CVE ID to lookup in CISA KEV and vulnerability databases',
    example: 'CVE-2021-44228',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Matches(/^CVE-\d{4}-\d{4,8}$/i, { message: 'Invalid CVE ID format' })
  cveId!: string;

  @ApiPropertyOptional({
    description: 'Bypass cache and fetch fresh advisory intelligence',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;
}

export class ExposureThreatDto {
  @ApiProperty({
    description: 'Indicator to evaluate for known exposure (CVE, domain, or software product)',
    example: 'CVE-2021-44228',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  indicator!: string;

  @ApiPropertyOptional({
    enum: ['DOMAIN', 'CVE', 'SOFTWARE'],
    description: 'Indicator classification for exposure assessment',
    default: 'CVE',
  })
  @IsOptional()
  @IsEnum(['DOMAIN', 'CVE', 'SOFTWARE'])
  indicatorType?: 'DOMAIN' | 'CVE' | 'SOFTWARE';

  @ApiPropertyOptional({
    description: 'Bypass cache and fetch fresh exposure intelligence',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;
}

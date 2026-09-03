import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DevicePlatformDto {
  ANDROID = 'ANDROID',
  IOS = 'IOS',
  WINDOWS = 'WINDOWS',
  MACOS = 'MACOS',
  LINUX = 'LINUX',
}

export class CreateDeviceDto {
  @ApiProperty({ example: 'My Pixel 8a' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ enum: DevicePlatformDto, example: 'ANDROID' })
  @IsEnum(DevicePlatformDto)
  platform: DevicePlatformDto;

  @ApiPropertyOptional({ example: '14' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  osVersion?: string;

  @ApiPropertyOptional({ example: 'Pixel 8a' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  model?: string;

  @ApiPropertyOptional({ example: 'Google' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  manufacturer?: string;
}

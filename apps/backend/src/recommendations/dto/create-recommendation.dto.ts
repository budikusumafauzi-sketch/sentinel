import { IsUUID, IsString, IsEnum, IsOptional, MaxLength, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RecommendationPriorityDto {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export class CreateRecommendationDto {
  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  findingId?: string;

  @ApiProperty({ example: 'Update your operating system' })
  @IsString()
  @MaxLength(500)
  title: string;

  @ApiPropertyOptional({ example: 'Navigate to Settings > System > Software Update' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: RecommendationPriorityDto })
  @IsEnum(RecommendationPriorityDto)
  priority: RecommendationPriorityDto;

  @ApiPropertyOptional({ example: 'https://support.google.com/android/answer/7680439' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  actionUrl?: string;
}

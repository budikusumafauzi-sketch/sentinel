import { IsUUID, IsInt, Min, Max, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateScoreDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  deviceId: string;

  @ApiProperty({ example: 75, minimum: 0, maximum: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  overallScore: number;

  @ApiPropertyOptional({ example: { system: 80, network: 70, privacy: 75 } })
  @IsOptional()
  @IsObject()
  categoryScores?: Record<string, number>;
}

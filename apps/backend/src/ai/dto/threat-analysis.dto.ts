import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ThreatAnalysisDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  threatInput!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  context?: string;
}

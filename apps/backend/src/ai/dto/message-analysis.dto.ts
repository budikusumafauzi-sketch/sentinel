import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class MessageAnalysisDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  messageText!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  sender?: string;
}

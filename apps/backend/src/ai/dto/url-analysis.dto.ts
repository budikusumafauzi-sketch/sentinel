import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UrlAnalysisDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  url!: string;
}

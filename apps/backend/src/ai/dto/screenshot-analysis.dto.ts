import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ScreenshotAnalysisDto {
  /** Base64-encoded image data, limit to ~7MB string size (approx 5MB binary) */
  @IsString()
  @IsNotEmpty()
  @MaxLength(7 * 1024 * 1024)
  imageBase64!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['image/png', 'image/jpeg', 'image/webp', 'image/jpg'])
  mimeType!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  contextNote?: string;
}

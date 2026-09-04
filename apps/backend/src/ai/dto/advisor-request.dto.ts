import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SecurityAdvisorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  deviceId!: string;
}

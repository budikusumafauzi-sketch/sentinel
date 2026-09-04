import { IsNotEmpty, IsUUID } from 'class-validator';

export class SecurityAdvisorDto {
  @IsUUID()
  @IsNotEmpty()
  deviceId!: string;
}

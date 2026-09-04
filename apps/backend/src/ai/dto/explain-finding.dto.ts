import { IsNotEmpty, IsUUID } from 'class-validator';

export class ExplainFindingDto {
  @IsUUID()
  @IsNotEmpty()
  findingId!: string;
}

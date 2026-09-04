import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ExplainFindingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  findingId!: string;
}

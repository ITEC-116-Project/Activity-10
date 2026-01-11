import { IsNotEmpty, IsString, IsISO8601, IsInt, Min, IsOptional } from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsISO8601()
  date: string; // ISO string

  @IsNotEmpty()
  @IsISO8601()
  endDate: string;

  @IsNotEmpty()
  @IsString()
  time: string;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsNotEmpty()
  @IsInt()
  @Min(0)
  capacity: number;

  @IsOptional()
  @IsInt()
  registered?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  createdByName?: string;

  @IsOptional()
  @IsString()
  createdByFirstName?: string;

  @IsOptional()
  @IsString()
  createdByLastName?: string;

  @IsOptional()
  @IsString()
  createdByEmail?: string;
}

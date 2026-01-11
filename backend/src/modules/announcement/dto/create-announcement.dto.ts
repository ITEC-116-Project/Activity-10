import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateAnnouncementDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterForEventDto {
  @ApiProperty({ description: 'Event ID to register for' })
  @IsNotEmpty()
  @IsNumber()
  eventId: number;

  @ApiProperty({ description: 'Attendee ID (for regular attendees)', required: false })
  @IsOptional()
  @IsNumber()
  attendeeId?: number;

  @ApiProperty({ description: 'Admin ID (for admin users)', required: false })
  @IsOptional()
  @IsNumber()
  adminId?: number;

  @ApiProperty({ description: 'Attendee/Admin full name' })
  @IsNotEmpty()
  @IsString()
  attendeeName: string;

  @ApiProperty({ description: 'Generated ticket code' })
  @IsNotEmpty()
  @IsString()
  ticketCode: string;
}

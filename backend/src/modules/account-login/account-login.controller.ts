import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { AccountLoginService } from './account-login.service';
import { LoginDto, SignupDto } from './dto/account-login.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('account-login')
export class AccountLoginController {
  constructor(private readonly accountLoginService: AccountLoginService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and get JWT' })
  async login(@Body() loginDto: LoginDto) {
    return this.accountLoginService.login(loginDto);
  }

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  async signup(@Body() signupDto: SignupDto) {
    return this.accountLoginService.signup(signupDto);
  }

  @Get('validate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate and fetch current user by JWT' })
  async validateUser(@Request() req) {
    return this.accountLoginService.validateUser(req.user.userId, req.user.role);
  }

  @Post('change-password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for authenticated user' })
  async changePassword(@Request() req, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.accountLoginService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
  }
}

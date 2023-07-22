import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { UserId } from '../decorators/user.decorator';

@Controller('auth')
export class UserController {
  @UseGuards(JwtAuthGuard)
  @Post('info')
  async info(@UserId() userId: string) {}
}

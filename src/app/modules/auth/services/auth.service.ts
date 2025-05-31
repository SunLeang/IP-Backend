import { Injectable } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { UserAuthService } from './user-auth.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userAuthService: UserAuthService,
    private readonly tokenService: TokenService,
  ) {}

  async register(registerDto: RegisterDto) {
    return this.userAuthService.register(registerDto);
  }

  async login(loginDto: LoginDto) {
    return this.userAuthService.login(loginDto);
  }

  async logout(userId: string, refreshToken: string) {
    return this.tokenService.revokeRefreshToken(userId, refreshToken);
  }

  async refreshTokens(refreshToken: string) {
    return this.tokenService.refreshTokensFromToken(refreshToken);
  }

  async generateTokensForUser(userId: string) {
    return this.tokenService.generateTokensForUser(userId);
  }

  async validateUser(email: string, password: string) {
    return this.userAuthService.validateUser(email, password);
  }
}

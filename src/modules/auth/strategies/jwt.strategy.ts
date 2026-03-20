import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../dto';
import { JwtConfig } from '../../../config';

/**
 * Estrategia de autenticación JWT
 * Valida el token JWT y retorna el usuario autenticado
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JwtConfig.secret,
    });
  }

  async validate(payload: JwtPayload): Promise<unknown> {
    const user = await this.authService.validateUser(payload);
    if (!user) {
      throw new UnauthorizedException('Token inválido');
    }
    return user;
  }
}

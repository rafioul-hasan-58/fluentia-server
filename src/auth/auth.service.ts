import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../modules/users/users.repository';
import { OtpRepository } from './otp.repository';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { RegistrationMethod, User } from '@prisma/client';
import { ForgotPasswordDTO } from './dto/forgotPassword.dto';
import { MailService } from '../modules/mail';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../config/env.schema';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { calculateActiveStreak } from '../modules/users/utils/streak-calculator.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly otpRepository: OtpRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly prisma: PrismaService,
  ) {}

  async register(payload: RegisterDto) {
    const existing: User | null = await this.usersRepository.findByEmail(
      payload.email,
    );

    if (existing) {
      throw new ConflictException('This email is already in use!');
    }
    const hashedPassword = await bcrypt.hash(payload.password, 12);

    const user: User = await this.usersRepository.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: hashedPassword,
    });

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
  }
  private async generateTokens(user: User) {
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(tokenPayload);

    const refreshToken = await this.jwtService.signAsync(tokenPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', { infer: true }),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', {
        infer: true,
      }),
    });

    return { accessToken, refreshToken };
  }
  async login(payload: LoginDto) {
    const user: User | null = await this.usersRepository.findByEmail(
      payload.email,
    );

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid email or password!');
    }

    if (user.isSuspended) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact support for assistance.',
      );
    }

    const isMatch = await bcrypt.compare(payload.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password!');
    }

    await this.calculateActiveStreak(user.id);

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    const accessToken = this.jwtService.sign(tokenPayload);
    return {
      accessToken,
    };
  }
  async forgotPassword(payload: ForgotPasswordDTO) {
    const user = await this.usersRepository.findByEmail(payload.email);
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    const otpCode = Math.floor(10000 + Math.random() * 90000).toString();
    const otpExpireAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.otpRepository.upsert(payload.email, otpCode, otpExpireAt);

    await this.mailService.sendPasswordResetOtp(payload.email, otpCode);
    return {
      message:
        'Password reset OTP verification code sent to your email address.',
      email: payload.email,
    };
  }
  async verifyResetOtp(payload: VerifyResetOtpDto) {
    const otpRecord = await this.otpRepository.findByEmail(payload.email);

    if (!otpRecord) {
      throw new UnauthorizedException(
        'No verification request found for this email',
      );
    }

    if (otpRecord.otp !== payload.otp) {
      throw new UnauthorizedException('Invalid verification code');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new UnauthorizedException('Verification code has expired');
    }

    const user = await this.usersRepository.findByEmail(payload.email);
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    await this.otpRepository.deleteByEmail(payload.email);

    const resetToken = await this.jwtService.signAsync(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        purpose: 'reset-password',
      },
      {
        expiresIn: '10m',
      },
    );

    return {
      message: 'OTP verified successfully.',
      resetToken,
    };
  }

  async resetPassword(userId: string, password: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await this.usersRepository.update(userId, {
      password: hashedPassword,
    });

    return {
      message: 'Password reset successfully.',
    };
  }
  async authenticateGoogleToken(idToken: string) {
    const clientId = this.configService.get('OAUTH_CLIENT_ID', {
      infer: true,
    });
    if (!clientId) {
      throw new Error('Google Client ID is not configured');
    }
    const client = new OAuth2Client(clientId);

    const ticket = await client
      .verifyIdToken({
        idToken,
        audience: clientId,
      })
      .catch(() => {
        throw new UnauthorizedException('Invalid Google ID token');
      });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    const {
      sub: googleId,
      email,
      given_name: firstName,
      family_name: lastName,
      picture: profileImage,
    } = payload;

    if (!email) {
      throw new UnauthorizedException('Email not provided by Google');
    }

    // Check if user exists by googleId first
    let user = await this.usersRepository.findByGoogleId(googleId);

    if (user) {
      // If user doesn't have a profile image yet or it updated, update with Google profile image
      if (profileImage && user.profileImage !== profileImage) {
        user = await this.usersRepository.update(user.id, {
          profileImage,
        });
      }
    } else {
      // If not found by googleId, check by email (to link account if they registered with email previously)
      user = await this.usersRepository.findByEmail(email);

      if (user) {
        user = await this.usersRepository.updateByEmail(email, {
          googleId,
          profileImage: profileImage || user.profileImage || null,
        });
      } else {
        // Create new user with Google profile information
        user = await this.usersRepository.create({
          email,
          googleId,
          firstName: firstName || '',
          lastName: lastName || '',
          profileImage: profileImage || null,
          registrationMethod: RegistrationMethod.GOOGLE,
        });
      }
    }

    if (user.isSuspended) {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact support for assistance.',
      );
    }

    await this.calculateActiveStreak(user.id);

    return this.generateTokens(user);
  }

  async calculateActiveStreak(userId: string) {
    return calculateActiveStreak(this.prisma, userId);
  }
}

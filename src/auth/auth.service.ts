import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '../modules/users/users.repository';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client';
import { ForgotPasswordDTO } from './dto/forgotPassword.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from 'src/modules/mail';
import { VerifyResetOtpDto } from './dto/verify-reset-otp-dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
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

  async login(payload: LoginDto) {
    const user: User | null = await this.usersRepository.findByEmail(
      payload.email,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid email or password!');
    }

    const isMatch = await bcrypt.compare(payload.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password!');
    }

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

    await this.prisma.otp.upsert({
      where: {
        email: payload.email,
      },
      update: {
        otp: otpCode,
        expiresAt: otpExpireAt,
      },
      create: {
        email: payload.email,
        otp: otpCode,
        expiresAt: otpExpireAt,
      },
    });

    await this.mailService.sendPasswordResetOtp(payload.email, otpCode);
    return {
      message:
        'Password reset OTP verification code sent to your email address.',
      email: payload.email,
    };
  }
  async verifyResetOtp(payload: VerifyResetOtpDto) {
    const otpRecord = await this.prisma.otp.findUnique({
      where: { email: payload.email },
    });

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

    await this.prisma.otp.delete({
      where: { email: payload.email },
    });

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
}

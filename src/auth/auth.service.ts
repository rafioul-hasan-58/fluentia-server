import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import bcrypt from 'node_modules/bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
  async register(payload: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });

    if (existing) {
      throw new ConflictException('This email is already in use!');
    }
    const hashedPassword = await bcrypt.hash(payload.password, 12);

    const user = await this.prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return user;
  }
}

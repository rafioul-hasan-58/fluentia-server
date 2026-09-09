import { Injectable } from '@nestjs/common';
import { Otp } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OtpRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(email: string, otp: string, expiresAt: Date): Promise<Otp> {
    return this.prisma.otp.upsert({
      where: { email },
      update: {
        otp,
        expiresAt,
      },
      create: {
        email,
        otp,
        expiresAt,
      },
    });
  }

  async findByEmail(email: string): Promise<Otp | null> {
    return this.prisma.otp.findUnique({
      where: { email },
    });
  }

  async deleteByEmail(email: string): Promise<Otp> {
    return this.prisma.otp.delete({
      where: { email },
    });
  }
}

import { PrismaClient, Role, RegistrationMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

export interface AdminSeedConfig {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export async function seedAdmin(
  prisma: PrismaClient,
  config?: AdminSeedConfig,
) {
  const email =
    config?.email || process.env.ADMIN_EMAIL || 'adminfluentia@gmail.com';
  const password = config?.password || process.env.ADMIN_PASSWORD || '12345678';
  const firstName = config?.firstName || 'Fluentia';
  const lastName = config?.lastName || 'Admin';

  const existingAdmin = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: Role.ADMIN,
        registrationMethod: RegistrationMethod.EMAIL,
      },
    });
    return { created: true, updatedRole: false, user: admin };
  } else {
    if (existingAdmin.role !== Role.ADMIN) {
      const updated = await prisma.user.update({
        where: { email },
        data: { role: Role.ADMIN },
      });
      return { created: false, updatedRole: true, user: updated };
    }
    return { created: false, updatedRole: false, user: existingAdmin };
  }
}

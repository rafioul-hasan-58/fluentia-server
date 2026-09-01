import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Skill } from '@prisma/client';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Finds a grammar skill by its unique slug identifier.
   *
   * @param slug - The unique slug representing the skill (e.g. "present_perfect").
   * @returns The Skill object if found, or null otherwise.
   */
  async findBySlug(slug: string): Promise<Skill | null> {
    return this.prisma.skill.findUnique({
      where: { slug },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma, Skill } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GetSkillsQueryDto } from './dto/get-skills-query.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves all grammar skills with optional filtering by category, CEFR level, or search keyword.
   *
   * @param query - Optional filtering parameters.
   * @returns Array of matching Skill records.
   */
  async findAll(query?: GetSkillsQueryDto): Promise<Skill[]> {
    const where: Prisma.SkillWhereInput = {};

    if (query?.category) {
      where.category = query.category;
    }

    if (query?.cefr) {
      where.cefr = query.cefr;
    }

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.skill.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

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

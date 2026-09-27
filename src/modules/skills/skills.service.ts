import { Injectable } from '@nestjs/common';
import { Prisma, Skill } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GetSkillsQueryDto } from './dto/getSkills.query.dto';
import { SkillCategoryDto } from './dto/skill-response.dto';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the full public grammar skill taxonomy structured as a nested tree.
   *
   * Note: This is public, cacheable, low-write-frequency reference data served
   * to learner dropdowns and practice selectors. Do NOT add per-user filtering or
   * auth-gating logic here.
   *
   * @returns Array of top-level categories with nested, sorted child sub-skills.
   */
  async getSkillTree(): Promise<SkillCategoryDto[]> {
    const parentSkills = await this.prisma.skill.findMany({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return parentSkills.map((parent) => ({
      slug: parent.slug,
      name: parent.name,
      category: parent.category,
      children: parent.children.map((child) => ({
        slug: child.slug,
        name: child.name,
        cefr: child.cefr,
      })),
    }));
  }

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

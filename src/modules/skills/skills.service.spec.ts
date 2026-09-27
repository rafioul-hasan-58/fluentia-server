import { Test, TestingModule } from '@nestjs/testing';
import { EnglishLevel } from '@prisma/client';
import { SkillsService } from './skills.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SkillsService', () => {
  let service: SkillsService;
  let prismaService: {
    skill: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
    };
  };

  const mockSkills = [
    {
      id: '665f1b2e2222222222222222',
      slug: 'present_perfect',
      name: 'Present Perfect',
      category: 'verb_tenses',
      cefr: EnglishLevel.B1,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '665f1b2e3333333333333333',
      slug: 'first_conditional',
      name: 'First Conditional',
      category: 'conditionals',
      cefr: EnglishLevel.A2,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const mockPrismaService = {
      skill: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SkillsService>(SkillsService);
    prismaService = module.get(PrismaService);
  });

  describe('getSkillTree', () => {
    it('should query top-level skills and return tree with stripped internal fields', async () => {
      const mockRawPrismaResult = [
        {
          id: '665f1b2e1111111111111111',
          slug: 'verb',
          name: 'Verb',
          category: 'verb',
          cefr: null,
          parentId: null,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-02'),
          children: [
            {
              id: '665f1b2e2222222222222222',
              slug: 'present_perfect',
              name: 'Present Perfect',
              category: 'verb',
              cefr: 'B1',
              parentId: '665f1b2e1111111111111111',
              createdAt: new Date('2026-01-01'),
              updatedAt: new Date('2026-01-02'),
            },
            {
              id: '665f1b2e3333333333333333',
              slug: 'past_simple',
              name: 'Past Simple',
              category: 'verb',
              cefr: 'A2',
              parentId: '665f1b2e1111111111111111',
              createdAt: new Date('2026-01-01'),
              updatedAt: new Date('2026-01-02'),
            },
          ],
        },
      ];

      prismaService.skill.findMany.mockResolvedValue(mockRawPrismaResult);

      const result = await service.getSkillTree();

      expect(prismaService.skill.findMany).toHaveBeenCalledWith({
        where: { parentId: null },
        include: {
          children: {
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      });

      expect(result).toEqual([
        {
          slug: 'verb',
          name: 'Verb',
          category: 'verb',
          children: [
            { slug: 'present_perfect', name: 'Present Perfect', cefr: 'B1' },
            { slug: 'past_simple', name: 'Past Simple', cefr: 'A2' },
          ],
        },
      ]);

      // Explicitly assert that Mongo internals do not leak
      const parent = result[0] as unknown as Record<string, unknown>;
      expect(parent.id).toBeUndefined();
      expect(parent.parentId).toBeUndefined();
      expect(parent.createdAt).toBeUndefined();
      expect(parent.updatedAt).toBeUndefined();

      const child = result[0].children[0] as unknown as Record<string, unknown>;
      expect(child.id).toBeUndefined();
      expect(child.parentId).toBeUndefined();
      expect(child.createdAt).toBeUndefined();
      expect(child.updatedAt).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('should return all skills without filters', async () => {
      prismaService.skill.findMany.mockResolvedValue(mockSkills);

      const result = await service.findAll();

      expect(prismaService.skill.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual(mockSkills);
    });

    it('should filter by category and cefr and search keyword', async () => {
      prismaService.skill.findMany.mockResolvedValue([mockSkills[0]]);

      const result = await service.findAll({
        category: 'verb_tenses',
        cefr: 'B1',
        search: 'perfect',
      });

      expect(prismaService.skill.findMany).toHaveBeenCalledWith({
        where: {
          category: 'verb_tenses',
          cefr: 'B1',
          OR: [
            { name: { contains: 'perfect', mode: 'insensitive' } },
            { slug: { contains: 'perfect', mode: 'insensitive' } },
          ],
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });
      expect(result).toEqual([mockSkills[0]]);
    });
  });

  describe('findBySlug', () => {
    it('should query prisma.skill.findUnique with the given slug', async () => {
      prismaService.skill.findUnique.mockResolvedValue(mockSkills[0]);

      const result = await service.findBySlug('present_perfect');

      expect(prismaService.skill.findUnique).toHaveBeenCalledWith({
        where: { slug: 'present_perfect' },
      });
      expect(result).toEqual(mockSkills[0]);
    });

    it('should return null when skill does not exist', async () => {
      prismaService.skill.findUnique.mockResolvedValue(null);

      const result = await service.findBySlug('non_existent');

      expect(prismaService.skill.findUnique).toHaveBeenCalledWith({
        where: { slug: 'non_existent' },
      });
      expect(result).toBeNull();
    });
  });
});

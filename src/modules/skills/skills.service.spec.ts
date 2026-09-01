import { Test, TestingModule } from '@nestjs/testing';
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
      cefr: 'B1',
      parentId: null,
    },
    {
      id: '665f1b2e3333333333333333',
      slug: 'first_conditional',
      name: 'First Conditional',
      category: 'conditionals',
      cefr: 'A2',
      parentId: null,
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

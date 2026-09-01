import { Test, TestingModule } from '@nestjs/testing';
import { SkillsService } from './skills.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SkillsService', () => {
  let service: SkillsService;
  let prismaService: {
    skill: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    const mockPrismaService = {
      skill: {
        findUnique: jest.fn(),
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

  describe('findBySlug', () => {
    it('should query prisma.skill.findUnique with the given slug', async () => {
      const mockSkill = {
        id: '665f1b2e2222222222222222',
        slug: 'present_perfect',
        name: 'Present Perfect',
        category: 'verb_tenses',
        cefr: 'B1',
        parentId: null,
      };

      prismaService.skill.findUnique.mockResolvedValue(mockSkill);

      const result = await service.findBySlug('present_perfect');

      expect(prismaService.skill.findUnique).toHaveBeenCalledWith({
        where: { slug: 'present_perfect' },
      });
      expect(result).toEqual(mockSkill);
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

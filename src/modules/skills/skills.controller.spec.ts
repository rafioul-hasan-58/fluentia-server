/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';

describe('SkillsController', () => {
  let controller: SkillsController;
  let skillsService: jest.Mocked<SkillsService>;

  const mockSkills = [
    {
      id: '665f1b2e2222222222222222',
      slug: 'present_perfect',
      name: 'Present Perfect',
      category: 'verb_tenses',
      cefr: 'B1',
      parentId: null,
    },
  ];

  beforeEach(async () => {
    const mockSkillsService = {
      findAll: jest.fn(),
      findBySlug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [{ provide: SkillsService, useValue: mockSkillsService }],
    }).compile();

    controller = module.get<SkillsController>(SkillsController);
    skillsService = module.get(SkillsService);
  });

  describe('findAll', () => {
    it('should return list of skills', async () => {
      skillsService.findAll.mockResolvedValue(mockSkills);

      const result = await controller.findAll({});

      expect(skillsService.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockSkills);
    });
  });

  describe('findBySlug', () => {
    it('should return a skill if found', async () => {
      skillsService.findBySlug.mockResolvedValue(mockSkills[0]);

      const result = await controller.findBySlug('present_perfect');

      expect(skillsService.findBySlug).toHaveBeenCalledWith('present_perfect');
      expect(result).toEqual(mockSkills[0]);
    });

    it('should throw NotFoundException if skill not found', async () => {
      skillsService.findBySlug.mockResolvedValue(null);

      await expect(controller.findBySlug('unknown_slug')).rejects.toThrow(
        NotFoundException,
      );
      expect(skillsService.findBySlug).toHaveBeenCalledWith('unknown_slug');
    });
  });
});

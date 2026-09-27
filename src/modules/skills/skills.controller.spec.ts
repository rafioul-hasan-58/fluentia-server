/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, NotFoundException } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { SkillsController } from './skills.controller';
import { SkillsService } from './skills.service';
import { SkillCategoryDto } from './dto/skill-response.dto';

describe('SkillsController', () => {
  let app: INestApplication<App>;
  let controller: SkillsController;
  let skillsService: jest.Mocked<SkillsService>;

  const mockSingleSkill = {
    id: '665f1b2e2222222222222222',
    slug: 'present_perfect',
    name: 'Present Perfect',
    category: 'verb',
    cefr: 'B1',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSkillTree: SkillCategoryDto[] = [
    {
      slug: 'verb',
      name: 'Verb',
      category: 'verb',
      children: [
        {
          slug: 'present_perfect',
          name: 'Present Perfect',
          cefr: 'B1',
        },
        {
          slug: 'past_simple',
          name: 'Past Simple',
          cefr: 'A2',
        },
      ],
    },
  ];

  beforeEach(async () => {
    const mockSkillsService = {
      getSkillTree: jest.fn(),
      findAll: jest.fn(),
      findBySlug: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [{ provide: SkillsService, useValue: mockSkillsService }],
    }).compile();

    controller = module.get<SkillsController>(SkillsController);
    skillsService = module.get(SkillsService);

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('getSkillTree', () => {
    it('should return nested skill tree from service', async () => {
      skillsService.getSkillTree.mockResolvedValue(mockSkillTree);

      const result = await controller.getSkillTree();

      expect(skillsService.getSkillTree).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSkillTree);
    });

    it('GET /skills returns 200 with Cache-Control header and no auth required', async () => {
      skillsService.getSkillTree.mockResolvedValue(mockSkillTree);

      const response = await request(app.getHttpServer())
        .get('/skills')
        .expect(200);

      expect(response.headers['cache-control']).toBe('public, max-age=3600');
      expect(response.body).toEqual(mockSkillTree);
    });
  });

  describe('findBySlug', () => {
    it('should return a skill if found', async () => {
      skillsService.findBySlug.mockResolvedValue(mockSingleSkill);

      const result = await controller.findBySlug('present_perfect');

      expect(skillsService.findBySlug).toHaveBeenCalledWith('present_perfect');
      expect(result).toEqual(mockSingleSkill);
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

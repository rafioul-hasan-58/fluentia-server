/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { BadGatewayException, NotFoundException } from '@nestjs/common';
import { GrammarService } from './grammar.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SkillsService } from '../skills/skills.service';
import { AiService } from '../ai/ai.service';
import { Lesson } from '../ai/schemas/lesson.schema';
import { AiServiceError, AiValidationError } from '../ai/errors/ai.errors';

describe('GrammarService', () => {
  let service: GrammarService;
  let skillsService: jest.Mocked<SkillsService>;
  let aiService: jest.Mocked<AiService>;
  let prismaService: {
    learningSession: {
      create: jest.Mock;
    };
  };

  const mockSkill = {
    id: '665f1b2e2222222222222222',
    slug: 'present_perfect',
    name: 'Present Perfect',
    category: 'verb_tenses',
    cefr: 'B1',
    parentId: null,
  };

  const mockLesson: Lesson = {
    title: 'Present Perfect',
    rule: 'Subject + have/has + past participle',
    examples: [
      { sentence: 'I have visited London.', note: 'life experience' },
      {
        sentence: 'She has finished her homework.',
        note: 'recent completed action',
      },
    ],
    commonMistakes: [
      'Using the past simple form instead of the past participle after have/has',
    ],
  };

  beforeEach(async () => {
    const mockSkillsService = {
      findBySlug: jest.fn(),
    };

    const mockAiService = {
      generateLesson: jest.fn(),
    };

    const mockPrismaService = {
      learningSession: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrammarService,
        { provide: SkillsService, useValue: mockSkillsService },
        { provide: AiService, useValue: mockAiService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GrammarService>(GrammarService);
    skillsService = module.get(SkillsService);
    aiService = module.get(AiService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('teach', () => {
    const userId = '665f1b2e1111111111111111';
    const dto = {
      skillSlug: 'present_perfect',
      userPrompt: 'I keep mixing up have vs has',
    };

    it('(a) should throw NotFoundException when skillSlug does not match any skill', async () => {
      skillsService.findBySlug.mockResolvedValue(null);

      await expect(
        service.teach({ skillSlug: 'unknown_slug' }, userId),
      ).rejects.toThrow(NotFoundException);

      expect(skillsService.findBySlug).toHaveBeenCalledWith('unknown_slug');
      expect(aiService.generateLesson).not.toHaveBeenCalled();
      expect(prismaService.learningSession.create).not.toHaveBeenCalled();
    });

    it('(b) should throw BadGatewayException when AiService throws AiValidationError', async () => {
      skillsService.findBySlug.mockResolvedValue(mockSkill);
      aiService.generateLesson.mockRejectedValue(
        new AiValidationError('AI lesson response failed schema validation'),
      );

      await expect(service.teach(dto, userId)).rejects.toThrow(
        BadGatewayException,
      );

      expect(skillsService.findBySlug).toHaveBeenCalledWith(dto.skillSlug);
      expect(aiService.generateLesson).toHaveBeenCalledWith(
        mockSkill.name,
        dto.userPrompt,
      );
      expect(prismaService.learningSession.create).not.toHaveBeenCalled();
    });

    it('(b) should throw BadGatewayException when AiService throws AiServiceError', async () => {
      skillsService.findBySlug.mockResolvedValue(mockSkill);
      aiService.generateLesson.mockRejectedValue(
        new AiServiceError('OpenAI network failure'),
      );

      await expect(service.teach(dto, userId)).rejects.toThrow(
        BadGatewayException,
      );

      expect(skillsService.findBySlug).toHaveBeenCalledWith(dto.skillSlug);
      expect(aiService.generateLesson).toHaveBeenCalledWith(
        mockSkill.name,
        dto.userPrompt,
      );
      expect(prismaService.learningSession.create).not.toHaveBeenCalled();
    });

    it('(c) on success it persists a learning session and returns the correct response shape', async () => {
      const mockSession = {
        id: '665f1b2e3333333333333333',
        userId,
        skillId: mockSkill.id,
        rawInput: dto.userPrompt,
        diagnosis: null,
        status: 'teaching',
        createdAt: new Date(),
      };

      skillsService.findBySlug.mockResolvedValue(mockSkill);
      aiService.generateLesson.mockResolvedValue(mockLesson);
      prismaService.learningSession.create.mockResolvedValue(mockSession);

      const result = await service.teach(dto, userId);

      expect(skillsService.findBySlug).toHaveBeenCalledWith(dto.skillSlug);
      expect(aiService.generateLesson).toHaveBeenCalledWith(
        mockSkill.name,
        dto.userPrompt,
      );
      expect(prismaService.learningSession.create).toHaveBeenCalledWith({
        data: {
          userId,
          skillId: mockSkill.id,
          rawInput: dto.userPrompt,
          status: 'teaching',
        },
      });

      expect(result).toEqual({
        sessionId: mockSession.id,
        skill: {
          slug: mockSkill.slug,
          name: mockSkill.name,
        },
        lesson: mockLesson,
      });
    });
  });
});

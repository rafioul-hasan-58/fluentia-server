/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { GrammarController } from './grammar.controller';
import { GrammarService } from './grammar.service';

describe('GrammarController', () => {
  let controller: GrammarController;
  let grammarService: jest.Mocked<GrammarService>;

  beforeEach(async () => {
    const mockGrammarService = {
      teach: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrammarController],
      providers: [{ provide: GrammarService, useValue: mockGrammarService }],
    }).compile();

    controller = module.get<GrammarController>(GrammarController);
    grammarService = module.get(GrammarService);
  });

  it('should call grammarService.teach with dto and userId', async () => {
    const dto = {
      skillSlug: 'present_perfect',
      userPrompt: 'have vs has',
    };
    const userId = '665f1b2e1111111111111111';
    const mockResponse = {
      sessionId: '665f1b2e3333333333333333',
      skill: {
        slug: 'present_perfect',
        name: 'Present Perfect',
      },
      lesson: {
        title: 'Present Perfect',
        rule: 'Subject + have/has + past participle',
        examples: [
          { sentence: 'I have visited London.', note: 'life experience' },
          {
            sentence: 'She has finished homework.',
            note: 'recent completed action',
          },
        ],
        commonMistakes: ['Mistake 1'],
      },
    };

    grammarService.teach.mockResolvedValue(mockResponse);

    const result = await controller.teach(dto, userId);

    expect(grammarService.teach).toHaveBeenCalledWith(dto, userId);
    expect(result).toEqual(mockResponse);
  });
});

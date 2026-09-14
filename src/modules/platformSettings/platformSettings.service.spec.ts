import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PlatformSettingsService } from './platformSettings.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PlatformSettingsService', () => {
  let service: PlatformSettingsService;
  let prisma: any;
  let configService: any;

  const mockSetting = {
    id: 'setting-123',
    activeProvider: 'openai',
    activeModel: 'gpt-4o-mini',
    openaiApiKey: 'sk-proj-1234567890abcdef',
    geminiApiKey: 'AIzaSy1234567890abcdef',
    grokApiKey: null,
    deepseekApiKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      platformSetting: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'OPENAI_API_KEY') return 'sk-proj-env-key';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformSettingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<PlatformSettingsService>(PlatformSettingsService);
  });

  it('should return existing settings from DB', async () => {
    prisma.platformSetting.findFirst.mockResolvedValue(mockSetting);

    const setting = await service.getOrCreateSettings();
    expect(setting.activeProvider).toBe('openai');
    expect(prisma.platformSetting.findFirst).toHaveBeenCalled();
  });

  it('should create default settings when none exist', async () => {
    prisma.platformSetting.findFirst.mockResolvedValue(null);
    prisma.platformSetting.create.mockResolvedValue(mockSetting);

    const setting = await service.getOrCreateSettings();
    expect(prisma.platformSetting.create).toHaveBeenCalled();
    expect(setting.activeProvider).toBe('openai');
  });

  it('should return masked keys in public settings', async () => {
    prisma.platformSetting.findFirst.mockResolvedValue(mockSetting);

    const publicSettings = await service.getPublicSettings();
    expect(publicSettings.activeProvider).toBe('openai');
    expect(publicSettings.openaiApiKeyMasked).toContain('sk-proj...');
    expect(publicSettings.isOpenaiConfigured).toBe(true);
    expect(publicSettings.isGeminiConfigured).toBe(true);
    expect(publicSettings.isGrokConfigured).toBe(false);
  });

  it('should update active provider, model, and keys', async () => {
    prisma.platformSetting.findFirst.mockResolvedValue(mockSetting);
    const updatedSetting = {
      ...mockSetting,
      activeProvider: 'gemini',
      activeModel: 'gemini-2.5-flash',
    };
    prisma.platformSetting.update.mockResolvedValue(updatedSetting);

    const result = await service.updateSettings({
      activeProvider: 'gemini',
      activeModel: 'gemini-2.5-flash',
    });

    expect(prisma.platformSetting.update).toHaveBeenCalledWith({
      where: { id: mockSetting.id },
      data: {
        activeProvider: 'gemini',
        activeModel: 'gemini-2.5-flash',
      },
    });
    expect(result.activeProvider).toBe('gemini');
    expect(result.activeModel).toBe('gemini-2.5-flash');
  });

  it('should resolve active AI config correctly for active provider', async () => {
    prisma.platformSetting.findFirst.mockResolvedValue({
      ...mockSetting,
      activeProvider: 'gemini',
      activeModel: null,
    });

    const aiConfig = await service.getActiveAiConfig();
    expect(aiConfig.provider).toBe('gemini');
    expect(aiConfig.model).toBe('gemini-2.5-flash');
    expect(aiConfig.apiKey).toBe('AIzaSy1234567890abcdef');
    expect(aiConfig.baseURL).toContain('generativelanguage.googleapis.com');
  });
});

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlatformSetting, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EnvConfig } from '../../config/env.schema';
import {
  SupportedAiProvider,
  UpdatePlatformSettingDto,
} from './dto/update-platform-setting.dto';
import * as fs from 'fs';
import * as path from 'path';

export const PROVIDER_DEFAULT_MODELS: Record<SupportedAiProvider, string> = {
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.5-flash',
  grok: 'grok-2-latest',
  deepseek: 'deepseek-chat',
};

export const PROVIDER_BASE_URLS: Record<
  SupportedAiProvider,
  string | undefined
> = {
  openai: undefined, // default https://api.openai.com/v1
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  grok: 'https://api.x.ai/v1',
  deepseek: 'https://api.deepseek.com',
};

export interface ActiveAiConfig {
  provider: SupportedAiProvider;
  model: string;
  apiKey: string;
  baseURL?: string;
}

export interface PublicPlatformSettings {
  id: string;
  activeProvider: SupportedAiProvider;
  activeModel: string;
  openaiApiKeyMasked: string | null;
  isOpenaiConfigured: boolean;
  geminiApiKeyMasked: string | null;
  isGeminiConfigured: boolean;
  grokApiKeyMasked: string | null;
  isGrokConfigured: boolean;
  deepseekApiKeyMasked: string | null;
  isDeepseekConfigured: boolean;
  updatedAt: Date;
}

@Injectable()
export class PlatformSettingsService implements OnModuleInit {
  private readonly logger = new Logger(PlatformSettingsService.name);
  private cachedSettings: PlatformSetting | null = null;
  private cacheExpiresAt = 0;
  private readonly CACHE_TTL_MS = 30_000; // 30 seconds cache

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  async onModuleInit() {
    try {
      await this.getOrCreateSettings();
      this.logger.log('Platform settings initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize platform settings: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Retrieves the singleton platform setting record or creates a default one.
   */
  async getOrCreateSettings(): Promise<PlatformSetting> {
    const now = Date.now();
    if (this.cachedSettings && now < this.cacheExpiresAt) {
      return this.cachedSettings;
    }

    let setting = await this.prisma.platformSetting.findFirst();

    if (!setting) {
      // Look for fallback keys from env or key files
      const envOpenAiKey =
        this.configService.get('OPENAI_API_KEY', { infer: true }) ||
        process.env.OPENAI_API_KEY ||
        process.env.OPEN_AI_KEY ||
        null;

      let envGeminiKey =
        this.configService.get('GEMINI_API_KEY', { infer: true }) ||
        process.env.GEMINI_API_KEY ||
        null;

      // Check gemini-keys.txt in root if env is not set
      if (!envGeminiKey) {
        try {
          const geminiKeysFile = path.resolve(process.cwd(), 'gemini-keys.txt');
          if (fs.existsSync(geminiKeysFile)) {
            const lines = fs
              .readFileSync(geminiKeysFile, 'utf8')
              .split('\n')
              .map((l) => l.trim())
              .filter((l) => l && !l.startsWith('#') && l.startsWith('AIzaSy'));
            if (lines.length > 0) {
              envGeminiKey = lines[0];
            }
          }
        } catch {
          // ignore
        }
      }

      const envGrokKey =
        this.configService.get('GROK_API_KEY', { infer: true }) ||
        process.env.GROK_API_KEY ||
        process.env.XAI_API_KEY ||
        null;

      const envDeepseekKey =
        this.configService.get('DEEPSEEK_API_KEY', { infer: true }) ||
        process.env.DEEPSEEK_API_KEY ||
        null;

      const envProvider = (
        process.env.AI_PROVIDER || 'openai'
      ).toLowerCase() as SupportedAiProvider;
      const validProvider: SupportedAiProvider = [
        'openai',
        'gemini',
        'grok',
        'deepseek',
      ].includes(envProvider)
        ? envProvider
        : 'openai';

      setting = await this.prisma.platformSetting.create({
        data: {
          activeProvider: validProvider,
          activeModel:
            process.env.AI_MODEL || PROVIDER_DEFAULT_MODELS[validProvider],
          openaiApiKey: envOpenAiKey,
          geminiApiKey: envGeminiKey,
          grokApiKey: envGrokKey,
          deepseekApiKey: envDeepseekKey,
        },
      });

      this.logger.log(
        `Created initial PlatformSetting with provider: ${setting.activeProvider}`,
      );
    }

    this.cachedSettings = setting;
    this.cacheExpiresAt = Date.now() + this.CACHE_TTL_MS;
    return setting;
  }

  /**
   * Updates platform setting document.
   */
  async updateSettings(
    dto: UpdatePlatformSettingDto,
  ): Promise<PublicPlatformSettings> {
    const existing = await this.getOrCreateSettings();

    const openaiApiKey = dto.openaiApiKey ?? dto.openAi;
    const geminiApiKey = dto.geminiApiKey ?? dto.gemini;
    const grokApiKey = dto.grokApiKey ?? dto.grok;
    const deepseekApiKey = dto.deepseekApiKey ?? dto.deepseek;

    const dataToUpdate: Prisma.PlatformSettingUpdateInput = {};

    if (dto.activeProvider !== undefined) {
      dataToUpdate.activeProvider = dto.activeProvider;
    }
    if (dto.activeModel !== undefined) {
      dataToUpdate.activeModel = dto.activeModel.trim() || null;
    }
    if (openaiApiKey !== undefined) {
      dataToUpdate.openaiApiKey = openaiApiKey.trim() || null;
    }
    if (geminiApiKey !== undefined) {
      dataToUpdate.geminiApiKey = geminiApiKey.trim() || null;
    }
    if (grokApiKey !== undefined) {
      dataToUpdate.grokApiKey = grokApiKey.trim() || null;
    }
    if (deepseekApiKey !== undefined) {
      dataToUpdate.deepseekApiKey = deepseekApiKey.trim() || null;
    }

    const updated = await this.prisma.platformSetting.update({
      where: { id: existing.id },
      data: dataToUpdate,
    });

    // Invalidate cache immediately
    this.cachedSettings = updated;
    this.cacheExpiresAt = Date.now() + this.CACHE_TTL_MS;

    this.logger.log(
      `Platform settings updated. Active provider: ${updated.activeProvider}, model: ${updated.activeModel || '(default)'}`,
    );

    return this.formatPublicSettings(updated);
  }

  /**
   * Returns sanitized public representation with masked keys.
   */
  async getPublicSettings(): Promise<PublicPlatformSettings> {
    const setting = await this.getOrCreateSettings();
    return this.formatPublicSettings(setting);
  }

  /**
   * Resolves the current active AI configuration ready for API calls.
   */
  async getActiveAiConfig(): Promise<ActiveAiConfig> {
    const setting = await this.getOrCreateSettings();
    const provider = (setting.activeProvider?.toLowerCase() ||
      'openai') as SupportedAiProvider;

    const model =
      setting.activeModel?.trim() ||
      PROVIDER_DEFAULT_MODELS[provider] ||
      'gpt-4o-mini';

    let apiKey = '';
    switch (provider) {
      case 'openai':
        apiKey =
          setting.openaiApiKey ||
          process.env.OPENAI_API_KEY ||
          process.env.OPEN_AI_KEY ||
          '';
        break;
      case 'gemini':
        apiKey = setting.geminiApiKey || process.env.GEMINI_API_KEY || '';
        break;
      case 'grok':
        apiKey =
          setting.grokApiKey ||
          process.env.GROK_API_KEY ||
          process.env.XAI_API_KEY ||
          '';
        break;
      case 'deepseek':
        apiKey = setting.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '';
        break;
    }

    return {
      provider,
      model,
      apiKey,
      baseURL: PROVIDER_BASE_URLS[provider],
    };
  }

  /**
   * Helper to format public platform settings.
   */
  private formatPublicSettings(
    setting: PlatformSetting,
  ): PublicPlatformSettings {
    const provider = (setting.activeProvider ||
      'openai') as SupportedAiProvider;
    const effectiveModel =
      setting.activeModel?.trim() || PROVIDER_DEFAULT_MODELS[provider];

    const openaiKey =
      setting.openaiApiKey ||
      process.env.OPENAI_API_KEY ||
      process.env.OPEN_AI_KEY;
    const geminiKey = setting.geminiApiKey || process.env.GEMINI_API_KEY;
    const grokKey =
      setting.grokApiKey || process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    const deepseekKey = setting.deepseekApiKey || process.env.DEEPSEEK_API_KEY;

    return {
      id: setting.id,
      activeProvider: provider,
      activeModel: effectiveModel,
      openaiApiKeyMasked: this.maskApiKey(openaiKey),
      isOpenaiConfigured: Boolean(openaiKey),
      geminiApiKeyMasked: this.maskApiKey(geminiKey),
      isGeminiConfigured: Boolean(geminiKey),
      grokApiKeyMasked: this.maskApiKey(grokKey),
      isGrokConfigured: Boolean(grokKey),
      deepseekApiKeyMasked: this.maskApiKey(deepseekKey),
      isDeepseekConfigured: Boolean(deepseekKey),
      updatedAt: setting.updatedAt,
    };
  }

  /**
   * Masks an API key for safe UI inspection (e.g. sk-proj-...xxxx).
   */
  private maskApiKey(key?: string | null): string | null {
    if (!key) return null;
    const trimmed = key.trim();
    if (trimmed.length <= 8) return '****';
    const start = trimmed.slice(0, 7);
    const end = trimmed.slice(-4);
    return `${start}...${end}`;
  }
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';

export const SUPPORTED_AI_PROVIDERS = [
  'openai',
  'gemini',
  'grok',
  'deepseek',
] as const;

export type SupportedAiProvider = (typeof SUPPORTED_AI_PROVIDERS)[number];

export class UpdatePlatformSettingDto {
  @ApiPropertyOptional({
    description: 'Active AI Provider',
    enum: SUPPORTED_AI_PROVIDERS,
    example: 'gemini',
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsIn(SUPPORTED_AI_PROVIDERS, {
    message: `activeProvider must be one of: ${SUPPORTED_AI_PROVIDERS.join(', ')}`,
  })
  activeProvider?: SupportedAiProvider;

  @ApiPropertyOptional({
    description:
      'Model name override (e.g. gpt-4o-mini, gemini-2.5-flash, grok-2-latest, deepseek-chat)',
    example: 'gemini-2.5-flash',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  activeModel?: string;

  @ApiPropertyOptional({
    description: 'OpenAI API key',
    example: 'sk-proj-...',
  })
  @IsOptional()
  @IsString()
  openaiApiKey?: string;

  // Aliases for convenience
  @ApiPropertyOptional({ description: 'Alias for openaiApiKey' })
  @IsOptional()
  @IsString()
  openAi?: string;

  @ApiPropertyOptional({
    description: 'Google Gemini API key',
    example: 'AIzaSy...',
  })
  @IsOptional()
  @IsString()
  geminiApiKey?: string;

  @ApiPropertyOptional({ description: 'Alias for geminiApiKey' })
  @IsOptional()
  @IsString()
  gemini?: string;

  @ApiPropertyOptional({
    description: 'xAI Grok API key',
    example: 'xai-...',
  })
  @IsOptional()
  @IsString()
  grokApiKey?: string;

  @ApiPropertyOptional({ description: 'Alias for grokApiKey' })
  @IsOptional()
  @IsString()
  grok?: string;

  @ApiPropertyOptional({
    description: 'DeepSeek API key',
    example: 'sk-...',
  })
  @IsOptional()
  @IsString()
  deepseekApiKey?: string;

  @ApiPropertyOptional({ description: 'Alias for deepseekApiKey' })
  @IsOptional()
  @IsString()
  deepseek?: string;
}

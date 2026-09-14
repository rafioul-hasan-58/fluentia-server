import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  PlatformSettingsService,
  PROVIDER_DEFAULT_MODELS,
} from './platformSettings.service';
import {
  SUPPORTED_AI_PROVIDERS,
  UpdatePlatformSettingDto,
} from './dto/update-platform-setting.dto';

@ApiTags('Platform Settings')
@Controller('platform-settings')
export class PlatformSettingsController {
  constructor(
    private readonly platformSettingsService: PlatformSettingsService,
  ) { }

  @Get()
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current AI and platform configuration (Admin only)',
    description:
      'Retrieves active AI model, provider, and masked API key statuses for OpenAI, Grok, Gemini, and DeepSeek.',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform settings retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  async getSettings() {
    return this.platformSettingsService.getPublicSettings();
  }

  @Patch()
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update active AI model, provider, and API keys (Admin only)',
    description:
      'Allows changing the active LLM provider (openai, gemini, grok, deepseek), overriding model names, and storing/updating provider API keys.',
  })
  @ApiResponse({
    status: 200,
    description: 'Platform settings updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  async updateSettings(@Body() dto: UpdatePlatformSettingDto) {
    return this.platformSettingsService.updateSettings(dto);
  }

  @Get('providers')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List supported AI providers and default models (Admin only)',
  })
  getSupportedProviders() {
    return {
      providers: SUPPORTED_AI_PROVIDERS,
      defaultModels: PROVIDER_DEFAULT_MODELS,
    };
  }
}

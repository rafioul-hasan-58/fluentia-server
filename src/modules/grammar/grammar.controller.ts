import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GrammarService, TeachResponse } from './grammar.service';
import { TeachRequestDto } from './dto/teach-request.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Grammar')
@Controller('grammar')
export class GrammarController {
  constructor(private readonly grammarService: GrammarService) {}

  @Post('teach')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate an AI-powered lesson for a grammar skill',
    description:
      'Given a valid skillSlug and optional user free-text query, generates a structured grammar explanation with contrasting examples and common mistakes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lesson generated successfully.',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request — Missing or invalid skillSlug, or userPrompt exceeds 500 characters.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found — The skillSlug does not match any existing Skill.',
  })
  @ApiResponse({
    status: 502,
    description:
      'Bad Gateway — AI service failed to respond or generate valid schema output.',
  })
  async teach(
    @Body() dto: TeachRequestDto,
    @CurrentUser('id') userId: string,
  ): Promise<TeachResponse> {
    return this.grammarService.teach(dto, userId);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { VocabularyService } from './vocabulary.service';
import { GenerateVocabularyDto, GetVocabulariesQueryDto } from './dto';

@ApiTags('Vocabulary')
@Controller('vocabularies')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lookup or generate vocabulary metadata via AI',
    description:
      'Searches the global dictionary catalog by word. If found, returns the existing record. If not found, calls the AI service to generate structured definitions, Bangla translation, collocations, sentences, and Oxford/Cambridge CEFR level, then stores it in the shared catalog.',
  })
  @ApiResponse({
    status: 200,
    description: 'Vocabulary retrieved or generated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Missing or invalid word input.',
  })
  @ApiResponse({
    status: 502,
    description:
      'Bad Gateway — AI service failure during vocabulary generation.',
  })
  async generate(@Body() dto: GenerateVocabularyDto) {
    const result = await this.vocabularyService.getOrGenerateVocabulary(dto);
    return result;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search and browse global vocabularies',
    description:
      'Returns a paginated list of shared vocabulary words with optional search and filters for part of speech and CEFR level.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of vocabularies retrieved successfully.',
  })
  async findAll(@Query() query: GetVocabulariesQueryDto) {
    const data = await this.vocabularyService.findAllVocabularies(query);
    return {
      message: 'Vocabularies retrieved successfully.',
      ...data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a single vocabulary by ID',
    description:
      'Retrieves the full dictionary data and metadata for a specific global vocabulary record.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the vocabulary',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Vocabulary retrieved successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid ID format.',
  })
  @ApiResponse({
    status: 404,
    description: 'Vocabulary not found.',
  })
  async findOne(@Param('id') id: string) {
    const data = await this.vocabularyService.findVocabularyById(id);
    return {
      message: 'Vocabulary retrieved successfully.',
      data,
    };
  }
}

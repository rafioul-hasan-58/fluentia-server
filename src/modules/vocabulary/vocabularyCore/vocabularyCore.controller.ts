import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { VocabularyCoreService } from './vocabularyCore.service';
import { GenerateVocabularyDto, GetVocabulariesQueryDto } from './dto';

@ApiTags('Vocabulary')
@Controller('vocabularies')
export class VocabularyCoreController {
  constructor(private readonly vocabularyCoreService: VocabularyCoreService) { }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lookup or generate vocabulary word via AI',
    description:
      'Checks shared vocabulary collection for exact match. If found, returns existing record. Otherwise, invokes Gemini AI to generate full vocabulary details and persists it to the shared collection.',
  })
  @ApiResponse({
    status: 200,
    description: 'Vocabulary retrieved or generated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Missing or invalid word.',
  })
  async generate(@Body() dto: GenerateVocabularyDto) {
    return this.vocabularyCoreService.getOrGenerateVocabulary(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all shared vocabularies with pagination and filters',
    description:
      'Returns a paginated list of shared vocabulary words with optional search, part-of-speech, and CEFR level filters.',
  })
  @ApiResponse({
    status: 200,
    description: 'Vocabularies retrieved successfully.',
  })
  async findAll(@Query() query: GetVocabulariesQueryDto) {
    const data = await this.vocabularyCoreService.findAllVocabularies(query);
    return {
      message: 'Vocabularies retrieved successfully.',
      ...data,
    };
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a single shared vocabulary item by ID',
    description:
      'Retrieves full dictionary definition, pronunciation, word family, collocations, and sentences for a shared word.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the Vocabulary record',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Vocabulary retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Vocabulary not found.',
  })
  async findOne(@Param('id') id: string) {
    const data = await this.vocabularyCoreService.findVocabularyById(id);
    return {
      message: 'Vocabulary retrieved successfully.',
      data,
    };
  }
}

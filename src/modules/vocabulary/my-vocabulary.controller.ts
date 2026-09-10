import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
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
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { VocabularyService } from './vocabulary.service';
import {
  AddMyVocabularyDto,
  GetMyVocabulariesQueryDto,
  UpdateMyVocabularyDto,
} from './dto';

@ApiTags('My Vocabulary')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('my-vocabularies')
export class MyVocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a vocabulary word to personal collection',
    description:
      'Creates a personal user-scoped link to a global vocabulary item with default LEARNING status and initial mastery score.',
  })
  @ApiResponse({
    status: 201,
    description: 'Vocabulary added to personal collection successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid wordId format.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Global vocabulary item not found.',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict — Vocabulary is already in your personal collection.',
  })
  async addToMyVocabulary(
    @CurrentUser('id') userId: string,
    @Body() dto: AddMyVocabularyDto,
  ) {
    const data = await this.vocabularyService.addToMyVocabulary(userId, dto);
    return {
      message: 'Vocabulary added to your personal collection successfully.',
      data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all personal vocabularies for authenticated user',
    description:
      'Returns a paginated list of personal vocabulary items with filters for status, favorite, part of speech, CEFR level, and search keyword.',
  })
  @ApiResponse({
    status: 200,
    description: 'Personal vocabularies retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  async findMyVocabularies(
    @CurrentUser('id') userId: string,
    @Query() query: GetMyVocabulariesQueryDto,
  ) {
    const data = await this.vocabularyService.findMyVocabularies(userId, query);
    return {
      message: 'Personal vocabularies retrieved successfully.',
      ...data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a single personal vocabulary item by ID',
    description:
      'Retrieves personal study notes, custom sentences, mastery score, status, and the underlying dictionary definition.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the MyVocabulary record',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Personal vocabulary retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Personal vocabulary item not found.',
  })
  async findMyVocabularyById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const data = await this.vocabularyService.findMyVocabularyById(userId, id);
    return {
      message: 'Personal vocabulary item retrieved successfully.',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update personal vocabulary notes, sentences, status, or mastery',
    description:
      'Updates personal fields (custom example sentences, study notes, mastery percentage, status, starred flag). Never modifies the global dictionary definition.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the MyVocabulary record',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Personal vocabulary updated successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Personal vocabulary item not found.',
  })
  async updateMyVocabulary(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMyVocabularyDto,
  ) {
    const data = await this.vocabularyService.updateMyVocabulary(
      userId,
      id,
      dto,
    );
    return {
      message: 'Personal vocabulary updated successfully.',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove vocabulary from personal collection',
    description:
      'Deletes the user-scoped personal record only. Does not delete the shared global vocabulary definition.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the MyVocabulary record',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Vocabulary removed from personal collection successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Personal vocabulary item not found.',
  })
  async removeFromMyVocabulary(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const result = await this.vocabularyService.removeFromMyVocabulary(
      userId,
      id,
    );
    return result;
  }
}

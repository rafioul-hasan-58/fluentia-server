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
import { AuthGuard } from '../../../common/guards/auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { MyVocabularyService } from './myVocabulary.service';
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
  constructor(private readonly myVocabularyService: MyVocabularyService) {}

  @Post('save')
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
    const data = await this.myVocabularyService.addToMyVocabulary(userId, dto);
    return {
      message: 'Vocabulary added to your personal collection successfully.',
      data,
    };
  }

  @Get('find-all')
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
    const { result, meta } = await this.myVocabularyService.findMyVocabularies(
      userId,
      query,
    );
    return {
      message: 'Personal vocabulary retrieved successfully!',
      meta,
      data: result,
    };
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get personal vocabulary vault statistics',
    description:
      'Returns aggregate counts for personal vocabulary vault: total words, favorite count, counts by status (LEARNING, LEARNED, MASTERED), counts by CEFR level (A1-C2), today words count, and mastered words with score 4 or better.',
  })
  @ApiResponse({
    status: 200,
    description: 'Personal vocabulary statistics retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  async getMyVocabularyStats(@CurrentUser('id') userId: string) {
    const data = await this.myVocabularyService.getVocabularyStats(userId);
    return {
      message: 'Personal vocabulary statistics retrieved successfully.',
      data,
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
    const data = await this.myVocabularyService.findMyVocabularyById(
      userId,
      id,
    );
    return {
      message: 'Personal vocabulary item retrieved successfully.',
      data,
    };
  }

  @Patch(':id/update')
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
    const data = await this.myVocabularyService.updateMyVocabulary(
      userId,
      id,
      dto,
    );
    return {
      message: 'Personal vocabulary updated successfully.',
      data,
    };
  }

  @Delete(':id/remove')
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
    const result = await this.myVocabularyService.removeFromMyVocabulary(
      userId,
      id,
    );
    return result;
  }
}

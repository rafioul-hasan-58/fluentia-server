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
import { VocabStoryService } from './vocabStory.service';
import {
  GenerateVocabStoryDto,
  GetVocabStoriesQueryDto,
  UpdateVocabStoryTitleDto,
} from './dto';

@ApiTags('Vocab Story')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('vocab-stories')
export class VocabStoryController {
  constructor(private readonly vocabStoryService: VocabStoryService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate a bilingual and full-English vocabulary story via AI',
    description:
      'Takes 5 or 10 vocabulary IDs and an optional context/theme. Generates a mixed Bangla-English story (where target words remain in English) and a full English story, validates that all selected vocabulary words are meaningfully used, and persists the story to the user collection.',
  })
  @ApiResponse({
    status: 201,
    description: 'Vocabulary story generated and saved successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Missing or invalid vocabulary IDs.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found — One or more requested vocabulary IDs not found.',
  })
  @ApiResponse({
    status: 502,
    description:
      'Bad Gateway — AI service failure during vocabulary story generation.',
  })
  async generate(
    @CurrentUser('id') userId: string,
    @Body() dto: GenerateVocabStoryDto,
  ) {
    const data = await this.vocabStoryService.generateStory(userId, dto);
    return {
      message: 'Vocabulary story generated successfully.',
      data,
    };
  }

  @Get('find-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all generated vocabulary stories for authenticated user',
    description:
      'Returns a paginated list of generated vocabulary stories with optional search.',
  })
  @ApiResponse({
    status: 200,
    description: 'Vocabulary stories retrieved successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  async findUserStories(
    @CurrentUser('id') userId: string,
    @Query() query: GetVocabStoriesQueryDto,
  ) {
    const { result, meta } = await this.vocabStoryService.findUserStories(
      userId,
      query,
    );
    return {
      message: 'Vocabulary stories retrieved successfully.',
      meta,
      data: result,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a single generated vocabulary story by ID',
    description:
      'Retrieves full bilingual and English story text and used vocabulary list for a specific story owned by the user.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the VocabStory record',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Vocabulary story retrieved successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid ID format.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Vocabulary story not found.',
  })
  async findUserStoryById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const data = await this.vocabStoryService.findUserStoryById(userId, id);
    return {
      message: 'Vocabulary story retrieved successfully.',
      data,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a generated vocabulary story',
    description:
      'Deletes a specific generated story owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the VocabStory record',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Vocabulary story deleted successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Vocabulary story not found.',
  })
  async deleteUserStory(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const result = await this.vocabStoryService.deleteUserStory(userId, id);
    return result;
  }

  @Patch(':id/title')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update vocabulary story title',
    description:
      'Updates the title of a specific vocabulary story owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the VocabStory record',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Vocabulary story title updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid ID format or empty title.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Vocabulary story not found.',
  })
  async updateStoryTitle(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVocabStoryTitleDto,
  ) {
    const data = await this.vocabStoryService.updateStoryTitle(
      userId,
      id,
      dto.title,
    );
    return {
      message: 'Vocabulary story title updated successfully.',
      data,
    };
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update vocabulary story',
    description:
      'Updates the title of a specific vocabulary story owned by the authenticated user.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the VocabStory record',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Vocabulary story title updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid ID format or empty title.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized.',
  })
  @ApiResponse({
    status: 404,
    description: 'Vocabulary story not found.',
  })
  async updateStory(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVocabStoryTitleDto,
  ) {
    return this.updateStoryTitle(userId, id, dto);
  }
}

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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { LevelTestQuestionsService } from './level-test-questions.service';
import { CreateLevelTestQuestionDto } from './dto/create-level-test-question.dto';
import { UpdateLevelTestQuestionDto } from './dto/update-level-test-question.dto';
import { GetLevelTestQuestionsQueryDto } from './dto/get-level-test-questions-query.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Level Test Questions')
@Controller('level-test-questions')
export class LevelTestQuestionsController {
  constructor(
    private readonly levelTestQuestionsService: LevelTestQuestionsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new level test question (Admin only)',
    description:
      'Creates an English placement test question with multiple choice options.',
  })
  @ApiResponse({
    status: 201,
    description: 'Level test question created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid input or invalid option setup.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  async create(@Body() dto: CreateLevelTestQuestionDto) {
    const data = await this.levelTestQuestionsService.create(dto);
    return {
      message: 'Level test question created successfully.',
      data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all level test questions with filtering & pagination',
    description:
      'Retrieves a list of level test questions filterable by CEFR level, section, difficulty, and search keywords.',
  })
  @ApiResponse({
    status: 200,
    description: 'Level test questions retrieved successfully.',
  })
  async findAll(@Query() query: GetLevelTestQuestionsQueryDto) {
    const result = await this.levelTestQuestionsService.findAll(query);
    return {
      message: 'Level test questions retrieved successfully.',
      ...result,
    };
  }

  @Get('test-set')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get placement test set for taking assessment',
    description:
      'Retrieves the question set for candidate assessment with options (excluding answers for security).',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 40,
    description: 'Number of test questions to fetch (default: 40)',
  })
  @ApiResponse({
    status: 200,
    description: 'Placement test set retrieved successfully.',
  })
  async getTestSet(@Query('limit') limit?: number) {
    const data = await this.levelTestQuestionsService.getTestSet(
      limit ? Number(limit) : 40,
    );
    return {
      message: 'Placement test set retrieved successfully.',
      count: data.length,
      data,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a single level test question by ID',
    description:
      'Retrieves full details and options of a level test question by its ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the question',
    example: '665f1b2e2222222222222222',
  })
  @ApiResponse({
    status: 200,
    description: 'Level test question retrieved successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid ID format.',
  })
  @ApiResponse({ status: 404, description: 'Question not found.' })
  async findOne(@Param('id') id: string) {
    const data = await this.levelTestQuestionsService.findById(id);
    return {
      message: 'Level test question retrieved successfully.',
      data,
    };
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update a level test question (Admin only)',
    description:
      'Updates attributes and/or options of an existing level test question.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the question to update',
    example: '665f1b2e2222222222222222',
  })
  @ApiResponse({
    status: 200,
    description: 'Level test question updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid input.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  @ApiResponse({ status: 404, description: 'Question not found.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLevelTestQuestionDto,
  ) {
    const data = await this.levelTestQuestionsService.update(id, dto);
    return {
      message: 'Level test question updated successfully.',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a level test question (Admin only)',
    description:
      'Deletes a level test question and cascade-deletes its associated options.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the question to delete',
    example: '665f1b2e2222222222222222',
  })
  @ApiResponse({
    status: 200,
    description: 'Level test question deleted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid ID format.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  @ApiResponse({ status: 404, description: 'Question not found.' })
  async remove(@Param('id') id: string) {
    const data = await this.levelTestQuestionsService.remove(id);
    return data;
  }
}

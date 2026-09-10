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
import { LevelTestQuestionsService } from './levelTest.service';
import {
  CreateLevelTestQuestionDto,
  UpdateLevelTestQuestionDto,
  GetLevelTestQuestionsQueryDto,
  SubmitLevelTestDto,
  GetRecentSubmissionsQueryDto,
  GetSubmissionsQueryDto,
  CreateLevelTestSetDto,
  UpdateLevelTestSetDto,
  GetLevelTestSetsQueryDto,
  ManageSetQuestionsDto,
} from './dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { OptionalAuthGuard } from '../../common/guards/optional-auth.guard';
import type { JwtPayload } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Level Test Questions')
@Controller('level-test-questions')
export class LevelTestQuestionsController {
  constructor(
    private readonly levelTestQuestionsService: LevelTestQuestionsService,
  ) {}

  @Post('submit')
  @UseGuards(OptionalAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Submit level test answers for AI-powered CEFR evaluation and learning roadmap',
    description:
      'Evaluates user-submitted answers against database questions/passages, leverages OpenAI for diagnostic strengths/weaknesses and personalized learning roadmap generation, and saves the attempt if authenticated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Level test submitted and analyzed successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Missing answers or invalid question IDs.',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found — Submitted questions do not exist in database.',
  })
  @ApiResponse({
    status: 502,
    description:
      'Bad Gateway — AI service failed to evaluate or return valid schema.',
  })
  async submit(
    @Body() dto: SubmitLevelTestDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    const data = await this.levelTestQuestionsService.submitAndAnalyze(
      dto,
      user?.id,
    );
    return {
      message: 'Placement test evaluated and analyzed successfully.',
      data,
    };
  }

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
  @ApiQuery({
    name: 'setId',
    required: false,
    example: '665f1b2e1111111111111111',
    description:
      'Optional ID of the specific LevelTestSet to fetch questions from',
  })
  @ApiResponse({
    status: 200,
    description: 'Placement test set retrieved successfully.',
  })
  async getTestSet(
    @Query('limit') limit?: number,
    @Query('setId') setId?: string,
  ) {
    const data = await this.levelTestQuestionsService.getTestSet(
      limit ? Number(limit) : 40,
      setId,
    );
    return {
      message: 'Placement test set retrieved successfully.',
      count: data.length,
      data,
    };
  }

  @Get('recent-submissions')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get recent placement test submissions for live feed dashboard',
    description:
      'Retrieves the latest placement test submissions with learner profile, CEFR rating, score, section breakdown, duration, and timestamp.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 5,
    description: 'Number of recent submissions to retrieve (default: 5)',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent placement test submissions retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  async getRecentSubmissions(@Query() query: GetRecentSubmissionsQueryDto) {
    const data = await this.levelTestQuestionsService.getRecentSubmissions(
      query?.limit,
    );
    return {
      message: 'Recent placement test submissions retrieved successfully.',
      count: data.length,
      data,
    };
  }

  @Get('submissions')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all placement test submissions with pagination & filters',
    description:
      'Retrieves paginated placement test submissions for admin dashboard with search by learner name/email and level filter.',
  })
  @ApiResponse({
    status: 200,
    description: 'Placement test submissions retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  async getSubmissions(@Query() query: GetSubmissionsQueryDto) {
    const result =
      await this.levelTestQuestionsService.getAllSubmissions(query);
    return {
      message: 'Placement test submissions retrieved successfully.',
      ...result,
    };
  }

  @Get('my-submissions')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get test submission history for currently logged-in student',
    description:
      'Retrieves list of placement test attempts completed by the authenticated learner.',
  })
  @ApiResponse({
    status: 200,
    description: 'Learner placement test history retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getMySubmissions(@CurrentUser() user: JwtPayload) {
    const data = await this.levelTestQuestionsService.getUserSubmissions(
      user.id,
    );
    return {
      message: 'Learner placement test history retrieved successfully.',
      count: data.length,
      data,
    };
  }

  @Get('submissions/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get detailed diagnostic report of a test attempt',
    description:
      'Retrieves the complete evaluation breakdown, question-by-question responses, and AI roadmap for a specific test attempt.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the test attempt',
    example: '665f1b2e2222222222222222',
  })
  @ApiResponse({
    status: 200,
    description: 'Placement test report retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — Not authorized to view this report.',
  })
  @ApiResponse({ status: 404, description: 'Test submission not found.' })
  async getSubmissionById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const data = await this.levelTestQuestionsService.getSubmissionById(
      id,
      user.id,
      user.role,
    );
    return {
      message: 'Placement test report retrieved successfully.',
      data,
    };
  }

  // LEVEL TEST SETS ENDPOINTS
  @Post('create-set')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new level test set (Admin only)',
    description:
      'Creates a new question set for level testing, optionally linking existing questions.',
  })
  @ApiResponse({
    status: 201,
    description: 'Level test set created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid input or set name is empty.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict — A set with this name already exists.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  async createSet(@Body() dto: CreateLevelTestSetDto) {
    const data = await this.levelTestQuestionsService.createSet(dto);
    return {
      message: 'Level test set created successfully.',
      data,
    };
  }

  @Get('sets/get-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all level test sets with pagination & search',
    description:
      'Retrieves a paginated list of test sets including question and attempt counts.',
  })
  @ApiResponse({
    status: 200,
    description: 'Level test sets retrieved successfully.',
  })
  async findAllSets(@Query() query: GetLevelTestSetsQueryDto) {
    const result = await this.levelTestQuestionsService.findAllSets(query);
    return {
      message: 'Level test sets retrieved successfully.',
      ...result,
    };
  }

  @Get('sets/get-single/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get level test set details with questions by ID',
    description:
      'Retrieves set metadata, question count, and all assigned questions with options.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the set',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Level test set retrieved successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid set ID format.',
  })
  @ApiResponse({ status: 404, description: 'Level test set not found.' })
  async findSetById(@Param('id') id: string) {
    const data = await this.levelTestQuestionsService.findSetById(id);
    return {
      message: 'Level test set retrieved successfully.',
      data,
    };
  }

  @Patch('sets/update/:id')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update level test set details (Admin only)',
    description: 'Updates set name, description, or active status.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the set to update',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Level test set updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid input or set name.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict — A set with this name already exists.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  @ApiResponse({ status: 404, description: 'Level test set not found.' })
  async updateSet(@Param('id') id: string, @Body() dto: UpdateLevelTestSetDto) {
    const data = await this.levelTestQuestionsService.updateSet(id, dto);
    return {
      message: 'Level test set updated successfully.',
      data,
    };
  }

  @Delete('sets/delete/:id')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a level test set (Admin only)',
    description:
      'Deletes a level test set and unlinks (setId: null) all questions belonging to it.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the set to delete',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Level test set deleted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid ID format.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  @ApiResponse({ status: 404, description: 'Level test set not found.' })
  async deleteSet(@Param('id') id: string) {
    const data = await this.levelTestQuestionsService.deleteSet(id);
    return data;
  }

  @Post('sets/:id/add-questions')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add question(s) to a level test set (Admin only)',
    description:
      'Assigns single or multiple questions in bulk to the specified test set.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the set',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions added to set successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid question IDs or no question provided.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  @ApiResponse({
    status: 404,
    description: 'Set or questions not found.',
  })
  async addQuestionsToSet(
    @Param('id') id: string,
    @Body() dto: ManageSetQuestionsDto,
  ) {
    const data = await this.levelTestQuestionsService.addQuestionsToSet(
      id,
      dto,
    );
    return data;
  }

  @Post('sets/:id/questions/remove')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove question(s) from a level test set via POST (Admin only)',
    description:
      'Unlinks single or multiple questions from the specified test set.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the set',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions removed from set successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid question IDs or no question provided.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  @ApiResponse({ status: 404, description: 'Set not found.' })
  async removeQuestionsFromSetPost(
    @Param('id') id: string,
    @Body() dto: ManageSetQuestionsDto,
  ) {
    const data = await this.levelTestQuestionsService.removeQuestionsFromSet(
      id,
      dto,
    );
    return data;
  }

  @Delete('sets/:id/questions')
  @UseGuards(AuthGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove question(s) from a level test set via DELETE (Admin only)',
    description:
      'Unlinks single or multiple questions from the specified test set.',
  })
  @ApiParam({
    name: 'id',
    description: 'MongoDB ObjectId of the set',
    example: '665f1b2e1111111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'Questions removed from set successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request — Invalid question IDs or no question provided.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin only.' })
  @ApiResponse({ status: 404, description: 'Set not found.' })
  async removeQuestionsFromSet(
    @Param('id') id: string,
    @Body() dto: ManageSetQuestionsDto,
  ) {
    const data = await this.levelTestQuestionsService.removeQuestionsFromSet(
      id,
      dto,
    );
    return data;
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

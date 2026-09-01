import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { GetSkillsQueryDto } from './dto/get-skills-query.dto';

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all grammar skills',
    description:
      'Retrieves the list of available grammar skills with optional filtering by category, CEFR level, or search keyword.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of skills retrieved successfully.',
  })
  async findAll(@Query() query: GetSkillsQueryDto) {
    return this.skillsService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get a single grammar skill by slug',
    description:
      'Retrieves metadata for a specific grammar skill by its unique slug.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Unique slug of the skill (e.g. present_perfect)',
    example: 'present_perfect',
  })
  @ApiResponse({
    status: 200,
    description: 'Skill retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Skill not found.',
  })
  async findBySlug(@Param('slug') slug: string) {
    const skill = await this.skillsService.findBySlug(slug);
    if (!skill) {
      throw new NotFoundException(`Skill with slug '${slug}' not found`);
    }
    return skill;
  }
}

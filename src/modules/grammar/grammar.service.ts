import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SkillsService } from '../skills/skills.service';
import { AiService } from '../ai/ai.service';
import { Lesson } from '../ai/schemas/lesson.schema';
import { AiServiceError, AiValidationError } from '../ai/errors/ai.errors';
import { TeachRequestDto } from './dto/teach-request.dto';

export interface TeachResponse {
  sessionId: string;
  skill: {
    slug: string;
    name: string;
  };
  lesson: Lesson;
}

@Injectable()
export class GrammarService {
  private readonly logger = new Logger(GrammarService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly skillsService: SkillsService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Orchestrates the grammar "teach" flow:
   * 1. Validates the skill exists in the database taxonomy.
   * 2. Requests an AI-generated, schema-validated lesson tailored to the learner's query.
   * 3. Persists a new LearningSession in MongoDB with status "teaching".
   * 4. Returns the sessionId, canonical skill metadata, and the structured lesson content.
   *
   * @param dto - Validated teach request containing `skillSlug` and optional `userPrompt`.
   * @param userId - Unique identifier of the user initiating the learning session.
   * @returns {@link TeachResponse} containing the session ID, skill metadata, and lesson.
   * @throws {NotFoundException} When the specified `skillSlug` does not match any skill in DB.
   * @throws {BadGatewayException} When the AI service fails or returns invalid schema after retry.
   */
  async teach(dto: TeachRequestDto, userId: string): Promise<TeachResponse> {
    // 1. Look up the skill in the database
    const skill = await this.skillsService.findBySlug(dto.skillSlug);
    if (!skill) {
      this.logger.warn(`Skill not found for slug: ${dto.skillSlug}`);
      throw new NotFoundException(
        `Skill with slug '${dto.skillSlug}' not found`,
      );
    }

    // 2. Call AI service to generate and validate lesson content
    let lesson: Lesson;
    try {
      lesson = await this.aiService.generateLesson(skill.name, dto.userPrompt);
    } catch (error) {
      if (
        error instanceof AiValidationError ||
        error instanceof AiServiceError
      ) {
        this.logger.error(
          `AI service failed during teach endpoint execution for skill "${skill.slug}": ${error.message}`,
          error.cause instanceof Error ? error.cause.stack : undefined,
        );
        throw new BadGatewayException(
          'Unable to generate lesson at this time. Please try again later.',
        );
      }
      throw error;
    }

    // 3. Persist a new LearningSession in MongoDB
    const session = await this.prisma.learningSession.create({
      data: {
        userId,
        skillId: skill.id,
        rawInput: dto.userPrompt,
        status: 'teaching',
      },
    });

    // 4. Return structured response
    return {
      sessionId: session.id,
      skill: {
        slug: skill.slug,
        name: skill.name,
      },
      lesson,
    };
  }
}

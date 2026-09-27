import { ApiProperty } from '@nestjs/swagger';

export class SubSkillDto {
  @ApiProperty({
    description: 'Unique slug of the sub-skill',
    example: 'present_perfect',
  })
  slug: string;

  @ApiProperty({
    description: 'Display name of the sub-skill',
    example: 'Present Perfect',
  })
  name: string;

  @ApiProperty({
    description: 'CEFR level of the sub-skill ("A1".."C2")',
    example: 'B1',
    nullable: true,
  })
  cefr: string | null;
}

export class SkillCategoryDto {
  @ApiProperty({
    description: 'Unique slug of the top-level parent category',
    example: 'verb',
  })
  slug: string;

  @ApiProperty({
    description: 'Display name of the parent category',
    example: 'Verb',
  })
  name: string;

  @ApiProperty({
    description: 'Category identifier shared with its children',
    example: 'verb',
  })
  category: string;

  @ApiProperty({
    description: 'Ordered list of child sub-skills',
    type: [SubSkillDto],
  })
  children: SubSkillDto[];
}

export type SkillTreeDto = SkillCategoryDto[];

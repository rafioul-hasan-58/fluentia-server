import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UsersRepository } from './users.repository';
import { S3Service } from '../s3';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly s3Service: S3Service,
  ) {}

  async myProfile(id: string) {
    const user = await this.usersRepository.findProfileById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    let profileImageUrl = dto.profileImage;

    if (file) {
      const uploadResult = await this.s3Service.uploadFile(file, 'avatars');
      profileImageUrl = uploadResult.url;

      if (existingUser.profileImage) {
        await this.s3Service.deleteFile(existingUser.profileImage);
      }
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (dto.firstName !== undefined) {
      updateData.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      updateData.lastName = dto.lastName;
    }
    if (profileImageUrl !== undefined) {
      updateData.profileImage = profileImageUrl;
    }
    if (dto.bio !== undefined) {
      updateData.bio = dto.bio;
    }
    if (dto.phoneNumber !== undefined) {
      updateData.phoneNumber = dto.phoneNumber;
    }
    if (dto.country !== undefined) {
      updateData.country = dto.country;
    }
    if (dto.timezone !== undefined) {
      updateData.timezone = dto.timezone;
    }

    const hasLearningProfileUpdate =
      dto.targetLevel !== undefined ||
      dto.estimatedCEFR !== undefined ||
      dto.nativeLanguage !== undefined ||
      dto.learningGoals !== undefined ||
      dto.dailyGoalMinutes !== undefined;

    if (hasLearningProfileUpdate) {
      const profileCreateData: Prisma.LearningProfileCreateWithoutUserInput =
        {};
      const profileUpdateData: Prisma.LearningProfileUpdateWithoutUserInput =
        {};

      if (dto.targetLevel !== undefined) {
        profileCreateData.targetLevel = dto.targetLevel;
        profileUpdateData.targetLevel = dto.targetLevel;
      }
      if (dto.estimatedCEFR !== undefined) {
        profileCreateData.estimatedCEFR = dto.estimatedCEFR;
        profileUpdateData.estimatedCEFR = dto.estimatedCEFR;
      }
      if (dto.nativeLanguage !== undefined) {
        profileCreateData.nativeLanguage = dto.nativeLanguage;
        profileUpdateData.nativeLanguage = dto.nativeLanguage;
      }
      if (dto.learningGoals !== undefined) {
        profileCreateData.learningGoals = dto.learningGoals;
        profileUpdateData.learningGoals = dto.learningGoals;
      }
      if (dto.dailyGoalMinutes !== undefined) {
        profileCreateData.dailyGoalMinutes = dto.dailyGoalMinutes;
        profileUpdateData.dailyGoalMinutes = dto.dailyGoalMinutes;
      }

      updateData.profile = {
        upsert: {
          create: profileCreateData,
          update: profileUpdateData,
        },
      };
    }

    await this.usersRepository.update(userId, updateData);

    return this.usersRepository.findProfileById(userId);
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const uploadResult = await this.s3Service.uploadFile(file, 'avatars');

    if (existingUser.profileImage) {
      await this.s3Service.deleteFile(existingUser.profileImage);
    }

    await this.usersRepository.update(userId, {
      profileImage: uploadResult.url,
    });

    const user = await this.usersRepository.findProfileById(userId);

    return {
      profileImage: uploadResult.url,
      user,
    };
  }
}

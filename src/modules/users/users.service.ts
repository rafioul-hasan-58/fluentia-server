import { Injectable, NotFoundException } from '@nestjs/common';
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

    const updateData: {
      firstName?: string;
      lastName?: string;
      profileImage?: string;
    } = {};

    if (dto.firstName !== undefined) {
      updateData.firstName = dto.firstName;
    }
    if (dto.lastName !== undefined) {
      updateData.lastName = dto.lastName;
    }
    if (profileImageUrl !== undefined) {
      updateData.profileImage = profileImageUrl;
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

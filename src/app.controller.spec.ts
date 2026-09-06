import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              count: jest.fn().mockResolvedValue(1),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        Reflector,
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('root', () => {
    it('should return "Hello World!" for hello endpoint', async () => {
      const response = await appController.getHello();
      expect(response).toEqual({
        message: 'Fetched Successfully!',
        data: 'Hello World! 1',
      });
    });

    it('should render welcome HTML when browser visits root', () => {
      const mockReq = {
        headers: { accept: 'text/html,application/xhtml+xml' },
      } as unknown as Request;

      const mockRes = {
        type: jest.fn().mockReturnThis(),
        send: jest.fn().mockImplementation((content) => content),
        json: jest.fn(),
      } as unknown as Response;

      appController.getWelcome(mockReq, mockRes);

      expect(mockRes.type).toHaveBeenCalledWith('html');
      expect(mockRes.send).toHaveBeenCalledWith(
        expect.stringContaining('Welcome to Fluentia Server'),
      );
    });

    it('should return JSON when application/json is explicitly requested', () => {
      const mockReq = {
        headers: { accept: 'application/json' },
      } as unknown as Request;

      const mockRes = {
        type: jest.fn().mockReturnThis(),
        send: jest.fn(),
        json: jest.fn().mockImplementation((content) => content),
      } as unknown as Response;

      appController.getWelcome(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Welcome to Fluentia Server API!',
        }),
      );
    });
  });
});

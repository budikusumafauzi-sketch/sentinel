jest.mock('../../src/auth/jwt-auth.guard', () => ({
  JwtAuthGuard: class MockJwtAuthGuard {
    canActivate() {
      return true;
    }
  },
}));

import { Test, TestingModule } from '@nestjs/testing';
import { AiController } from '../../src/ai/ai.controller';
import { AiService } from '../../src/ai/ai.service';

describe('AiController (API Endpoints)', () => {
  let controller: AiController;
  let aiService: any;

  const mockUser = { id: 'user-abc', email: 'user@test.com' };

  beforeEach(async () => {
    aiService = {
      explainFinding: jest.fn().mockResolvedValue({
        findingId: 'f-1',
        summary: 'Explained',
        confidence: 0.95,
      }),
      getSecurityAdvisor: jest.fn().mockResolvedValue({
        recommendations: [],
        overallGuidance: 'Guidance',
      }),
      analyzeThreat: jest.fn().mockResolvedValue({
        classification: 'SUSPICIOUS',
      }),
      analyzeMessage: jest.fn().mockResolvedValue({
        classification: 'PHISHING',
      }),
      analyzeUrl: jest.fn().mockResolvedValue({
        normalizedUrl: 'https://example.com',
      }),
      analyzeScreenshot: jest.fn().mockResolvedValue({
        detectedElements: ['Login'],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: AiService,
          useValue: aiService,
        },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
  });

  it('delegates explainFinding to service with current user id and wraps in envelope', async () => {
    const res = await controller.explainFinding(mockUser, 'f-1');

    expect(aiService.explainFinding).toHaveBeenCalledWith(mockUser.id, 'f-1');
    expect(res.success).toBe(true);
    expect(res.data.findingId).toBe('f-1');
    expect(res.timestamp).toBeDefined();
  });

  it('delegates getSecurityAdvisor to service with current user id', async () => {
    const res = await controller.getSecurityAdvisor(mockUser, { deviceId: 'dev-1' });

    expect(aiService.getSecurityAdvisor).toHaveBeenCalledWith(mockUser.id, 'dev-1');
    expect(res.success).toBe(true);
  });

  it('delegates analyzeThreat to service with current user id', async () => {
    const res = await controller.analyzeThreat(mockUser, { threatInput: 'Test threat' });

    expect(aiService.analyzeThreat).toHaveBeenCalledWith(mockUser.id, {
      threatInput: 'Test threat',
    });
    expect(res.success).toBe(true);
  });

  it('delegates analyzeMessage to service with current user id', async () => {
    const res = await controller.analyzeMessage(mockUser, { messageText: 'Urgent notice' });

    expect(aiService.analyzeMessage).toHaveBeenCalledWith(mockUser.id, {
      messageText: 'Urgent notice',
    });
    expect(res.success).toBe(true);
  });

  it('delegates analyzeUrl to service with current user id', async () => {
    const res = await controller.analyzeUrl(mockUser, { url: 'https://test.com' });

    expect(aiService.analyzeUrl).toHaveBeenCalledWith(mockUser.id, { url: 'https://test.com' });
    expect(res.success).toBe(true);
  });

  it('delegates analyzeScreenshot to service with current user id', async () => {
    const res = await controller.analyzeScreenshot(mockUser, {
      imageBase64: 'fake-base64',
      mimeType: 'image/png',
    });

    expect(aiService.analyzeScreenshot).toHaveBeenCalledWith(mockUser.id, {
      imageBase64: 'fake-base64',
      mimeType: 'image/png',
    });
    expect(res.success).toBe(true);
  });
});

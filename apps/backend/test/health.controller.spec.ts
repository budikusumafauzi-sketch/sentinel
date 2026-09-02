import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../src/health/health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return healthy status', () => {
    const result = controller.getHealth();
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('healthy');
    expect(result.data.version).toBe('0.1.0');
    expect(typeof result.data.uptime).toBe('number');
    expect(result.timestamp).toBeDefined();
  });
});

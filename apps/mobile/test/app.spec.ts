import type { HealthStatus } from '@sentinel/types';

describe('Mobile App Foundation', () => {
  it('should correctly consume @sentinel/types contracts', () => {
    const status: HealthStatus = {
      status: 'healthy',
      version: '0.1.0',
      uptime: 100,
    };
    expect(status.status).toBe('healthy');
    expect(status.version).toBe('0.1.0');
    expect(status.uptime).toBe(100);
  });
});

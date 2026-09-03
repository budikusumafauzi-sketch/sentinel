import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Sentinel API (e2e)', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let deviceId: string;
  let scanId: string;
  let findingId: string;

  const testEmail = `test-${Date.now()}@sentinel.test`;
  const testPassword = 'TestP@ssword123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Clean up test data
    if (prisma) {
      try {
        await prisma.recommendation.deleteMany({});
        await prisma.finding.deleteMany({});
        await prisma.securityScore.deleteMany({});
        await prisma.scan.deleteMany({});
        await prisma.device.deleteMany({});
        await prisma.user.deleteMany({ where: { email: testEmail } });
      } catch {
        // ignore cleanup errors
      }
    }
    await app.close();
  });

  // ── Health ──────────────────────────────────
  describe('Health', () => {
    it('GET /api/v1/health returns healthy', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.payload);
      expect(body.success).toBe(true);
      expect(body.data.version).toBe('0.1.0');
      expect(body.data.database).toBe('healthy');
    });
  });

  // ── Auth ────────────────────────────────────
  describe('Authentication', () => {
    it('POST /api/v1/auth/register creates a user', async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: testEmail, password: testPassword, name: 'Test User' },
      });
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.payload);
      expect(body.success).toBe(true);
      expect(body.data.user.email).toBe(testEmail);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.user.password).toBeUndefined();
      accessToken = body.data.accessToken;
    });

    it('POST /api/v1/auth/register rejects duplicate email', async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: testEmail, password: testPassword },
      });
      expect(result.statusCode).toBe(409);
    });

    it('POST /api/v1/auth/register rejects invalid input', async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { email: 'not-an-email', password: '123' },
      });
      expect(result.statusCode).toBe(400);
    });

    it('POST /api/v1/auth/login succeeds with correct credentials', async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: testEmail, password: testPassword },
      });
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.payload);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
    });

    it('POST /api/v1/auth/login rejects wrong password', async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: testEmail, password: 'WrongPassword' },
      });
      expect(result.statusCode).toBe(401);
    });

    it('GET /api/v1/auth/me returns user with valid token', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.payload);
      expect(body.data.email).toBe(testEmail);
    });

    it('GET /api/v1/auth/me rejects unauthenticated request', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });
      expect(result.statusCode).toBe(401);
    });

    it('GET /api/v1/auth/me rejects invalid token', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: { authorization: 'Bearer invalid.token.here' },
      });
      expect(result.statusCode).toBe(401);
    });
  });

  // ── Devices ─────────────────────────────────
  describe('Devices', () => {
    it('POST /api/v1/devices registers a device', async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/api/v1/devices',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          name: 'Test Pixel 8a',
          platform: 'ANDROID',
          osVersion: '14',
          model: 'Pixel 8a',
          manufacturer: 'Google',
        },
      });
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.payload);
      expect(body.success).toBe(true);
      expect(body.data.name).toBe('Test Pixel 8a');
      deviceId = body.data.id;
    });

    it('POST /api/v1/devices rejects without auth', async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/api/v1/devices',
        payload: { name: 'Test', platform: 'ANDROID' },
      });
      expect(result.statusCode).toBe(401);
    });

    it('POST /api/v1/devices rejects invalid platform', async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/api/v1/devices',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { name: 'Test', platform: 'INVALID' },
      });
      expect(result.statusCode).toBe(400);
    });

    it('GET /api/v1/devices lists user devices', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/devices',
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.payload);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/devices/:id returns device', async () => {
      const result = await app.inject({
        method: 'GET',
        url: `/api/v1/devices/${deviceId}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(result.statusCode).toBe(200);
    });
  });

  // ── Scans ───────────────────────────────────
  describe('Scans', () => {
    it('POST /api/v1/scans creates a scan', async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/api/v1/scans',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { deviceId, type: 'QUICK' },
      });
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.payload);
      expect(body.success).toBe(true);
      expect(body.data.status).toBe('PENDING');
      scanId = body.data.id;
    });

    it('POST /api/v1/scans rejects non-existent device', async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/api/v1/scans',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: { deviceId: '00000000-0000-0000-0000-000000000000' },
      });
      expect(result.statusCode).toBe(404);
    });

    it('GET /api/v1/scans lists scans', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/scans',
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.payload);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/scans/:id returns scan with findings', async () => {
      const result = await app.inject({
        method: 'GET',
        url: `/api/v1/scans/${scanId}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(result.statusCode).toBe(200);
    });
  });

  // ── Findings ────────────────────────────────
  describe('Findings', () => {
    it('POST /api/v1/findings creates a finding', async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/api/v1/findings',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          scanId,
          category: 'SYSTEM',
          title: 'Test finding: outdated OS',
          description: 'OS is outdated',
          severity: 'HIGH',
          source: 'test',
          confidence: 0.9,
        },
      });
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.payload);
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Test finding: outdated OS');
      findingId = body.data.id;
    });

    it('GET /api/v1/findings?scanId lists findings', async () => {
      const result = await app.inject({
        method: 'GET',
        url: `/api/v1/findings?scanId=${scanId}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.payload);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/findings/:id returns finding', async () => {
      const result = await app.inject({
        method: 'GET',
        url: `/api/v1/findings/${findingId}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(result.statusCode).toBe(200);
    });
  });

  // ── Scores ──────────────────────────────────
  describe('Scores', () => {
    it('POST /api/v1/scores stores a score', async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/api/v1/scores',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          deviceId,
          overallScore: 75,
          categoryScores: { system: 80, network: 70 },
        },
      });
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.payload);
      expect(body.success).toBe(true);
      expect(body.data.overallScore).toBe(75);
    });

    it('GET /api/v1/scores?deviceId lists scores', async () => {
      const result = await app.inject({
        method: 'GET',
        url: `/api/v1/scores?deviceId=${deviceId}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.payload);
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/scores/latest returns latest score', async () => {
      const result = await app.inject({
        method: 'GET',
        url: `/api/v1/scores/latest?deviceId=${deviceId}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(result.statusCode).toBe(200);
    });
  });

  // ── Recommendations ─────────────────────────
  describe('Recommendations', () => {
    it('POST /api/v1/recommendations creates a recommendation', async () => {
      const result = await app.inject({
        method: 'POST',
        url: '/api/v1/recommendations',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          findingId,
          title: 'Update your OS',
          description: 'Go to Settings > System Update',
          priority: 'HIGH',
        },
      });
      expect(result.statusCode).toBe(201);
      const body = JSON.parse(result.payload);
      expect(body.success).toBe(true);
      expect(body.data.title).toBe('Update your OS');
    });

    it('GET /api/v1/recommendations?findingId lists recommendations', async () => {
      const result = await app.inject({
        method: 'GET',
        url: `/api/v1/recommendations?findingId=${findingId}`,
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.payload);
      expect(body.data.length).toBeGreaterThan(0);
    });
  });

  // ── Error Handling ──────────────────────────
  describe('Error Handling', () => {
    it('returns 404 for non-existent route', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/nonexistent',
      });
      expect(result.statusCode).toBe(404);
    });

    it('returns structured error for invalid UUID param', async () => {
      const result = await app.inject({
        method: 'GET',
        url: '/api/v1/devices/not-a-uuid',
        headers: { authorization: `Bearer ${accessToken}` },
      });
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.payload);
      expect(body.success).toBe(false);
    });
  });
});

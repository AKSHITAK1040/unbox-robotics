const request = require('supertest');
const { app, server, io } = require('../src/server');
const db = require('../src/db');

describe('Backend Speedometer API Tests', () => {
  let emitSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    emitSpy = jest.spyOn(io, 'emit');
  });

  afterAll(async () => {
    server.close();
    io.close();
    await db.pool.end();
  });

  describe('POST /api/speed (Validation & Persistence)', () => {
    it('should reject requests without a speed property', async () => {
      const response = await request(app)
        .post('/api/speed')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should reject requests with non-numeric speed values', async () => {
      const response = await request(app)
        .post('/api/speed')
        .send({ speed: 'fast' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should reject speed values outside acceptable bounds', async () => {
      const response = await request(app)
        .post('/api/speed')
        .send({ speed: 450 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should insert valid speed and emit real-time event ONLY on DB success', async () => {
      const mockRecord = {
        id: 101,
        speed: 48.5,
        recorded_at: new Date().toISOString(),
      };

      jest.spyOn(db, 'query').mockResolvedValueOnce({
        rows: [mockRecord],
      });

      const response = await request(app)
        .post('/api/speed')
        .send({ speed: 48.5 });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: 101,
        speed: 48.5,
        recordedAt: mockRecord.recorded_at,
      });

      // Crucial verification: WebSocket event emitted with correct payload
      expect(emitSpy).toHaveBeenCalledWith('speed_update', {
        id: 101,
        speed: 48.5,
        recordedAt: mockRecord.recorded_at,
      });
    });

    it('should NOT emit real-time event if database insertion fails', async () => {
      jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('DB Connection Timeout'));

      const response = await request(app)
        .post('/api/speed')
        .send({ speed: 48.5 });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal server error');

      // Crucial requirement: No real-time broadcast on DB failure
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/speed/latest', () => {
    it('should return the latest reading when records exist', async () => {
      const mockRecord = {
        id: 50,
        speed: 52.3,
        recorded_at: new Date().toISOString(),
      };

      jest.spyOn(db, 'query').mockResolvedValueOnce({
        rows: [mockRecord],
      });

      const response = await request(app).get('/api/speed/latest');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 50,
        speed: 52.3,
        recordedAt: mockRecord.recorded_at,
      });
    });

    it('should return 404 when no records exist in database', async () => {
      jest.spyOn(db, 'query').mockResolvedValueOnce({
        rows: [],
      });

      const response = await request(app).get('/api/speed/latest');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/speed/history', () => {
    it('should return historical readings ordered by recorded_at', async () => {
      const mockHistory = [
        { id: 2, speed: 49.1, recorded_at: new Date().toISOString() },
        { id: 1, speed: 48.0, recorded_at: new Date(Date.now() - 1000).toISOString() },
      ];

      jest.spyOn(db, 'query').mockResolvedValueOnce({
        rows: mockHistory,
      });

      const response = await request(app).get('/api/speed/history?limit=10');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0].speed).toBe(49.1);
    });
  });

  describe('GET /api/health', () => {
    it('should return 200 ok when database responds', async () => {
      jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok', database: 'connected' });
    });

    it('should return 500 error when database is unreachable', async () => {
      jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('Connection refused'));

      const response = await request(app).get('/api/health');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ status: 'error', database: 'disconnected' });
    });
  });
});

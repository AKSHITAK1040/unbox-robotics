const express = require('express');
const cors = require('cors');
const db = require('../db');

module.exports = (io) => {
  const router = express.Router();

  // POST /api/speed
  router.post('/speed', async (req, res) => {
    const { speed } = req.body;
    
    if (speed === undefined || speed === null || typeof speed !== 'number' || isNaN(speed)) {
      return res.status(400).json({ error: 'Valid numeric speed is required' });
    }

    if (speed < -100 || speed > 300) {
      return res.status(400).json({ error: 'Speed out of reasonable range' });
    }

    try {
      const result = await db.query(
        'INSERT INTO speed_data (speed) VALUES ($1) RETURNING id, speed, recorded_at',
        [speed]
      );
      
      const newRecord = result.rows[0];
      
      const responseData = {
        id: newRecord.id,
        speed: newRecord.speed,
        recordedAt: newRecord.recorded_at
      };

      // Emit to all connected WebSocket clients ONLY after successful DB insert
      if (io) {
        io.emit('speed_update', responseData);
      }

      res.status(201).json(responseData);
    } catch (err) {
      console.error('Database insert error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/speed/latest
  router.get('/speed/latest', async (req, res) => {
    try {
      const result = await db.query(
        'SELECT id, speed, recorded_at FROM speed_data ORDER BY recorded_at DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No speed data found' });
      }

      const record = result.rows[0];
      res.json({
        id: record.id,
        speed: record.speed,
        recordedAt: record.recorded_at
      });
    } catch (err) {
      console.error('Database query error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/speed/history
  router.get('/speed/history', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 60;
      const result = await db.query(
        'SELECT id, speed, recorded_at FROM speed_data ORDER BY recorded_at DESC LIMIT $1',
        [limit]
      );
      
      const history = result.rows.map(row => ({
        id: row.id,
        speed: row.speed,
        recordedAt: row.recorded_at
      }));

      res.json(history);
    } catch (err) {
      console.error('Database query error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /health
  router.get('/health', async (req, res) => {
    try {
      await db.query('SELECT 1');
      res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
      res.status(500).json({ status: 'error', database: 'disconnected' });
    }
  });

  return router;
};

const db = require('../config/db');
const sensorService = require('../services/sensorService');

/**
 * GET /api/v1/sensors/live
 * Returns current snapshot of all live sensor values from OBD-II
 */
const getLive = async (req, res, next) => {
  try {
    const data = await sensorService.getLiveSnapshot();
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/sensors/history/:sessionId
 * Returns all sensor readings recorded during a scan session
 */
const getHistory = async (req, res, next) => {
  try {
    const readings = await db('sensor_readings')
      .where({ session_id: req.params.sessionId })
      .orderBy('recorded_at', 'asc');

    res.json(readings);
  } catch (err) {
    next(err);
  }
};

module.exports = { getLive, getHistory };

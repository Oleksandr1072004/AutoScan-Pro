const db = require('../config/db');
const obdService = require('../services/obdService');

/**
 * POST /api/v1/scans
 * Body: { vehicle_id, scan_type? }
 * Initiates a full OBD-II scan via obdService
 */
const initiateScan = async (req, res, next) => {
  const { vehicle_id, scan_type = 'full' } = req.body;

  if (!vehicle_id) {
    return res.status(400).json({ error: 'vehicle_id is required' });
  }

  // Verify vehicle belongs to user
  const vehicle = await db('vehicles')
    .where({ id: vehicle_id, user_id: req.user.uid })
    .first();
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  // Create pending session immediately so client can poll
  const [session] = await db('scan_sessions')
    .insert({ vehicle_id, scan_type, status: 'pending' })
    .returning('*');

  // Run scan async — client polls GET /scans/:id
  obdService.runScan(session.id, vehicle_id).catch((err) => {
    console.error('[SCAN] Background scan failed:', err.message);
  });

  res.status(202).json({
    session_id: session.id,
    status: 'pending',
    message: 'Scan initiated. Poll GET /api/v1/scans/:id for results.',
  });
};

/**
 * GET /api/v1/scans/:id
 * Returns scan results (poll until status = completed | failed)
 */
const getResult = async (req, res, next) => {
  try {
    const session = await db('scan_sessions')
      .where({ id: req.params.id })
      .first();

    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Attach DTC codes if scan completed
    let active_dtc = [];
    let pending_dtc = [];

    if (session.status === 'completed') {
      const codes = await db('detected_dtc_codes')
        .where({ session_id: session.id })
        .orderBy('detected_at', 'asc');

      active_dtc  = codes.filter((c) => c.type === 'active');
      pending_dtc = codes.filter((c) => c.type === 'pending');
    }

    res.json({ ...session, active_dtc, pending_dtc });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/scans/history/:vehicleId
 */
const getHistory = async (req, res, next) => {
  try {
    const sessions = await db('scan_sessions')
      .where({ vehicle_id: req.params.vehicleId })
      .orderBy('started_at', 'desc')
      .limit(50);

    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/scans/:vehicleId/clear-dtc
 * Sends OBD-II Mode 04 command to clear DTCs
 */
const clearDtc = async (req, res, next) => {
  try {
    const { vehicleId } = req.params;

    // Verify vehicle ownership
    const vehicle = await db('vehicles')
      .where({ id: vehicleId, user_id: req.user.uid })
      .first();
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    await obdService.clearDtcCodes();

    // Log clear action as a session entry
    await db('scan_sessions').insert({
      vehicle_id: vehicleId,
      scan_type: 'dtc',
      status: 'completed',
      dtc_count: 0,
      completed_at: db.fn.now(),
    });

    res.json({ message: 'DTC codes cleared successfully', vehicle_id: vehicleId });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/scans/:id
 */
const deleteSession = async (req, res, next) => {
  try {
    const deleted = await db('scan_sessions')
      .where({ id: req.params.id })
      .del();
    if (!deleted) return res.status(404).json({ error: 'Session not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { initiateScan, getResult, getHistory, clearDtc, deleteSession };

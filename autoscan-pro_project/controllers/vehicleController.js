const db = require('../config/db');

/**
 * GET /api/v1/vehicles
 * Returns all vehicles for the authenticated user
 */
const getAll = async (req, res, next) => {
  try {
    const vehicles = await db('vehicles')
      .where({ user_id: req.user.uid })
      .orderBy('created_at', 'desc');
    res.json(vehicles);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/vehicles
 * Body: { make, model, year, vin? }
 */
const create = async (req, res, next) => {
  try {
    const { make, model, year, vin } = req.body;

    if (!make || !model || !year) {
      return res.status(400).json({ error: 'make, model and year are required' });
    }
    if (year < 1996) {
      return res.status(400).json({ error: 'OBD-II requires year >= 1996' });
    }

    const [vehicle] = await db('vehicles')
      .insert({ make, model, year, vin, user_id: req.user.uid })
      .returning('*');

    res.status(201).json(vehicle);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'VIN already registered' });
    }
    next(err);
  }
};

/**
 * GET /api/v1/vehicles/:id
 */
const getById = async (req, res, next) => {
  try {
    const vehicle = await db('vehicles')
      .where({ id: req.params.id, user_id: req.user.uid })
      .first();

    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/v1/vehicles/:id
 */
const update = async (req, res, next) => {
  try {
    const { make, model, year, vin } = req.body;

    const [updated] = await db('vehicles')
      .where({ id: req.params.id, user_id: req.user.uid })
      .update({ make, model, year, vin, updated_at: db.fn.now() })
      .returning('*');

    if (!updated) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/vehicles/:id
 */
const remove = async (req, res, next) => {
  try {
    const deleted = await db('vehicles')
      .where({ id: req.params.id, user_id: req.user.uid })
      .del();

    if (!deleted) return res.status(404).json({ error: 'Vehicle not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, getById, update, remove };

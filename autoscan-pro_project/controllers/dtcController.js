const db = require('../config/db');

/**
 * GET /api/v1/dtc/:code
 * Lookup DTC code in reference table
 * Response time target: < 100ms (indexed query)
 */
const getByCode = async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase();

    const dtc = await db('dtc_codes_reference')
      .where({ code })
      .first();

    if (!dtc) {
      return res.status(404).json({
        error: `DTC code ${code} not found in reference database`,
        suggestion: 'Check the code format (e.g. P0301, C0035)',
      });
    }

    res.json(dtc);
  } catch (err) {
    next(err);
  }
};

module.exports = { getByCode };

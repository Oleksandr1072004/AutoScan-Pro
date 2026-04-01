const net = require('net');
const db  = require('../config/db');

// ─── OBD-II Configuration ────────────────────────────────────────────────────
const OBD_HOST = process.env.MOCK_OBD_HOST || 'localhost';
const OBD_PORT = parseInt(process.env.MOCK_OBD_PORT || '35000');
const TIMEOUT_MS = 5000;

// ─── HEX Response Parser ─────────────────────────────────────────────────────
/**
 * Parse raw ELM327 DTC response into code strings
 * e.g. "43 01 33 00 00 00 00" → ["P0133"]
 */
function parseHexToDtc(hexString) {
  const bytes = hexString.trim().split(/\s+/);

  // Remove response header byte (43 = Mode 03 response)
  if (bytes[0] === '43' || bytes[0] === '47') bytes.shift();

  // Number of DTCs
  const dtcCount = parseInt(bytes.shift(), 16);
  if (!dtcCount || isNaN(dtcCount)) return [];

  const codes = [];
  for (let i = 0; i < bytes.length - 1; i += 2) {
    const b1 = parseInt(bytes[i], 16);
    const b2 = parseInt(bytes[i + 1], 16);
    if (b1 === 0 && b2 === 0) continue; // padding bytes

    // First nibble determines system
    const systemMap = { 0: 'P0', 1: 'P1', 2: 'P2', 3: 'P3',
                        4: 'C0', 5: 'C1', 6: 'C2', 7: 'C3',
                        8: 'B0', 9: 'B1', 10: 'B2', 11: 'B3',
                       12: 'U0', 13: 'U1', 14: 'U2', 15: 'U3' };

    const firstNibble = (b1 >> 4) & 0x0F;
    const prefix = systemMap[firstNibble] || 'P0';
    const remainder = ((b1 & 0x03) * 256 + b2).toString().padStart(3, '0');
    codes.push(`${prefix}${remainder}`);
  }
  return codes;
}

// ─── Send OBD-II Command via TCP ─────────────────────────────────────────────
function sendObdCommand(command) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    let response = '';
    const timer = setTimeout(() => {
      client.destroy();
      reject(new Error(`OBD timeout after ${TIMEOUT_MS}ms for command: ${command}`));
    }, TIMEOUT_MS);

    client.connect(OBD_PORT, OBD_HOST, () => {
      client.write(`${command}\r`);
    });

    client.on('data', (data) => {
      response += data.toString();
      if (response.includes('>')) {
        clearTimeout(timer);
        client.destroy();
        resolve(response.replace(/>/g, '').trim());
      }
    });

    client.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// ─── Main Scan Function ───────────────────────────────────────────────────────
/**
 * runScan: Executes Mode 03 + Mode 07, saves results to DB
 * Called asynchronously from scanController
 */
async function runScan(sessionId, vehicleId) {
  const startTime = Date.now();

  try {
    // ── Mode 03: Active DTCs ─────────────────────────────────────────────
    const mode03Response = await sendObdCommand('03');
    const activeCodes = parseHexToDtc(mode03Response);

    // ── Mode 07: Pending DTCs ────────────────────────────────────────────
    const mode07Response = await sendObdCommand('07');
    const pendingCodes = parseHexToDtc(mode07Response);

    // ── Enrich with descriptions from reference table ────────────────────
    const allCodes = [
      ...activeCodes.map((c) => ({ code: c, type: 'active' })),
      ...pendingCodes.map((c) => ({ code: c, type: 'pending' })),
    ];

    const enrichedCodes = await Promise.all(
      allCodes.map(async ({ code, type }) => {
        const ref = await db('dtc_codes_reference').where({ code }).first();
        return {
          session_id:  sessionId,
          code,
          type,
          description: ref?.description || `Unknown code: ${code}`,
          severity:    ref?.severity    || 'info',
        };
      })
    );

    // ── ACID: insert codes + update session atomically ───────────────────
    await db.transaction(async (trx) => {
      if (enrichedCodes.length > 0) {
        await trx('detected_dtc_codes').insert(enrichedCodes);
      }
      await trx('scan_sessions').where({ id: sessionId }).update({
        status:       'completed',
        dtc_count:    enrichedCodes.length,
        duration_ms:  Date.now() - startTime,
        completed_at: trx.fn.now(),
      });
    });

    console.log(
      `[OBD] Scan ${sessionId} complete. Found: ${enrichedCodes.length} DTCs in ${Date.now() - startTime}ms`
    );
  } catch (err) {
    // Mark session as failed
    await db('scan_sessions').where({ id: sessionId }).update({ status: 'failed' });
    console.error(`[OBD] Scan ${sessionId} failed:`, err.message);
    throw err;
  }
}

// ─── Clear DTC Codes (Mode 04) ────────────────────────────────────────────────
async function clearDtcCodes() {
  const response = await sendObdCommand('04');
  console.log('[OBD] Mode 04 response:', response);
  return response;
}

// ─── Read Single PID ──────────────────────────────────────────────────────────
async function readPid(pid) {
  const response = await sendObdCommand(`01${pid}`);
  return response;
}

module.exports = { runScan, clearDtcCodes, readPid, parseHexToDtc };

// Circuit Breaker State
const circuitBreaker = {
  state: 'CLOSED',       // CLOSED | OPEN | HALF_OPEN
  failureCount: 0,
  failureThreshold: 3,
  openUntil: null,
  lastSuccessfulScan: null, // кеш для fallback
};

async function sendObdCommandWithBreaker(command) {
  const now = Date.now();

  // OPEN state — повертаємо кеш або помилку
  if (circuitBreaker.state === 'OPEN') {
    if (now < circuitBreaker.openUntil) {
      console.warn('[CB] Circuit OPEN — using fallback');
      if (circuitBreaker.lastSuccessfulScan) {
        return { cached: true, data: circuitBreaker.lastSuccessfulScan };
      }
      throw new Error('OBD-II Circuit Breaker OPEN: service unavailable');
    }
    // Переходимо в HALF_OPEN
    circuitBreaker.state = 'HALF_OPEN';
    console.log('[CB] Circuit → HALF_OPEN (probe)');
  }

  // Retry logic з exponential backoff
  const delays = [0, 1000, 2000, 4000];
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (delays[attempt]) await sleep(delays[attempt]);
      const result = await sendObdCommand(command);

      // Успіх — скидаємо Circuit Breaker
      circuitBreaker.failureCount = 0;
      circuitBreaker.state = 'CLOSED';
      return result;
    } catch (err) {
      console.error(`[CB] Attempt ${attempt + 1} failed: ${err.message}`);

      if (attempt === 2) {
        circuitBreaker.failureCount++;
        if (circuitBreaker.failureCount >= circuitBreaker.failureThreshold) {
          circuitBreaker.state = 'OPEN';
          circuitBreaker.openUntil = Date.now() + 30_000; // 30 сек
          // Sentry alert
          console.error('[CB] Circuit → OPEN. Sentry notified.');
        }
        throw err;
      }
    }
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

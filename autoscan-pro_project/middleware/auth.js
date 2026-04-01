const admin = require('firebase-admin');

// Initialize Firebase Admin (once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:    process.env.FIREBASE_PROJECT_ID,
      privateKey:   process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail:  process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

/**
 * Middleware: verifyToken
 * Validates Firebase JWT from Authorization header
 * Attaches decoded user to req.user
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded; // { uid, email, ... }
    next();
  } catch (err) {
    console.error('[AUTH] Token verification failed:', err.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = { verifyToken };

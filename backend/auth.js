const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('./db');
const logger = require('./logger');
const { sendPasswordResetEmail } = require('./emailService');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password fields are strictly required.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user account with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword
      }
    });

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });

    logger.info(`New developer profile ecosystem initialized successfully: ${email}`);
    return res.status(201).json({
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name }
    });
  } catch (error) {
    logger.error("Registration pipeline structural collapse:", error);
    return res.status(500).json({ error: 'Internal server error during account registration.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password fields are strictly required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: 'Invalid authentication credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid authentication credentials.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    logger.info(`Session identity token issued for profile node: ${email}`);
    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    logger.error("Authentication session login fault:", error);
    return res.status(500).json({ error: 'Internal server error during session login.' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address field is strictly required.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Senior Design Rule: Return generic success message if user doesn't exist to block account enumeration scans
    if (!user) {
      logger.info(`Password reset requested for non-existent endpoint node: ${email}`);
      return res.json({ message: 'If an account matches that email address, a secure recovery token has been dispatched.' });
    }

    // 1. Generate a raw, cryptographically secure 32-byte random hex string
    const rawResetToken = crypto.randomBytes(32).toString('hex');

    // 2. Hash the raw token string using SHA-256 before writing it to PostgreSQL
    const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

    // 3. Establish a strict 15-minute operational lifetime window
    const tokenExpiryWindow = new Date(Date.now() + 15 * 60 * 1000);

    // 4. Update the user record with the token parameters
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedResetToken,
        resetTokenExpiry: tokenExpiryWindow
      }
    });

    logger.info(`Secure recovery payload token mapped and saved for profile: ${email}`);

    // Trigger the Resend email transmission as a non-blocking background task
    sendPasswordResetEmail(email, rawResetToken);

    return res.json({ message: 'If an account matches that email address, a secure recovery token has been dispatched.' });
  } catch (error) {
    logger.error("Password recovery link initialization collapse:", error);
    return res.status(500).json({ error: 'Internal server error during password recovery initialization.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Recovery token string and updated password field parameters are strictly required.' });
  }

  try {
    // 1. Re-hash the raw incoming query token using SHA-256 to locate its row safely
    const hashedIncomingToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Fetch the corresponding user node profile containing that unique token
    const user = await prisma.user.findUnique({ where: { resetToken: hashedIncomingToken } });

    // 3. Fail gracefully if the token doesn't match any profile record entry
    if (!user) {
      logger.warn(`Failed reset attempt triggered using an invalid or consumed token node hash.`);
      return res.status(400).json({ error: 'The verification recovery security link is invalid or has expired.' });
    }

    // 4. Validate that the operational lifespan window hasn't closed yet
    if (user.resetTokenExpiry && new Date() > new Date(user.resetTokenExpiry)) {
      logger.warn(`Expired token recovery handshake attempted for profile: ${user.email}`);
      
      // Defensively clear out the expired token anyway to clean up database state
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: null, resetTokenExpiry: null }
      });

      return res.status(400).json({ error: 'The verification recovery security link is invalid or has expired.' });
    }

    // 5. Encrypt the incoming string using our standard 12-round bcrypt hash implementation
    const secureUpdatedPassword = await bcrypt.hash(newPassword, 12);

    // 6. Write the password parameters and cleanly clear the tracking tokens to null in a single atomic database query
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: secureUpdatedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    logger.info(`Ecosystem credentials reset successfully. Token consumed for: ${user.email}`);
    return res.json({ message: 'Ecosystem security keys updated successfully.' });
  } catch (error) {
    logger.error("Credentials overwrite processing pipeline block collapse:", error);
    return res.status(500).json({ error: 'Internal server error processing updated credential handshake.' });
  }
});

module.exports = router;
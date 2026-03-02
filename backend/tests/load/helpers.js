const jwt = require('jsonwebtoken');

// NOTE: Ensure this matches the JWT_SECRET in your .env file
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

module.exports = {
    generateToken: (context, events, done) => {
        // Generate a random user ID for each simulated connection
        const randomUserId = 'test_user_' + Math.random().toString(36).substr(2, 9);

        // Create a valid JWT token payload matching your auth.ts TokenPayload
        const payload = {
            userId: randomUserId,
            username: 'LoadTestBot',
            isAnonymous: true
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });

        // Set the token variable so Artillery can use it in the socket handshake
        context.vars.token = token;
        return done();
    }
};

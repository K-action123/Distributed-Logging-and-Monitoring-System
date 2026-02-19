const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Global rate limiter for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per `window` (here, per 15 minutes)
    message: {
        error: 'Too many attempts from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

// Apply rate limiter to registration and login
app.post('/register', authLimiter, async (req, res) => {
    const { email, password, teamName } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Sequential creation for stability in this Node/Prisma environment
        const team = await prisma.team.create({
            data: { name: teamName },
        });

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                teamId: team.id,
            },
        });

        res.status(201).json({ message: 'User registered', userId: user.id, teamId: team.id });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(400).json({ error: 'Registration failed', details: error.message });
    }
});

// Login and get JWT
app.post('/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { team: true },
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user.id, teamId: user.teamId, teamName: user.team.name },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, teamId: user.teamId });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Internal validation endpoint
app.get('/validate', (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json(decoded);
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
    console.log(`Auth-MS running at http://localhost:${PORT}`);
});

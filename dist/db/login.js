import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db/db.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/templates/login.html'));
});
router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/templates/signup.html'));
});
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ message: 'Logout failed' });
        }
        else {
            res.json({ message: 'Logged out' });
        }
    });
});
router.post('/api/submit-login', async (req, res) => {
    console.log('Request body:', req.body);
    const { username, password } = req.body;
    if (!username || !password) {
        console.error('Missing username or password');
        return res.status(400).json({ message: 'Username and password are required' });
    }
    try {
        console.log('Attempting database connection...');
        const connection = await pool.getConnection();
        console.log('Database connection established');
        const [rows] = await connection.query('SELECT * FROM db_users WHERE username = ? AND password = ?', [username, password]);
        connection.release();
        if (rows.length > 0) {
            req.session.user = rows[0];
            res.json({ message: 'Login successful', user: { username: rows[0].username, id: rows[0].id } });
            console.log('Session user set to:', req.session.user);
            console.log('User logged in:', rows[0].username);
        }
        else {
            res.status(401).json({ message: 'Invalid credentials' });
            console.log('Login failed for username:', username);
        }
    }
    catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});
router.post('/api/submit-signup', async (req, res) => {
    const { username, password, email } = req.body;
    try {
        const connection = await pool.getConnection();
        const existingUserQuery = 'SELECT * FROM db_users WHERE username = ? OR email = ?';
        const [existingUsers] = await connection.query(existingUserQuery, [username, email]);
        if (existingUsers.length > 0) {
            connection.release();
            return res.status(409).json({ message: 'Username or email already exists' });
        }
        const [result] = await connection.query('INSERT INTO db_users (username, password, email) VALUES (?, ?, ?)', [username, password, email]);
        connection.release();
        res.json({ message: 'Signup successful', userId: result.insertId });
    }
    catch (error) {
        res.status(500).json({ message: 'Database error' });
        console.log(error);
    }
});
router.get('/api/user', (req, res) => {
    console.log('GET /api/user hit. Session exists:', !!req.session);
    const user = req.session?.user;
    if (user) {
        console.log('Fetching user data for:', user.username ?? user);
        res.json({ status: 200, user });
    }
    else {
        console.log('No user in session');
        res.status(401).json({ status: 401, message: 'Not logged in' });
    }
});
export default router;
//# sourceMappingURL=login.js.map
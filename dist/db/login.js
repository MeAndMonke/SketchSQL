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
    const { username, password } = req.body;
    if (!username || !password) {
        console.error('Missing username or password');
        return res.status(400).json({ message: 'Username and password are required' });
    }
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
        connection.release();
        if (rows.length > 0) {
            const data = rows[0];
            req.session.user = { id: data.id, username: data.username, email: data.email };
            res.json({ message: 'Login successful', user: { username: rows[0].username, id: rows[0].id } });
        }
        else {
            res.status(401).json({ message: 'Invalid credentials' });
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
        const existingUserQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
        const [existingUsers] = await connection.query(existingUserQuery, [username, email]);
        if (existingUsers.length > 0) {
            connection.release();
            return res.status(409).json({ message: 'Username or email already exists' });
        }
        const [result] = await connection.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, password, email]);
        connection.release();
        res.json({ message: 'Signup successful', userId: result.insertId });
    }
    catch (error) {
        res.status(500).json({ message: 'Database error' });
        console.log(error);
    }
});
router.get('/api/user', (req, res) => {
    const user = req.session?.user;
    if (user) {
        res.json({ status: 200, user });
    }
    else {
        res.status(401).json({ status: 401, message: 'Not logged in' });
    }
});
export default router;
//# sourceMappingURL=login.js.map
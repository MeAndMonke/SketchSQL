import { Router } from 'express';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db/db.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();
// render login and signup pages
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/templates/login.html'));
});
router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/templates/signup.html'));
});
// logout route
router.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ message: 'Logout failed' });
        }
        res.json({ message: 'Logged out' });
    });
});
// handle login submissions
router.post('/api/submit-login', async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    // security check
    if (usernameOrEmail === String && password === String) {
        console.error('Invalid input types');
        return res.status(400).json({ message: 'Invalid input types' });
    }
    // validate input
    if (!usernameOrEmail || !password) {
        console.error('Missing username or password');
        return res.status(400).json({ message: 'Username and password are required' });
    }
    try {
        const connection = await pool.getConnection();
        // Fetch user by username or email
        const [rows] = await connection.query('SELECT * FROM users WHERE username = ? OR email = ?', [usernameOrEmail, usernameOrEmail]);
        connection.release();
        // Check if user exists
        if (!(rows.length > 0)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        // compare passwords
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // set session user
        req.session.user = { id: user.id, username: user.username, email: user.email };
        res.json({ message: 'Login successful', user: { username: user.username, id: user.id } });
    }
    catch (error) {
        console.error('Database error details:', error);
        res.status(500).json({ message: 'Database error' });
    }
});
// handle signup submissions
router.post('/api/submit-signup', async (req, res) => {
    const { username, password, email } = req.body;
    // security checks
    if (username === String && password === String && email === String) {
        return res.status(400).json({ message: 'Invalid input types' });
    }
    if (!username || !password || !email) {
        return res.status(400).json({ message: 'Username, password, and email are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }
    if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ message: 'Username must be between 3 and 20 characters long' });
    }
    if (username.includes(' ')) {
        return res.status(400).json({ message: 'Username cannot contain spaces' });
    }
    if (password.includes(' ')) {
        return res.status(400).json({ message: 'Password cannot contain spaces' });
    }
    try {
        const connection = await pool.getConnection();
        // check if username or email already exists
        const existingUserQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
        const [existingUsers] = await connection.query(existingUserQuery, [username, email]);
        if (existingUsers.length > 0) {
            connection.release();
            return res.status(409).json({ message: 'Username or email already exists' });
        }
        // hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // insert new user into database
        const [result] = await connection.query('INSERT INTO users (username, password, email) VALUES (?, ?, ?)', [username, hashedPassword, email]);
        connection.release();
        res.json({ message: 'Signup successful', userId: result.insertId });
    }
    catch (error) {
        res.status(500).json({ message: 'Database error' });
        console.log(error);
    }
});
// get current logged in user
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
import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;
app.use(express.json());
app.use(session({
    secret: 'ejrk3gfuegyi3efyqgh3evigfugygyciuufe',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
}));
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/templates/login.html'));
});
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/templates/signup.html'));
});
app.get('/canvas/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/templates/canvas.html'));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/templates/home.html'));
});
app.use(express.static(path.join(__dirname, '../public')));
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ message: 'Logout failed' });
        }
        else {
            res.json({ message: 'Logged out' });
        }
    });
});
app.post('/submit-login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM db_users WHERE username = ? AND password = ?', [username, password]);
        connection.release();
        if (rows.length > 0) {
            req.session.user = rows[0];
            res.json({ message: 'Login successful', user: { username: rows[0].username, id: rows[0].id } });
            console.log('User logged in:', rows[0].username);
        }
        else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Database error' });
        console.log(error);
    }
});
app.post('/submit-signup', async (req, res) => {
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
app.get('/api/user', (req, res) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    }
    else {
        res.status(401).json({ message: 'Not logged in' });
    }
});
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ message: 'Logout failed' });
        }
        else {
            res.json({ message: 'Logged out' });
        }
    });
});
app.get("/api/checkLogedin", (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true });
    }
    else {
        res.json({ loggedIn: false });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map
import express from 'express';
import session from 'express-session';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import pool from './db.js';

declare module 'express-session' {
  interface SessionData {
    user?: any;
  }
}

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

const requireNotLoggedIn = (req: Request, res: Response, next: Function) => {
    if (req.session.user) {
        res.redirect('/');
    } else {
        next();
    }
};

app.get('/login', requireNotLoggedIn, (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/templates/login.html'));
});

app.get('/register', requireNotLoggedIn, (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/templates/signup.html'));
});

app.get('/canvas/:id', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/templates/canvas.html'));
});

app.use(express.static(path.join(__dirname, '../public')));

app.post('/submit-login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  
  try {
    const connection = await pool.getConnection();
    const [rows]: any = await connection.query(
        'SELECT * FROM db_users WHERE username = ? AND password = ?',
        [username, password]
    );
    connection.release();

    if (rows.length > 0) {
        req.session.user = rows[0];
        res.json({ message: 'Login successful', user: rows[0] });
        console.log('User logged in:', rows[0]);
        res.redirect('/');
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Database error' });
    }
});

app.post('/submit-signup', async (req: Request, res: Response) => {
    const { username, password, email } = req.body;
    try {
        const connection = await pool.getConnection();

        const existingUserQuery = 'SELECT * FROM db_users WHERE username = ? OR email = ?';
        const [existingUsers]: any = await connection.query(existingUserQuery, [username, email]);
        if (existingUsers.length > 0) {
            connection.release();
            return res.status(409).json({ message: 'Username or email already exists' });
        }
        
        const [result]: any = await connection.query(
            'INSERT INTO db_users (username, password, email) VALUES (?, ?, ?)',
            [username, password, email]
        );
        connection.release();
        res.json({ message: 'Signup successful', userId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Database error' } );
        console.log(error);
    }
});

app.get('/api/user', (req: Request, res: Response) => {
    if (req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ message: 'Not logged in' });
    }
});

app.get('/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ message: 'Logout failed' });
        } else {
            res.json({ message: 'Logged out' });
        }
    });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

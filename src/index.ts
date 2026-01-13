import express from 'express';
import session from 'express-session';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import pool from './db/db.js';
import loginRouter from './db/login.js';
import projectRouter from './db/projects.js'
import nodeRouter from './db/canvas/nodes.js';

declare module 'express-session' {
  interface SessionData {
    user?: any;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware must come BEFORE routes
app.use(express.json());
app.use(session({
    secret: 'ejrk3gfuegyi3efyqgh3evigfugygyciuufe',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
}));

// routes come AFTER middleware
app.use(loginRouter);
app.use(projectRouter);
app.use(nodeRouter);

app.get('/canvas/:id', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/templates/canvas.html'));
});

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/templates/home.html'));
});

app.use(express.static(path.join(__dirname, '../public')));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

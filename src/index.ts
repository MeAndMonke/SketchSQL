import express from 'express';
import session from 'express-session';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import loginRouter from './db/login.js';
import projectRouter from './db/projects.js'
import nodeRouter from './db/canvas/nodes.js';
import rowRouter from './db/canvas/rows.js';
import connectionRouter from './db/canvas/connections.js';

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

// routes
app.use(loginRouter);
app.use(projectRouter);
app.use(nodeRouter);
app.use(rowRouter);
app.use(connectionRouter);

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

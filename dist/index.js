import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './db/db.js';
import loginRouter from './db/login.js';
import projectRouter from './db/projects.js';
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
// Routes come AFTER middleware
app.use(loginRouter);
app.use(projectRouter);
app.get('/canvas/:id', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/templates/canvas.html'));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/templates/home.html'));
});
app.use(express.static(path.join(__dirname, '../public')));
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map
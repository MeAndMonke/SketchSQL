# SketchSQL - Technical Design Document

## Document Information
- **Version:** 1.0
- **Date:** January 14, 2026
- **Project:** SketchSQL - Visual SQL Query Builder
- **Repository:** MeAndMonke/SketchSQL

---

## 1. System Overview

### 1.1 Purpose
SketchSQL is a web-based visual SQL query builder that allows users to create, visualize, and manage database queries through an interactive canvas interface with drag-and-drop nodes and connections.

### 1.2 Technology Stack

#### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js 5.2.1
- **Language:** TypeScript 5.9.3
- **Database:** MySQL 2.0 (via mysql2 3.16.0)
- **Session Management:** express-session 1.18.2

#### Frontend
- **Core:** Vanilla JavaScript (ES6+)
- **Architecture:** Component-based modular design
- **Canvas:** HTML5 Canvas API with SVG for connections
- **Styling:** CSS3 with modular stylesheets

#### Build Tools
- **TypeScript Compiler:** tsc with ESNext target
- **Module System:** ES Modules (type: "module")
- **Dev Tools:** ts-node for development

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  Templates  │  │    Scripts   │  │   Stylesheets    │   │
│  │  (HTML)     │  │ (JavaScript) │  │     (CSS)        │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  Express.js │  │  Middleware │  │   API Routes     │   │
│  │   Server    │  │  (Session)  │  │  (REST-like)     │   │
│  └─────────────┘  └─────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ SQL
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            MySQL Database (drawsql)                  │   │
│  │  ┌──────────┐ ┌──────────┐ ┌───────┐ ┌──────────┐ │   │
│  │  │  Users   │ │ Projects │ │ Nodes │ │  Rows    │ │   │
│  │  └──────────┘ └──────────┘ └───────┘ └──────────┘ │   │
│  │                                                      │   │
│  │  ┌──────────────────┐                              │   │
│  │  │  Connections     │                              │   │
│  │  └──────────────────┘                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Frontend Architecture

```
public/
├── templates/          # HTML Pages
├── scripts/
│   ├── config/        # Configuration (colors, icons, types)
│   ├── core/          # Core canvas functionality
│   │   ├── canvas.js          (Main canvas controller)
│   │   ├── viewport.js        (Zoom/Pan management)
│   │   └── grid.js            (Grid system)
│   ├── models/        # Data models
│   │   ├── nodeManager.js     (Node state management)
│   │   └── connectionModel.js (Connection state)
│   ├── rendering/     # Rendering layers
│   │   ├── nodeLayer.js       (Node rendering)
│   │   └── connectionLayer.js (Connection rendering)
│   ├── ui/            # User interface
│   │   ├── interactionController.js (Event handling)
│   │   ├── popupMenu.js          (Context menus)
│   │   └── sidebar/              (Sidebar components)
│   └── utils/         # Utilities
│       └── sqlExport.js   (SQL generation)
└── css/               # Modular stylesheets
```

### 2.3 Backend Architecture

```
src/
├── index.ts           # Express app entry point
└── db/
    ├── db.ts          # MySQL connection pool
    ├── login.ts       # Authentication routes
    ├── projects.ts    # Project management routes
    └── canvas/
        ├── nodes.ts   # Node CRUD operations
        ├── rows.ts    # Row (column) operations
        └── connections.ts # Connection operations
```

---

## 3. Component Design

### 3.1 Backend Components

#### 3.1.1 Database Connection Pool
**File:** `src/db/db.ts`

```typescript
Configuration:
- Host: localhost
- User: root
- Database: drawsql
- Connection Pool: 10 connections
- Queue: Unlimited
```

**Responsibilities:**
- Manage MySQL connections
- Connection pooling for performance
- Handle connection errors
- Auto-reconnect on failure

#### 3.1.2 Express Server
**File:** `src/index.ts`

**Middleware Stack:**
1. `express.json()` - Parse JSON bodies
2. `express-session` - Session management
3. Custom authentication middleware (implied)
4. Static file serving

**Routes:**
- Authentication routes (loginRouter)
- Project management routes (projectRouter)
- Canvas/Node routes (nodeRouter)
- Static templates
- Public assets

**Session Configuration:**
- Secret: Environment-specific (currently hardcoded)
- Resave: false
- SaveUninitialized: true
- Cookie: Not secure (for development)

#### 3.1.3 API Routers

##### Login Router (`src/db/login.ts`)
- POST `/signup` - User registration
- POST `/login` - User authentication
- POST `/logout` - Session termination
- GET `/check-session` - Session validation

##### Project Router (`src/db/projects.ts`)
- GET `/projects` - List user projects
- POST `/projects` - Create new project
- GET `/projects/:id` - Get project details
- PUT `/projects/:id` - Update project
- DELETE `/projects/:id` - Delete project

##### Node Router (`src/db/canvas/nodes.js`)
- GET `/canvas/:projectId/nodes` - Get all nodes
- POST `/canvas/:projectId/nodes` - Create node
- PUT `/canvas/:projectId/nodes/:id` - Update node
- DELETE `/canvas/:projectId/nodes/:id` - Delete node
- GET `/canvas/:projectId/connections` - Get connections
- POST `/canvas/:projectId/connections` - Create connection

### 3.2 Frontend Components

#### 3.2.1 Canvas System

##### Canvas Class (`core/canvas.js`)
**Responsibilities:**
- Initialize canvas environment
- Manage transform container
- Coordinate viewport, grid, and layers
- Handle render loop
- Detect and trigger redraws

**Key Methods:**
```javascript
constructor(canvasElement, nodeManager)
setupCanvas()          // Initialize DOM structure
setupEventListeners()  // Wire up interactions
startRenderLoop()      // Begin animation frame loop
markDirty()            // Flag for redraw
render()               // Execute rendering pipeline
```

**Composition:**
- Contains: Viewport, Grid, NodeLayer, ConnectionLayer
- Manages: InteractionController, NodeManager

##### Viewport Class (`core/viewport.js`)
**Responsibilities:**
- Manage zoom level (0.1x to 3x)
- Handle pan position (x, y offset)
- Apply CSS transforms
- Coordinate transformations

**State:**
```javascript
{
  zoom: 1.0,
  offsetX: 0,
  offsetY: 0,
  minZoom: 0.1,
  maxZoom: 3.0
}
```

##### Grid Class (`core/grid.js`)
**Responsibilities:**
- Render background grid
- Snap-to-grid functionality
- Coordinate system
- Visual guides

#### 3.2.2 Node System

##### NodeManager Class (`models/nodeManager.js`)
**Responsibilities:**
- Maintain node state (Array of nodes)
- CRUD operations for nodes
- Node ID management
- State serialization

**Node Data Structure:**
```javascript
{
  id: String,
  type: String,          // 'table', 'view', 'query'
  name: String,
  x: Number,
  y: Number,
  width: Number,
  height: Number,
  rows: Array[Row],      // Columns/fields
  metadata: Object
}
```

##### NodeLayer Class (`rendering/nodeLayer.js`)
**Responsibilities:**
- Render all nodes to DOM
- Handle node DOM updates
- Manage node selection state
- Apply visual styling

##### Row (Column) Structure
```javascript
{
  id: String,
  name: String,
  type: String,          // 'int', 'varchar', etc.
  nullable: Boolean,
  primaryKey: Boolean,
  foreignKey: Boolean,
  default: String,
  visible: Boolean       // Show in SELECT
}
```

#### 3.2.3 Connection System

##### ConnectionModel Class (`models/connectionModel.js`)
**Responsibilities:**
- Manage connection state
- Validate connections
- Connection path calculation
- State persistence

**Connection Data Structure:**
```javascript
{
  id: String,
  sourceNodeId: String,
  sourceRowId: String,   // Column ID
  targetNodeId: String,
  targetRowId: String,   // Column ID
  joinType: String,      // 'INNER', 'LEFT', 'RIGHT', 'FULL'
  conditions: Array[Condition]
}
```

##### ConnectionLayer Class (`rendering/connectionLayer.js`)
**Responsibilities:**
- Render SVG connection paths
- Draw Bezier curves between nodes
- Handle connection selection
- Visual feedback (hover, selected)

**Rendering Strategy:**
- SVG paths for smooth curves
- Calculate anchor points on node edges
- Draw connection labels (join type)
- Handle z-index ordering

#### 3.2.4 UI Components

##### InteractionController (`ui/interactionController.js`)
**Responsibilities:**
- Mouse event handling
- Keyboard shortcuts
- Drag-and-drop operations
- Selection management

**Event Handling:**
- Canvas pan (drag background)
- Node drag (move nodes)
- Connection creation (drag from port)
- Zoom (wheel events)
- Selection (click events)
- Context menu (right-click)

##### Sidebar System (`ui/sidebar/`)
**Components:**
- `Sidebar.js` - Main sidebar controller
- `createNodeElement.js` - Node palette
- `editable.js` - Inline editing
- `events.js` - Event delegation
- `expandedState.js` - Collapse/expand state
- `modal.js` - Modal dialogs

**Features:**
- Node creation palette
- Table/view browser
- Property editor
- Query builder UI

##### PopupMenu (`ui/popupMenu.js`)
**Responsibilities:**
- Context menu display
- Menu item actions
- Position calculation
- Event handling

**Menu Actions:**
- Delete node
- Edit properties
- Copy/paste
- Connection options

#### 3.2.5 Utility Components

##### SQL Export (`utils/sqlExport.js`)
**Responsibilities:**
- Generate SQL from canvas state
- Build SELECT statements
- Handle JOINs
- Format WHERE clauses
- Generate CREATE TABLE statements

**Algorithm:**
1. Traverse node graph
2. Identify main table(s)
3. Build JOIN clauses from connections
4. Add WHERE conditions from nodes
5. Select specified columns
6. Format and return SQL

---

## 4. Database Design

### 4.1 Schema Overview

Database: `drawsql`

### 4.2 Tables

#### Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);
```

#### Projects Table
```sql
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  viewport_state JSON,        -- zoom, offset
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

#### Nodes Table
```sql
CREATE TABLE nodes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  node_type VARCHAR(50) NOT NULL,    -- 'table', 'view', 'query'
  name VARCHAR(255) NOT NULL,
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  width FLOAT DEFAULT 200,
  height FLOAT DEFAULT 150,
  metadata JSON,                     -- additional properties
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id)
);
```

#### Rows Table (Columns)
```sql
CREATE TABLE rows (
  id INT PRIMARY KEY AUTO_INCREMENT,
  node_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  data_type VARCHAR(100) NOT NULL,
  is_nullable BOOLEAN DEFAULT TRUE,
  is_primary_key BOOLEAN DEFAULT FALSE,
  is_foreign_key BOOLEAN DEFAULT FALSE,
  default_value VARCHAR(255),
  display_order INT NOT NULL,        -- order in node
  is_visible BOOLEAN DEFAULT TRUE,    -- show in SELECT
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  INDEX idx_node_id (node_id)
);
```

#### Connections Table
```sql
CREATE TABLE connections (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  source_node_id INT NOT NULL,
  source_row_id INT NOT NULL,        -- source column
  target_node_id INT NOT NULL,
  target_row_id INT NOT NULL,        -- target column
  join_type VARCHAR(20) NOT NULL,    -- 'INNER', 'LEFT', 'RIGHT', 'FULL'
  conditions JSON,                   -- additional join conditions
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (source_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (target_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (source_row_id) REFERENCES rows(id) ON DELETE CASCADE,
  FOREIGN KEY (target_row_id) REFERENCES rows(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_source_node (source_node_id),
  INDEX idx_target_node (target_node_id)
);
```

### 4.3 Entity Relationships

```
users (1) ──────────< (n) projects
                           │
                           ├──< (n) nodes ───────< (n) rows
                           │
                           └──< (n) connections
```

---

## 5. API Design

### 5.1 Authentication Endpoints

#### POST /signup
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User created successfully",
  "userId": 42
}
```

**Errors:**
- 400: Email already exists
- 400: Invalid email format
- 400: Password too weak

---

#### POST /login
Authenticate user and create session.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 42,
    "email": "user@example.com"
  }
}
```

**Errors:**
- 401: Invalid credentials
- 400: Missing email or password

---

#### POST /logout
Terminate user session.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 5.2 Project Endpoints

#### GET /projects
Get all projects for authenticated user.

**Response (200):**
```json
{
  "projects": [
    {
      "id": 1,
      "name": "E-commerce Database",
      "description": "Main store queries",
      "updated_at": "2026-01-14T10:30:00Z"
    }
  ]
}
```

---

#### POST /projects
Create a new project.

**Request:**
```json
{
  "name": "Analytics Dashboard",
  "description": "Customer analytics queries"
}
```

**Response (201):**
```json
{
  "success": true,
  "projectId": 5
}
```

---

#### GET /projects/:id
Get project details with viewport state.

**Response (200):**
```json
{
  "id": 5,
  "name": "Analytics Dashboard",
  "description": "Customer analytics queries",
  "viewport": {
    "zoom": 1.0,
    "offsetX": 0,
    "offsetY": 0
  },
  "updated_at": "2026-01-14T10:30:00Z"
}
```

---

#### PUT /projects/:id
Update project details.

**Request:**
```json
{
  "name": "Updated Name",
  "description": "New description",
  "viewport": {
    "zoom": 1.5,
    "offsetX": -100,
    "offsetY": 50
  }
}
```

---

#### DELETE /projects/:id
Delete a project (cascades to nodes, rows, connections).

**Response (200):**
```json
{
  "success": true,
  "message": "Project deleted"
}
```

---

### 5.3 Canvas/Node Endpoints

#### GET /canvas/:projectId/nodes
Get all nodes and rows for a project.

**Response (200):**
```json
{
  "nodes": [
    {
      "id": 10,
      "type": "table",
      "name": "users",
      "x": 100,
      "y": 200,
      "width": 200,
      "height": 250,
      "rows": [
        {
          "id": 1,
          "name": "id",
          "type": "INT",
          "nullable": false,
          "primaryKey": true,
          "visible": true
        },
        {
          "id": 2,
          "name": "email",
          "type": "VARCHAR(255)",
          "nullable": false,
          "primaryKey": false,
          "visible": true
        }
      ]
    }
  ]
}
```

---

#### POST /canvas/:projectId/nodes
Create a new node.

**Request:**
```json
{
  "type": "table",
  "name": "orders",
  "x": 400,
  "y": 200,
  "rows": [
    {
      "name": "id",
      "type": "INT",
      "primaryKey": true
    }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "nodeId": 11
}
```

---

#### PUT /canvas/:projectId/nodes/:id
Update node position, size, or properties.

**Request:**
```json
{
  "x": 450,
  "y": 250,
  "name": "orders_updated"
}
```

---

#### DELETE /canvas/:projectId/nodes/:id
Delete a node (cascades to rows and connections).

---

#### GET /canvas/:projectId/connections
Get all connections for a project.

**Response (200):**
```json
{
  "connections": [
    {
      "id": 1,
      "sourceNodeId": 10,
      "sourceRowId": 1,
      "targetNodeId": 11,
      "targetRowId": 3,
      "joinType": "INNER"
    }
  ]
}
```

---

#### POST /canvas/:projectId/connections
Create a new connection between nodes.

**Request:**
```json
{
  "sourceNodeId": 10,
  "sourceRowId": 1,
  "targetNodeId": 11,
  "targetRowId": 3,
  "joinType": "LEFT"
}
```

---

## 6. Data Flow

### 6.1 Project Loading Flow

```
1. User clicks project
   ↓
2. GET /projects/:id
   ↓
3. Receive project metadata
   ↓
4. Navigate to /canvas/:id
   ↓
5. Load canvas.html
   ↓
6. Initialize Canvas class
   ↓
7. GET /canvas/:id/nodes
   ↓
8. NodeManager loads nodes
   ↓
9. GET /canvas/:id/connections
   ↓
10. ConnectionModel loads connections
   ↓
11. Render nodes (NodeLayer)
   ↓
12. Render connections (ConnectionLayer)
   ↓
13. Apply viewport state (zoom, pan)
   ↓
14. Canvas ready for interaction
```

### 6.2 Node Creation Flow

```
1. User drags table from sidebar
   ↓
2. InteractionController handles drop
   ↓
3. Calculate canvas coordinates
   ↓
4. NodeManager.createNode()
   ↓
5. POST /canvas/:projectId/nodes
   ↓
6. Server inserts to database
   ↓
7. Return nodeId
   ↓
8. Update NodeManager state
   ↓
9. NodeLayer renders new node
   ↓
10. Canvas.markDirty() triggers redraw
```

### 6.3 Connection Creation Flow

```
1. User clicks source column port
   ↓
2. InteractionController enters "connection mode"
   ↓
3. Visual feedback (line follows cursor)
   ↓
4. User clicks target column port
   ↓
5. Validate connection (type compatibility)
   ↓
6. Show join type dialog
   ↓
7. User selects join type
   ↓
8. ConnectionModel.createConnection()
   ↓
9. POST /canvas/:projectId/connections
   ↓
10. Server inserts to database
    ↓
11. Return connectionId
    ↓
12. Update ConnectionModel state
    ↓
13. ConnectionLayer renders connection
    ↓
14. Canvas.markDirty() triggers redraw
```

### 6.4 SQL Export Flow

```
1. User clicks "Export SQL"
   ↓
2. SQLExport.generate(nodeManager, connectionModel)
   ↓
3. Traverse node graph:
   - Identify FROM tables
   - Build JOIN clauses
   - Collect WHERE conditions
   - List SELECT columns
   ↓
4. Format SQL string
   ↓
5. Validate SQL syntax
   ↓
6. Display in modal
   ↓
7. User copies or downloads
```

---

## 7. Security Considerations

### 7.1 Authentication
- Passwords hashed with bcrypt (salt rounds: 10+)
- Session-based authentication
- HTTPS in production (currently HTTP for dev)
- Session secret from environment variables
- Session timeout: 24 hours

### 7.2 Authorization
- Row-level security (users can only access their projects)
- Middleware checks session on protected routes
- Foreign key constraints prevent orphan data
- Cascade deletes for data consistency

### 7.3 Input Validation
- Email format validation
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize inputs)
- CSRF tokens for state-changing operations
- Rate limiting on auth endpoints

### 7.4 Data Protection
- Database credentials in environment variables
- Connection pooling with limits
- Prepared statements for all queries
- JSON validation on API inputs
- No sensitive data in client state

---

## 8. Performance Optimizations

### 8.1 Backend
- Connection pooling (10 connections)
- Database indexing on foreign keys
- Efficient JSON storage for metadata
- Lazy loading of project details
- Query result caching (planned)

### 8.2 Frontend
- RequestAnimationFrame for smooth rendering
- Dirty flag pattern (render only when changed)
- Virtual scrolling for large node lists
- Debounced auto-save
- Event delegation for node interactions
- SVG optimization for connections

### 8.3 Database
- Indexes on user_id, project_id
- CASCADE deletes for cleanup
- JSON columns for flexible metadata
- Normalized schema to reduce redundancy

---

## 9. Development Workflow

### 9.1 Build Process
```bash
# Compile TypeScript
npm run build   # tsc --build

# Development mode
npm run dev     # ts-node src/index.ts

# Production
node dist/index.js
```

### 9.2 File Structure
- Source: `src/` (TypeScript)
- Output: `dist/` (JavaScript)
- Static: `public/` (HTML, CSS, JS)
- Config: Root level (tsconfig.json, package.json)

### 9.3 Module System
- ES Modules throughout
- Import with `.js` extensions
- Type definitions in `dist/`
- Source maps enabled

---

## 10. Future Enhancements

### 10.1 Technical Debt
- [ ] Move session secret to environment variables
- [ ] Implement proper error handling middleware
- [ ] Add request logging
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Implement HTTPS in production
- [ ] Add CSRF protection
- [ ] Implement rate limiting

### 10.2 Performance
- [ ] Implement Redis session store
- [ ] Add query result caching
- [ ] Optimize SQL query generation
- [ ] Implement lazy loading for large projects
- [ ] Add WebSocket for real-time collaboration
- [ ] Implement server-side rendering

### 10.3 Features
- [ ] Undo/Redo with command pattern
- [ ] Export to multiple SQL dialects
- [ ] Import from existing databases
- [ ] Real-time collaboration
- [ ] Query execution and results preview
- [ ] Query performance analysis

---

## 11. Deployment Architecture

### 11.1 Development
```
localhost:3000 (Express)
   ↓
localhost:3306 (MySQL)
```

### 11.2 Production (Proposed)
```
NGINX (Reverse Proxy)
   ↓
Node.js (PM2 Cluster)
   ↓
MySQL (RDS/Cloud SQL)
   ↓
Redis (Session Store)
```

### 11.3 Environment Variables
```
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=***
DB_NAME=drawsql
SESSION_SECRET=***
REDIS_URL=***
```

---

## 12. Testing Strategy

### 12.1 Unit Tests
- Database connection pool
- API route handlers
- SQL export logic
- Node state management
- Connection validation

### 12.2 Integration Tests
- Authentication flow
- Project CRUD operations
- Canvas state persistence
- SQL generation accuracy

### 12.3 E2E Tests
- User registration/login
- Create and load project
- Add nodes and connections
- Export SQL
- Delete project

---

## 13. Monitoring & Logging

### 13.1 Application Logs
- Request/response logging
- Error stack traces
- Database query logs
- Session events
- Performance metrics

### 13.2 Metrics (Planned)
- Response times
- Error rates
- Active users
- Database connection pool usage
- Memory usage

---

## 14. Dependencies

### 14.1 Production Dependencies
```json
{
  "express": "^5.2.1",           // Web framework
  "express-session": "^1.18.2",  // Session management
  "mysql2": "^3.16.0"            // MySQL driver
}
```

### 14.2 Development Dependencies
```json
{
  "@types/express": "^5.0.6",
  "@types/express-session": "^1.18.2",
  "@types/node": "^25.0.3",
  "ts-node": "^10.9.2",
  "typescript": "^5.9.3"
}
```

---

## 15. Configuration Files

### 15.1 TypeScript Configuration (tsconfig.json)
- **Module:** NodeNext (ES Modules)
- **Target:** ESNext
- **Root:** ./src
- **Output:** ./dist
- **Source Maps:** Enabled
- **Declarations:** Enabled
- **Strict Checks:** Enabled

### 15.2 Package Configuration (package.json)
- **Type:** "module" (ES Modules)
- **Main:** index.js
- **Scripts:** test, build, dev

---

## Appendix A: Glossary

- **Node:** Visual representation of a database table or query component
- **Row:** Column/field within a node (database column)
- **Connection:** Visual line representing a JOIN between tables
- **Viewport:** Visible area of the canvas with zoom and pan state
- **Canvas:** Main drawing area for query visualization
- **Layer:** Rendering component (NodeLayer, ConnectionLayer)
- **Manager:** State management component (NodeManager)

---

## Appendix B: References

- Express.js Documentation: https://expressjs.com/
- MySQL2 Documentation: https://github.com/sidorares/node-mysql2
- TypeScript Handbook: https://www.typescriptlang.org/docs/
- HTML5 Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
- SVG Specification: https://www.w3.org/TR/SVG2/

---

**Document Status:** Living Document  
**Last Updated:** January 14, 2026  
**Maintained By:** Development Team

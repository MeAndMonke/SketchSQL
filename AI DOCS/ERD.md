# SketchSQL - Entity Relationship Diagram (ERD)

## Document Information
- **Version:** 1.0
- **Date:** January 14, 2026
- **Project:** SketchSQL - Visual SQL Query Builder
- **Database:** drawsql (MySQL 8.0+)

---

## 1. ERD Overview

This document describes the database schema for SketchSQL, including all entities, their attributes, relationships, and constraints.

---

## 2. Visual ERD

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SketchSQL Database Schema                    │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│       USERS          │
├──────────────────────┤
│ PK  id               │ INT AUTO_INCREMENT
│     email            │ VARCHAR(255) UNIQUE NOT NULL
│     password_hash    │ VARCHAR(255) NOT NULL
│     created_at       │ TIMESTAMP
│     updated_at       │ TIMESTAMP
└──────────────────────┘
          │
          │ 1
          │
          │ owns
          │
          │ n
          ▼
┌──────────────────────┐
│      PROJECTS        │
├──────────────────────┤
│ PK  id               │ INT AUTO_INCREMENT
│ FK  user_id          │ INT NOT NULL
│     name             │ VARCHAR(255) NOT NULL
│     description      │ TEXT
│     viewport_state   │ JSON
│     created_at       │ TIMESTAMP
│     updated_at       │ TIMESTAMP
└──────────────────────┘
          │
          ├────────────────────────────┐
          │                            │
          │ 1                          │ 1
          │                            │
          │ contains                   │ has
          │                            │
          │ n                          │ n
          ▼                            ▼
┌──────────────────────┐     ┌─────────────────────────┐
│       NODES          │     │     CONNECTIONS         │
├──────────────────────┤     ├─────────────────────────┤
│ PK  id               │◄───┐│ PK  id                  │ INT AUTO_INCREMENT
│ FK  project_id       │    ││ FK  project_id          │ INT NOT NULL
│     node_type        │    ││ FK  source_node_id      │ INT NOT NULL
│     name             │    ││ FK  source_row_id       │ INT NOT NULL
│     position_x       │    ││ FK  target_node_id      │ INT NOT NULL
│     position_y       │    ││ FK  target_row_id       │ INT NOT NULL
│     width            │    ││     join_type           │ VARCHAR(20) NOT NULL
│     height           │    ││     conditions          │ JSON
│     metadata         │    ││     created_at          │ TIMESTAMP
│     created_at       │    │└─────────────────────────┘
└──────────────────────┘    │          │    │
          │                 │          │    │
          │ 1               │          │    │
          │                 │          │    │
          │ has             │          │    │
          │                 │          │    └─────────┐
          │ n               │          │              │
          ▼                 │          │              │
┌──────────────────────┐    │          │              │
│        ROWS          │    │          │              │
├──────────────────────┤    │          │              │
│ PK  id               │────┘          │              │
│ FK  node_id          │               │              │
│     name             │◄──────────────┘              │
│     data_type        │                              │
│     is_nullable      │◄─────────────────────────────┘
│     is_primary_key   │
│     is_foreign_key   │
│     default_value    │
│     display_order    │
│     is_visible       │
│     created_at       │
└──────────────────────┘
```

---

## 3. Entity Definitions

### 3.1 USERS Entity

**Purpose:** Stores user account information for authentication and authorization.

**Attributes:**

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | User's email address for login |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE INDEX idx_email (email)

**Business Rules:**
- Email must be unique across all users
- Password must be hashed using bcrypt with 10+ salt rounds
- Email format validated before insertion
- Soft delete possible via is_deleted flag (future enhancement)

---

### 3.2 PROJECTS Entity

**Purpose:** Stores user projects, each representing a visual SQL query design.

**Attributes:**

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique project identifier |
| user_id | INT | NOT NULL, FOREIGN KEY | Owner user reference |
| name | VARCHAR(255) | NOT NULL | Project display name |
| description | TEXT | NULL | Optional project description |
| viewport_state | JSON | NULL | Canvas zoom and pan state |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Project creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Last modification timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX idx_user_id (user_id)
- INDEX idx_updated_at (updated_at) - for sorting by recent

**Foreign Keys:**
- user_id REFERENCES users(id) ON DELETE CASCADE

**Business Rules:**
- Project name must be unique per user (enforced at application level)
- Deleting user cascades to all their projects
- viewport_state stores: { zoom: float, offsetX: float, offsetY: float }
- Maximum 255 characters for project name

**Sample viewport_state JSON:**
```json
{
  "zoom": 1.5,
  "offsetX": -200,
  "offsetY": 150
}
```

---

### 3.3 NODES Entity

**Purpose:** Represents individual database tables or query components on the canvas.

**Attributes:**

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique node identifier |
| project_id | INT | NOT NULL, FOREIGN KEY | Parent project reference |
| node_type | VARCHAR(50) | NOT NULL | Type: 'table', 'view', 'query' |
| name | VARCHAR(255) | NOT NULL | Table/node name |
| position_x | FLOAT | NOT NULL | X coordinate on canvas |
| position_y | FLOAT | NOT NULL | Y coordinate on canvas |
| width | FLOAT | DEFAULT 200 | Node width in pixels |
| height | FLOAT | DEFAULT 150 | Node height in pixels |
| metadata | JSON | NULL | Additional node properties |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Node creation timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX idx_project_id (project_id)

**Foreign Keys:**
- project_id REFERENCES projects(id) ON DELETE CASCADE

**Business Rules:**
- Node name typically matches database table name
- Position coordinates can be negative (unlimited canvas)
- Multiple nodes with same table name allowed (duplicate tables in query)
- Deleting project cascades to all nodes
- node_type constrained to: 'table', 'view', 'query'

**Sample metadata JSON:**
```json
{
  "alias": "u",
  "color": "#3498db",
  "collapsed": false,
  "whereClause": "status = 'active'"
}
```

---

### 3.4 ROWS Entity

**Purpose:** Stores column/field information for each node, representing database columns.

**Attributes:**

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique row identifier |
| node_id | INT | NOT NULL, FOREIGN KEY | Parent node reference |
| name | VARCHAR(255) | NOT NULL | Column name |
| data_type | VARCHAR(100) | NOT NULL | SQL data type (INT, VARCHAR, etc.) |
| is_nullable | BOOLEAN | DEFAULT TRUE | Whether column allows NULL |
| is_primary_key | BOOLEAN | DEFAULT FALSE | Whether column is primary key |
| is_foreign_key | BOOLEAN | DEFAULT FALSE | Whether column is foreign key |
| default_value | VARCHAR(255) | NULL | Default value if specified |
| display_order | INT | NOT NULL | Order of column in node (0-based) |
| is_visible | BOOLEAN | DEFAULT TRUE | Include in SELECT clause |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Row creation timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX idx_node_id (node_id)
- INDEX idx_display_order (node_id, display_order) - for sorting columns

**Foreign Keys:**
- node_id REFERENCES nodes(id) ON DELETE CASCADE

**Business Rules:**
- display_order determines visual order within node
- is_visible controls whether column appears in SELECT
- At least one column should be visible per node (enforced at app level)
- Column name matches actual database column name
- Deleting node cascades to all rows
- Primary key columns typically not nullable

**Common Data Types:**
- INT, BIGINT, SMALLINT, TINYINT
- VARCHAR(n), CHAR(n), TEXT
- DECIMAL(p,s), FLOAT, DOUBLE
- DATE, DATETIME, TIMESTAMP
- BOOLEAN, ENUM

---

### 3.5 CONNECTIONS Entity

**Purpose:** Defines relationships (JOINs) between nodes through their columns.

**Attributes:**

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique connection identifier |
| project_id | INT | NOT NULL, FOREIGN KEY | Parent project reference |
| source_node_id | INT | NOT NULL, FOREIGN KEY | Source table node |
| source_row_id | INT | NOT NULL, FOREIGN KEY | Source column (from rows) |
| target_node_id | INT | NOT NULL, FOREIGN KEY | Target table node |
| target_row_id | INT | NOT NULL, FOREIGN KEY | Target column (from rows) |
| join_type | VARCHAR(20) | NOT NULL | JOIN type |
| conditions | JSON | NULL | Additional JOIN conditions |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Connection creation timestamp |

**Indexes:**
- PRIMARY KEY (id)
- INDEX idx_project_id (project_id)
- INDEX idx_source_node (source_node_id)
- INDEX idx_target_node (target_node_id)
- INDEX idx_source_row (source_row_id)
- INDEX idx_target_row (target_row_id)

**Foreign Keys:**
- project_id REFERENCES projects(id) ON DELETE CASCADE
- source_node_id REFERENCES nodes(id) ON DELETE CASCADE
- source_row_id REFERENCES rows(id) ON DELETE CASCADE
- target_node_id REFERENCES nodes(id) ON DELETE CASCADE
- target_row_id REFERENCES rows(id) ON DELETE CASCADE

**Business Rules:**
- join_type must be: 'INNER', 'LEFT', 'RIGHT', 'FULL'
- Default join_type: 'INNER'
- Self-joins allowed (source_node_id = target_node_id)
- Multiple connections between same nodes allowed
- Source and target columns should be compatible types (enforced at app level)
- Deleting either node or row cascades connection deletion
- Conditions stored as JSON array for flexibility

**Sample conditions JSON:**
```json
[
  {
    "operator": "AND",
    "leftSide": "users.status",
    "comparison": "=",
    "rightSide": "'active'"
  },
  {
    "operator": "AND",
    "leftSide": "users.created_at",
    "comparison": ">",
    "rightSide": "'2025-01-01'"
  }
]
```

---

## 4. Relationships

### 4.1 One-to-Many Relationships

#### users → projects (1:N)
- **Cardinality:** One user owns many projects
- **Foreign Key:** projects.user_id → users.id
- **Delete Rule:** CASCADE (deleting user deletes all their projects)
- **Business Rule:** User can have 0 to unlimited projects

#### projects → nodes (1:N)
- **Cardinality:** One project contains many nodes
- **Foreign Key:** nodes.project_id → projects.id
- **Delete Rule:** CASCADE (deleting project deletes all nodes)
- **Business Rule:** Project can have 0 to 100 nodes (soft limit)

#### projects → connections (1:N)
- **Cardinality:** One project has many connections
- **Foreign Key:** connections.project_id → projects.id
- **Delete Rule:** CASCADE (deleting project deletes all connections)
- **Business Rule:** Project can have 0 to unlimited connections

#### nodes → rows (1:N)
- **Cardinality:** One node has many rows (columns)
- **Foreign Key:** rows.node_id → nodes.id
- **Delete Rule:** CASCADE (deleting node deletes all rows)
- **Business Rule:** Node must have at least 1 row

### 4.2 Many-to-One Relationships

#### connections → nodes (N:1) [twice]
- **Source:** connections.source_node_id → nodes.id
- **Target:** connections.target_node_id → nodes.id
- **Delete Rule:** CASCADE (deleting either node deletes connection)
- **Business Rule:** Connection requires both source and target nodes

#### connections → rows (N:1) [twice]
- **Source:** connections.source_row_id → rows.id
- **Target:** connections.target_row_id → rows.id
- **Delete Rule:** CASCADE (deleting either row deletes connection)
- **Business Rule:** Connection requires both source and target columns

### 4.3 Relationship Summary Table

| Parent Entity | Child Entity | Relationship Type | Foreign Key | Delete Rule |
|--------------|--------------|-------------------|-------------|-------------|
| users | projects | 1:N | projects.user_id | CASCADE |
| projects | nodes | 1:N | nodes.project_id | CASCADE |
| projects | connections | 1:N | connections.project_id | CASCADE |
| nodes | rows | 1:N | rows.node_id | CASCADE |
| nodes | connections | 1:N | connections.source_node_id | CASCADE |
| nodes | connections | 1:N | connections.target_node_id | CASCADE |
| rows | connections | 1:N | connections.source_row_id | CASCADE |
| rows | connections | 1:N | connections.target_row_id | CASCADE |

---

## 5. Database Constraints

### 5.1 Primary Key Constraints
All tables have AUTO_INCREMENT integer primary keys for simplicity and performance.

### 5.2 Foreign Key Constraints
All foreign keys use CASCADE delete to maintain referential integrity and automatically clean up orphaned records.

### 5.3 Unique Constraints
- users.email - Ensures unique email addresses
- (users.id, projects.name) - Application-level uniqueness for project names per user

### 5.4 Check Constraints (Application-Level)
- join_type IN ('INNER', 'LEFT', 'RIGHT', 'FULL')
- node_type IN ('table', 'view', 'query')
- email matches valid email regex pattern
- password_hash length >= 60 (bcrypt hash)

### 5.5 Not Null Constraints
Critical fields that cannot be null:
- users: email, password_hash
- projects: user_id, name
- nodes: project_id, node_type, name, position_x, position_y
- rows: node_id, name, data_type, display_order
- connections: all FK fields, join_type

---

## 6. Indexes

### 6.1 Primary Indexes
Every table has a clustered primary key index on `id`.

### 6.2 Foreign Key Indexes
Indexes on all foreign key columns for join performance:
- projects(user_id)
- nodes(project_id)
- rows(node_id)
- connections(project_id, source_node_id, target_node_id, source_row_id, target_row_id)

### 6.3 Query Optimization Indexes
- users(email) - UNIQUE index for login queries
- projects(updated_at) - For sorting projects by recent activity
- rows(node_id, display_order) - Composite index for ordered column retrieval

### 6.4 Index Strategy
- All foreign keys indexed
- Frequently queried columns indexed
- Composite indexes for common query patterns
- Avoid over-indexing (impacts INSERT/UPDATE performance)

---

## 7. Data Integrity Rules

### 7.1 Referential Integrity
- All foreign keys enforced at database level
- CASCADE deletes ensure no orphaned records
- Parent record cannot be deleted if children exist (exception: CASCADE)

### 7.2 Domain Integrity
- Data types strictly enforced
- NOT NULL constraints on required fields
- DEFAULT values for optional fields
- TIMESTAMP fields auto-maintained

### 7.3 Entity Integrity
- Every record has unique primary key
- Primary keys never null
- Primary keys immutable (never updated)

### 7.4 Business Logic Integrity (Application Layer)
- Email uniqueness validation
- Project name uniqueness per user
- Password strength validation
- Column type compatibility for connections
- At least one visible column per node

---

## 8. SQL Schema Creation

### 8.1 Create Database
```sql
CREATE DATABASE IF NOT EXISTS drawsql
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE drawsql;
```

### 8.2 Create Users Table
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 8.3 Create Projects Table
```sql
CREATE TABLE projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  viewport_state JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_updated_at (updated_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 8.4 Create Nodes Table
```sql
CREATE TABLE nodes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  node_type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  width FLOAT DEFAULT 200,
  height FLOAT DEFAULT 150,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_id (project_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 8.5 Create Rows Table
```sql
CREATE TABLE rows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  node_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  data_type VARCHAR(100) NOT NULL,
  is_nullable BOOLEAN DEFAULT TRUE,
  is_primary_key BOOLEAN DEFAULT FALSE,
  is_foreign_key BOOLEAN DEFAULT FALSE,
  default_value VARCHAR(255),
  display_order INT NOT NULL,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_node_id (node_id),
  INDEX idx_display_order (node_id, display_order),
  FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 8.6 Create Connections Table
```sql
CREATE TABLE connections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  source_node_id INT NOT NULL,
  source_row_id INT NOT NULL,
  target_node_id INT NOT NULL,
  target_row_id INT NOT NULL,
  join_type VARCHAR(20) NOT NULL DEFAULT 'INNER',
  conditions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_project_id (project_id),
  INDEX idx_source_node (source_node_id),
  INDEX idx_target_node (target_node_id),
  INDEX idx_source_row (source_row_id),
  INDEX idx_target_row (target_row_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (source_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (target_node_id) REFERENCES nodes(id) ON DELETE CASCADE,
  FOREIGN KEY (source_row_id) REFERENCES rows(id) ON DELETE CASCADE,
  FOREIGN KEY (target_row_id) REFERENCES rows(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 9. Sample Data

### 9.1 Sample User
```sql
INSERT INTO users (email, password_hash) VALUES
('demo@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456789');
-- Password: demo123 (hashed with bcrypt)
```

### 9.2 Sample Project
```sql
INSERT INTO projects (user_id, name, description, viewport_state) VALUES
(1, 'E-commerce Analytics', 'Customer and order analysis queries', 
 '{"zoom": 1.0, "offsetX": 0, "offsetY": 0}');
```

### 9.3 Sample Nodes
```sql
INSERT INTO nodes (project_id, node_type, name, position_x, position_y) VALUES
(1, 'table', 'users', 100, 200),
(1, 'table', 'orders', 500, 200);
```

### 9.4 Sample Rows
```sql
INSERT INTO rows (node_id, name, data_type, is_primary_key, display_order, is_visible) VALUES
-- Users table columns
(1, 'id', 'INT', TRUE, 0, TRUE),
(1, 'email', 'VARCHAR(255)', FALSE, 1, TRUE),
(1, 'created_at', 'TIMESTAMP', FALSE, 2, FALSE),
-- Orders table columns
(2, 'id', 'INT', TRUE, 0, TRUE),
(2, 'user_id', 'INT', FALSE, 1, TRUE),
(2, 'total', 'DECIMAL(10,2)', FALSE, 2, TRUE);
```

### 9.5 Sample Connection
```sql
INSERT INTO connections (project_id, source_node_id, source_row_id, 
                         target_node_id, target_row_id, join_type) VALUES
(1, 1, 1, 2, 5, 'INNER');
-- Connects users.id (row 1) to orders.user_id (row 5)
```

---

## 10. Query Examples

### 10.1 Get User's Projects
```sql
SELECT p.id, p.name, p.description, p.updated_at
FROM projects p
WHERE p.user_id = ?
ORDER BY p.updated_at DESC;
```

### 10.2 Load Project with Nodes and Rows
```sql
-- Get project
SELECT * FROM projects WHERE id = ?;

-- Get all nodes for project
SELECT * FROM nodes WHERE project_id = ? ORDER BY created_at;

-- Get all rows for each node
SELECT * FROM rows WHERE node_id IN (?) ORDER BY display_order;

-- Get all connections
SELECT * FROM connections WHERE project_id = ?;
```

### 10.3 Delete Project (Cascades)
```sql
-- This single delete cascades to nodes, rows, and connections
DELETE FROM projects WHERE id = ? AND user_id = ?;
```

### 10.4 Find Connections for Node
```sql
SELECT c.*, 
       src.name as source_column, 
       tgt.name as target_column
FROM connections c
JOIN rows src ON c.source_row_id = src.id
JOIN rows tgt ON c.target_row_id = tgt.id
WHERE c.source_node_id = ? OR c.target_node_id = ?;
```

---

## 11. Database Maintenance

### 11.1 Backup Strategy
- Daily full backups
- Transaction log backups every hour
- Retention: 30 days
- Offsite backup storage

### 11.2 Performance Monitoring
- Monitor slow queries (> 1 second)
- Track table sizes and growth
- Monitor index usage
- Check for missing indexes

### 11.3 Optimization
- Regular ANALYZE TABLE for statistics
- Rebuild indexes periodically
- Archive old projects (future enhancement)
- Partition large tables if needed (future)

---

## 12. Future Enhancements

### 12.1 Additional Tables (Planned)

#### Sessions Table (for better session management)
```sql
CREATE TABLE sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  expires TIMESTAMP NOT NULL,
  data TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Audit Log Table (for tracking changes)
```sql
CREATE TABLE audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT NOT NULL,
  changes JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Project Versions (for version control)
```sql
CREATE TABLE project_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  version_number INT NOT NULL,
  snapshot JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

### 12.2 Schema Extensions
- Add soft delete flags (is_deleted)
- Add user roles and permissions
- Add project sharing/collaboration
- Add project templates
- Add custom color schemes per user

---

## Appendix A: Cardinality Notation

- **1** - Exactly one
- **0..1** - Zero or one
- **1..N** - One to many
- **0..N** - Zero to many
- **N** - Many

---

## Appendix B: Database Design Principles Applied

1. **Normalization:** Database is in 3NF (Third Normal Form)
   - No repeating groups
   - All non-key attributes depend on the key
   - No transitive dependencies

2. **Referential Integrity:** All relationships enforced with foreign keys

3. **Data Integrity:** Constraints and data types enforce valid data

4. **Performance:** Strategic indexing on foreign keys and query columns

5. **Scalability:** Design supports growth with proper indexing

6. **Maintainability:** Clear naming conventions and documentation

---

**Document Status:** Living Document  
**Last Updated:** January 14, 2026  
**Database Version:** 1.0  
**Maintained By:** Database Team

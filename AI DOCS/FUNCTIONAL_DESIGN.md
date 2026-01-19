# SketchSQL - Functional Design Document

## Document Information
- **Version:** 1.0
- **Date:** January 14, 2026
- **Project:** SketchSQL - Visual SQL Query Builder
- **Repository:** MeAndMonke/SketchSQL

---

## 1. Executive Summary

### 1.1 Purpose
This document describes the functional specifications of SketchSQL, a web-based visual SQL query builder. It outlines what the system does, how users interact with it, and the business rules that govern its behavior.

### 1.2 Scope
SketchSQL enables users to:
- Create database queries visually using drag-and-drop nodes
- Visualize table relationships and joins
- Generate SQL code from visual representations
- Save and manage multiple query projects
- Collaborate on database design and query building

### 1.3 Target Audience
- Database administrators
- Business analysts
- Software developers
- Data scientists
- SQL learners and students

---

## 2. System Overview

### 2.1 Product Vision
SketchSQL transforms the complex task of writing SQL queries into an intuitive visual experience. Users can drag database tables onto a canvas, connect them to define relationships, and automatically generate SQL code - eliminating the need to memorize syntax while maintaining full query control.

### 2.2 Key Benefits
- **Reduced Learning Curve:** Visual interface lowers barrier to SQL
- **Fewer Errors:** Visual validation prevents syntax mistakes
- **Faster Development:** Drag-and-drop is faster than typing
- **Better Understanding:** Visual representation aids comprehension
- **Collaboration:** Shared projects enable team work

---

## 3. User Roles and Permissions

### 3.1 Guest User (Not Logged In)
**Access:**
- View landing page
- Access sign up page
- Access login page

**Restrictions:**
- Cannot create projects
- Cannot access canvas
- Cannot save work

### 3.2 Registered User (Logged In)
**Access:**
- All Guest User privileges
- Create new projects
- Open and edit own projects
- Delete own projects
- Export SQL from projects
- Update profile settings

**Restrictions:**
- Cannot access other users' projects
- Cannot perform admin functions

### 3.3 Administrator (Future)
**Access:**
- All Registered User privileges
- View all users and projects
- Manage user accounts
- Access system analytics
- Configure system settings

---

## 4. Functional Requirements

### 4.1 User Management

#### FR-1.1: User Registration
**Priority:** Must Have  
**Description:** System shall allow new users to create accounts.

**Acceptance Criteria:**
- User provides valid email address
- User provides password (minimum 8 characters)
- User confirms password (must match)
- System validates email format
- System checks email uniqueness
- System creates user account
- System displays confirmation message
- User is redirected to login page

**Business Rules:**
- Email must be unique across all users
- Password must meet security requirements
- Account is active immediately upon creation

---

#### FR-1.2: User Login
**Priority:** Must Have  
**Description:** System shall authenticate users and establish sessions.

**Acceptance Criteria:**
- User enters email and password
- System validates credentials
- System creates session on success
- User is redirected to projects page
- Session persists across page refreshes
- Error message displayed for invalid credentials

**Business Rules:**
- Maximum 5 login attempts per 15 minutes
- Session expires after 24 hours of inactivity
- User can only have one active session

---

#### FR-1.3: User Logout
**Priority:** Must Have  
**Description:** System shall allow users to terminate their session.

**Acceptance Criteria:**
- User clicks logout button
- System destroys session
- User is redirected to login page
- Protected pages no longer accessible
- Confirmation message displayed

---

#### FR-1.4: Password Management
**Priority:** Should Have  
**Description:** System shall allow users to change passwords.

**Acceptance Criteria:**
- User enters current password
- User enters new password
- User confirms new password
- System validates current password
- System updates password on success
- Confirmation message displayed

**Business Rules:**
- Must provide correct current password
- New password must meet security requirements
- New password cannot match previous password

---

### 4.2 Project Management

#### FR-2.1: Create Project
**Priority:** Must Have  
**Description:** System shall allow users to create new query projects.

**Acceptance Criteria:**
- User clicks "New Project" button
- System displays project creation dialog
- User enters project name (required)
- User enters project description (optional)
- System validates input
- System creates project in database
- User is redirected to canvas editor
- Project appears in user's project list

**Business Rules:**
- Project name required (1-255 characters)
- Project belongs to creating user
- Project name must be unique per user
- Empty canvas initialized for new project

---

#### FR-2.2: View Project List
**Priority:** Must Have  
**Description:** System shall display all projects belonging to logged-in user.

**Acceptance Criteria:**
- User navigates to home/projects page
- System displays list of user's projects
- Each project shows: name, description, last modified date
- Projects sorted by last modified (newest first)
- Empty state shown if no projects exist
- User can click project to open

**Business Rules:**
- Only user's own projects displayed
- Deleted projects not shown
- List updates in real-time after changes

---

#### FR-2.3: Open Project
**Priority:** Must Have  
**Description:** System shall allow users to open existing projects for editing.

**Acceptance Criteria:**
- User clicks project from list
- System loads project data from database
- User is redirected to canvas editor
- Canvas displays all saved nodes and connections
- Viewport restored to last saved state
- Project ready for editing

**Business Rules:**
- User can only open own projects
- Loading failure shows error message
- Unsaved changes in current project prompt save dialog

---

#### FR-2.4: Save Project
**Priority:** Must Have  
**Description:** System shall persist project changes to database.

**Acceptance Criteria:**
- User clicks "Save" button or uses keyboard shortcut
- System validates project state
- System saves all nodes, connections, and viewport
- System updates "last modified" timestamp
- Success message displayed
- Save indicator updated

**Business Rules:**
- Auto-save every 2 minutes (optional)
- Save validates query structure
- Failed save displays error and allows retry
- Saving updates project list

---

#### FR-2.5: Rename Project
**Priority:** Should Have  
**Description:** System shall allow users to rename projects.

**Acceptance Criteria:**
- User accesses project settings
- User enters new project name
- System validates name
- System updates project in database
- Confirmation message displayed
- Project list reflects new name

**Business Rules:**
- New name must be unique for user
- Name required (cannot be empty)
- Updates last modified timestamp

---

#### FR-2.6: Delete Project
**Priority:** Must Have  
**Description:** System shall allow users to permanently delete projects.

**Acceptance Criteria:**
- User clicks delete icon on project
- System displays confirmation dialog
- Dialog shows project name to confirm
- User confirms deletion
- System deletes project and all related data
- Project removed from list
- Confirmation message displayed

**Business Rules:**
- Deletion is permanent (no undo)
- Deletes all nodes, connections, and rows
- Cannot delete currently open project
- Requires explicit confirmation

---

#### FR-2.7: Search Projects
**Priority:** Should Have  
**Description:** System shall allow users to search their projects.

**Acceptance Criteria:**
- Search bar visible on projects page
- User types search query
- List filters in real-time
- Matches project name and description
- Search is case-insensitive
- Clear button resets search

**Business Rules:**
- Search only within user's projects
- Minimum 1 character to activate search
- No results shows empty state message

---

### 4.3 Canvas Operations

#### FR-3.1: Initialize Canvas
**Priority:** Must Have  
**Description:** System shall provide interactive canvas for query building.

**Acceptance Criteria:**
- Canvas loads on project open
- Grid background visible
- Toolbar and sidebar displayed
- Zoom controls available
- Empty canvas for new projects
- Saved content for existing projects

**Business Rules:**
- Default zoom level: 100%
- Default pan position: center
- Canvas dimensions: unlimited scrollable area
- Grid spacing: 20px

---

#### FR-3.2: Create Node
**Priority:** Must Have  
**Description:** System shall allow users to add database table nodes to canvas.

**Acceptance Criteria:**
- User drags table from sidebar to canvas
- Node appears at drop location
- Node displays table name
- Node shows column list
- Node is selectable and moveable
- Node saved to database

**Alternative Flow:**
- User clicks "Add Table" button
- System places node at canvas center

**Business Rules:**
- Each node represents a database table
- Node includes: name, position (x,y), size
- Duplicate tables allowed (same table can appear multiple times)
- Node ID must be unique

---

#### FR-3.3: Move Node
**Priority:** Must Have  
**Description:** System shall allow users to reposition nodes on canvas.

**Acceptance Criteria:**
- User clicks and holds node
- Cursor changes to move indicator
- Node follows mouse movement
- Other nodes and connections update
- Node position updates on mouse release
- Changes persist on save

**Business Rules:**
- Nodes cannot overlap (optional snap-to-grid)
- Connections auto-adjust during move
- Moving multiple selected nodes maintains relative positions
- Undo/redo captures position changes

---

#### FR-3.4: Edit Node
**Priority:** Must Have  
**Description:** System shall allow users to configure node properties.

**Acceptance Criteria:**
- User double-clicks node or selects edit option
- Properties panel opens
- User can modify: table alias, selected columns, filters
- Changes preview in real-time
- User confirms or cancels changes
- Valid changes persist to database

**Business Rules:**
- Table name cannot be changed (read-only)
- At least one column must be selected
- Invalid WHERE clauses show validation error
- Column aliases must be unique within node

---

#### FR-3.5: Delete Node
**Priority:** Must Have  
**Description:** System shall allow users to remove nodes from canvas.

**Acceptance Criteria:**
- User selects node
- User presses Delete key or clicks delete button
- System displays confirmation (if node has connections)
- Node removed from canvas
- All connections to node also deleted
- Change persists on save

**Business Rules:**
- Deleting node deletes all connections
- Deletion can be undone (if undo enabled)
- Confirmation required if node has connections
- No confirmation for isolated nodes

---

#### FR-3.6: Create Connection
**Priority:** Must Have  
**Description:** System shall allow users to create relationships between nodes.

**Acceptance Criteria:**
- User clicks column port on source node
- User drags to target column port
- Visual feedback during drag (line follows cursor)
- User releases on valid target port
- Join configuration dialog appears
- User selects join type (INNER, LEFT, RIGHT, FULL)
- Connection line appears between nodes
- Connection saved to database

**Business Rules:**
- Connections must link columns of compatible types
- Self-joins allowed (node connects to itself)
- Multiple connections between same nodes allowed
- Connection validates cardinality

---

#### FR-3.7: Edit Connection
**Priority:** Should Have  
**Description:** System shall allow users to modify connection properties.

**Acceptance Criteria:**
- User clicks on connection line
- Properties panel displays connection details
- User can change join type
- User can add additional join conditions
- Changes apply immediately
- Changes persist on save

**Business Rules:**
- Join type options: INNER, LEFT, RIGHT, FULL OUTER
- Additional conditions use AND logic
- Invalid conditions show validation error

---

#### FR-3.8: Delete Connection
**Priority:** Must Have  
**Description:** System shall allow users to remove connections.

**Acceptance Criteria:**
- User selects connection line
- User presses Delete key or right-clicks and selects delete
- Connection removed from canvas
- Connected nodes remain
- Change persists on save

**Business Rules:**
- No confirmation required
- Can be undone (if undo enabled)
- Deleting connection doesn't affect nodes

---

#### FR-3.9: Zoom Canvas
**Priority:** Must Have  
**Description:** System shall allow users to zoom in/out on canvas.

**Acceptance Criteria:**
- User scrolls mouse wheel to zoom
- Zoom controls (+/-) available in toolbar
- Zoom level indicator displays current percentage
- Zoom centers on mouse cursor position
- Node sizes scale proportionally
- Zoom level persists on save

**Business Rules:**
- Minimum zoom: 10%
- Maximum zoom: 300%
- Zoom increments: 10%
- Fit-to-screen option available

---

#### FR-3.10: Pan Canvas
**Priority:** Must Have  
**Description:** System shall allow users to navigate canvas by panning.

**Acceptance Criteria:**
- User clicks and drags canvas background
- Canvas content moves with mouse
- Pan position persists on save
- Mini-map shows current view (optional)

**Business Rules:**
- Pan unlimited in all directions
- Hand tool for explicit pan mode
- Spacebar+drag for temporary pan
- Reset view button returns to origin

---

#### FR-3.11: Select Elements
**Priority:** Must Have  
**Description:** System shall allow users to select nodes and connections.

**Acceptance Criteria:**
- User clicks node or connection to select
- Selected element highlighted
- Shift+click for multiple selection
- Drag marquee for area selection
- Click background to deselect all
- Selection count displayed

**Business Rules:**
- Only one selection type at a time (nodes OR connections)
- Selected elements can be deleted in batch
- Selected nodes can be moved together
- ESC key clears selection

---

#### FR-3.12: Copy/Paste Nodes
**Priority:** Should Have  
**Description:** System shall allow users to duplicate nodes.

**Acceptance Criteria:**
- User selects node(s)
- User presses Ctrl+C or uses Copy button
- User presses Ctrl+V or uses Paste button
- Duplicate nodes appear offset from originals
- Duplicates have unique IDs
- Connections not copied (optional: copy if both ends selected)

**Business Rules:**
- Paste position: 50px offset from original
- Pasted nodes immediately selected
- Clipboard persists across projects
- Maximum 10 items in clipboard

---

#### FR-3.13: Undo/Redo
**Priority:** Should Have  
**Description:** System shall allow users to undo and redo actions.

**Acceptance Criteria:**
- Ctrl+Z triggers undo
- Ctrl+Y or Ctrl+Shift+Z triggers redo
- Undo/Redo buttons in toolbar
- Actions: create, delete, move, edit
- Status bar shows action description
- History limited to last 50 actions

**Business Rules:**
- New action clears redo stack
- Undo available if history exists
- Save creates checkpoint in history
- Session-specific (not persisted)

---

### 4.4 Query Building

#### FR-4.1: Define Table Selection
**Priority:** Must Have  
**Description:** System shall allow users to specify which tables to query.

**Acceptance Criteria:**
- Each node represents a table in FROM clause
- First node becomes primary table
- Additional nodes added via JOIN
- Nodes without connections treated as CROSS JOIN (warning)

**Business Rules:**
- At least one node required for valid query
- Node order affects JOIN sequence
- Isolated nodes generate warning

---

#### FR-4.2: Configure Column Selection
**Priority:** Must Have  
**Description:** System shall allow users to choose which columns to include in SELECT.

**Acceptance Criteria:**
- Node displays all available columns
- User checks/unchecks columns
- Selected columns included in SELECT
- Column order adjustable (drag to reorder)
- Columns show data type indicators

**Business Rules:**
- At least one column must be selected
- All columns selected by default (SELECT *)
- Column aliases available
- Aggregate functions available (SUM, COUNT, etc.)

---

#### FR-4.3: Define Join Conditions
**Priority:** Must Have  
**Description:** System shall allow users to specify how tables relate.

**Acceptance Criteria:**
- Connection between nodes creates JOIN
- User selects join type: INNER, LEFT, RIGHT, FULL
- User specifies join columns
- Additional conditions allowed (AND)
- Visual indicator of join type on connection

**Business Rules:**
- Default join type: INNER
- Join columns must exist in respective tables
- Multiple joins form chain (table1 JOIN table2 JOIN table3)
- Circular joins allowed

---

#### FR-4.4: Add WHERE Conditions
**Priority:** Must Have  
**Description:** System shall allow users to filter query results.

**Acceptance Criteria:**
- Node properties include WHERE clause editor
- User adds filter conditions per table
- Operators: =, !=, <, >, <=, >=, LIKE, IN, BETWEEN
- Multiple conditions combined with AND/OR
- Conditions validate before saving

**Business Rules:**
- Conditions apply to node's table
- Invalid syntax prevents save
- Multiple tables combine with AND
- NULL checks use IS NULL/IS NOT NULL

---

#### FR-4.5: Group and Aggregate
**Priority:** Could Have  
**Description:** System shall support GROUP BY and aggregate functions.

**Acceptance Criteria:**
- User can mark columns for grouping
- Aggregate functions available: SUM, COUNT, AVG, MIN, MAX
- HAVING clause supported
- Validation ensures non-aggregated columns in GROUP BY

**Business Rules:**
- GROUP BY requires at least one column
- Aggregates allowed without GROUP BY
- HAVING requires GROUP BY
- COUNT(*) available

---

#### FR-4.6: Order Results
**Priority:** Should Have  
**Description:** System shall allow users to sort query results.

**Acceptance Criteria:**
- User selects columns for ORDER BY
- User specifies ASC or DESC per column
- Multiple sort columns supported
- Sort order adjustable (drag to reorder)

**Business Rules:**
- Default order: ascending
- Sort by non-selected columns allowed
- Multiple sorts applied in sequence

---

#### FR-4.7: Limit Results
**Priority:** Should Have  
**Description:** System shall allow users to limit number of results.

**Acceptance Criteria:**
- User enters LIMIT value
- User enters OFFSET value (optional)
- Values validate as positive integers
- Applied to generated SQL

**Business Rules:**
- LIMIT must be positive integer
- OFFSET optional (default: 0)
- Warning if LIMIT without ORDER BY

---

### 4.5 SQL Generation and Export

#### FR-5.1: Generate SQL
**Priority:** Must Have  
**Description:** System shall generate valid SQL from visual query.

**Acceptance Criteria:**
- User clicks "Generate SQL" or "Export"
- System traverses node graph
- System generates SELECT statement
- System includes FROM, JOIN, WHERE, ORDER BY, LIMIT
- SQL follows MySQL syntax
- SQL displayed in modal or panel

**Business Rules:**
- Must have at least one node
- Must have valid structure (no orphan nodes)
- Generated SQL is read-only
- SQL auto-formats with indentation

---

#### FR-5.2: Validate Query
**Priority:** Must Have  
**Description:** System shall validate query structure before SQL generation.

**Acceptance Criteria:**
- System checks for at least one node
- System verifies all connections valid
- System identifies orphan nodes
- System checks for circular dependencies
- Validation errors displayed to user
- Invalid queries cannot export

**Business Rules:**
- Warnings don't prevent export
- Errors block export
- Validation runs on-demand and before export

---

#### FR-5.3: Copy SQL to Clipboard
**Priority:** Must Have  
**Description:** System shall allow users to copy generated SQL.

**Acceptance Criteria:**
- Copy button available in SQL viewer
- Clicking copies SQL to clipboard
- Confirmation message displayed
- SQL formatted for readability

---

#### FR-5.4: Download SQL File
**Priority:** Should Have  
**Description:** System shall allow users to download SQL as file.

**Acceptance Criteria:**
- Download button available in SQL viewer
- File saves as project_name.sql
- File contains generated SQL
- File includes header comment with metadata

**Business Rules:**
- Filename sanitized (remove special chars)
- File encoding: UTF-8
- Includes timestamp in header

---

#### FR-5.5: Preview Query Results
**Priority:** Could Have  
**Description:** System shall execute query and display results preview.

**Acceptance Criteria:**
- User clicks "Preview Results"
- System generates and executes SQL
- Results displayed in table format
- Limited to first 100 rows
- Execution time displayed
- Error messages shown for failed queries

**Business Rules:**
- Read-only execution (SELECT only)
- Timeout: 30 seconds
- Database connection required
- Requires valid database credentials

---

### 4.6 User Interface

#### FR-6.1: Responsive Layout
**Priority:** Must Have  
**Description:** System shall adapt to different screen sizes.

**Acceptance Criteria:**
- Minimum supported width: 1024px
- Layout adjusts to viewport size
- Sidebar collapsible on smaller screens
- Canvas scales to available space
- Touch-friendly on tablets

**Business Rules:**
- Desktop-first design
- Mobile support: future enhancement
- Minimum resolution: 1024x768

---

#### FR-6.2: Sidebar Navigation
**Priority:** Must Have  
**Description:** System shall provide sidebar for navigation and tools.

**Acceptance Criteria:**
- Sidebar displays table list
- Tables organized by category/schema
- Search filter available
- Drag tables to canvas
- Collapsible sections
- Toggle sidebar visibility

**Business Rules:**
- Sidebar width: 250-300px
- Position: left side of canvas
- Remembers collapsed state

---

#### FR-6.3: Toolbar
**Priority:** Must Have  
**Description:** System shall provide toolbar with common actions.

**Acceptance Criteria:**
- Save button
- Undo/Redo buttons
- Zoom controls
- Export SQL button
- View options
- Button states reflect availability

**Business Rules:**
- Toolbar fixed at top
- Disabled buttons grayed out
- Tooltips on hover
- Keyboard shortcuts available

---

#### FR-6.4: Context Menus
**Priority:** Should Have  
**Description:** System shall provide right-click context menus.

**Acceptance Criteria:**
- Right-click node shows node menu
- Right-click connection shows connection menu
- Right-click canvas shows canvas menu
- Menu options context-appropriate
- Menu closes on action or click away

**Business Rules:**
- Menu appears at cursor position
- Disabled items grayed out
- Maximum 10 items per menu
- Keyboard navigation supported

---

#### FR-6.5: Keyboard Shortcuts
**Priority:** Should Have  
**Description:** System shall provide keyboard shortcuts for common actions.

**Acceptance Criteria:**
- Ctrl+S: Save project
- Ctrl+C: Copy
- Ctrl+V: Paste
- Delete: Delete selected
- Ctrl+A: Select all
- Ctrl+F: Search
- Escape: Cancel/deselect

**Business Rules:**
- Shortcuts work when canvas has focus
- Mac: Cmd instead of Ctrl
- Shortcuts displayed in tooltips

---

#### FR-6.6: Visual Feedback
**Priority:** Must Have  
**Description:** System shall provide clear visual feedback for user actions.

**Acceptance Criteria:**
- Loading spinners during async operations
- Success/error messages after actions
- Hover effects on interactive elements
- Drag feedback during node movement
- Connection preview during creation
- Save status indicator

**Business Rules:**
- Messages auto-dismiss after 3 seconds
- Errors require manual dismiss
- Animations smooth (60fps)

---

### 4.7 Data Management

#### FR-7.1: Auto-Save
**Priority:** Should Have  
**Description:** System shall automatically save project changes.

**Acceptance Criteria:**
- Auto-save triggers every 2 minutes
- Only saves if changes detected
- Indicator shows auto-save status
- Manual save still available
- Failed auto-save shows warning

**Business Rules:**
- Auto-save doesn't interrupt user
- Uses debounce to prevent excessive saves
- User can disable auto-save in settings

---

#### FR-7.2: Change Tracking
**Priority:** Should Have  
**Description:** System shall track unsaved changes.

**Acceptance Criteria:**
- Indicator shows unsaved changes exist
- Prompt when navigating with unsaved changes
- Project list shows last saved time
- Dirty flag cleared after successful save

**Business Rules:**
- All modifications trigger dirty flag
- Save clears dirty flag
- Closing with unsaved changes prompts user

---

#### FR-7.3: Project History
**Priority:** Could Have  
**Description:** System shall maintain project version history.

**Acceptance Criteria:**
- Each save creates snapshot
- User can view previous versions
- User can restore old version
- History shows: timestamp, user, change summary

**Business Rules:**
- Keep last 10 versions
- Older versions auto-deleted
- Restore creates new version

---

## 5. Non-Functional Requirements

### 5.1 Performance

#### NFR-1.1: Response Time
- Page load: < 2 seconds
- Project open: < 3 seconds
- Canvas interactions: < 100ms
- SQL generation: < 500ms
- Auto-save: < 1 second

#### NFR-1.2: Scalability
- Support projects with 50+ nodes
- Support 100+ connections
- Handle 100 concurrent users
- Database queries optimized with indexes

#### NFR-1.3: Resource Usage
- Client memory: < 200MB
- Server memory: < 512MB per process
- Database connections: pooled (max 10)

### 5.2 Security

#### NFR-2.1: Authentication
- Passwords hashed with bcrypt (10+ rounds)
- Session-based authentication
- HTTPS in production
- Session timeout: 24 hours

#### NFR-2.2: Authorization
- Users access only their own projects
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)

#### NFR-2.3: Data Protection
- Database credentials in environment variables
- Sensitive data encrypted at rest
- Audit logging for critical actions

### 5.3 Usability

#### NFR-3.1: Learnability
- New users can create simple query in < 5 minutes
- Tooltips and help text throughout UI
- Onboarding tutorial (optional)

#### NFR-3.2: Accessibility
- Keyboard navigation for all functions
- Screen reader support (WCAG 2.1 AA)
- Sufficient color contrast
- Focus indicators visible

#### NFR-3.3: Error Handling
- Clear error messages with solutions
- Graceful degradation on failure
- No data loss on errors

### 5.4 Reliability

#### NFR-4.1: Availability
- 99% uptime during business hours
- Graceful handling of database disconnection
- Auto-reconnect on connection loss

#### NFR-4.2: Data Integrity
- Transaction support for database operations
- Foreign key constraints enforced
- Cascade deletes for referential integrity
- Regular database backups

### 5.5 Compatibility

#### NFR-5.1: Browser Support
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

#### NFR-5.2: Database Support
- MySQL 8.0+ (current)
- Future: PostgreSQL, SQL Server

---

## 6. Business Rules

### 6.1 User Management
1. Email addresses must be unique across all users
2. Passwords must be minimum 8 characters
3. Users can only access their own projects
4. Inactive accounts locked after 90 days (future)
5. Maximum 5 login attempts per 15 minutes

### 6.2 Project Management
1. Project names must be unique per user (case-insensitive)
2. Project names limited to 255 characters
3. Deleted projects cannot be recovered
4. Projects without activity for 1 year archived (future)
5. Maximum 50 projects per user (free tier) (future)

### 6.3 Canvas Rules
1. Minimum one node required for valid query
2. Node IDs must be unique within project
3. Connections must link compatible column types
4. Circular dependencies allowed but generate warnings
5. Maximum 100 nodes per project (performance limit)

### 6.4 SQL Generation Rules
1. Generated SQL follows MySQL 8.0 syntax
2. Column names with spaces wrapped in backticks
3. Ambiguous column names automatically prefixed with table
4. INNER JOIN is default join type
5. Query structure validated before SQL generation

### 6.5 Data Validation Rules
1. All user input sanitized to prevent XSS
2. SQL parameters use prepared statements
3. File uploads limited to .sql extension (future)
4. API rate limiting: 100 requests per minute per user
5. Maximum request payload: 10MB

---

## 7. User Workflows

### 7.1 First-Time User Workflow

```
1. User arrives at landing page
2. User clicks "Sign Up"
3. User enters email and password
4. User confirms registration
5. User redirected to login
6. User logs in with credentials
7. User sees empty projects page
8. User clicks "New Project"
9. User enters project name
10. User arrives at empty canvas
11. System shows onboarding tutorial (optional)
12. User drags first table to canvas
13. User drags second table to canvas
14. User creates connection between tables
15. User configures join type
16. User clicks "Generate SQL"
17. User sees generated query
18. User clicks "Save"
19. User returns to projects page
20. User sees saved project in list
```

### 7.2 Returning User Workflow

```
1. User navigates to login page
2. User enters credentials
3. System authenticates user
4. User sees projects list
5. User clicks existing project
6. Canvas loads with saved state
7. User makes modifications
8. System auto-saves periodically
9. User clicks "Export SQL"
10. User copies SQL to clipboard
11. User uses SQL in external tool
```

### 7.3 Complex Query Building Workflow

```
1. User creates new project
2. User drags 5 tables to canvas
3. User arranges tables spatially
4. User creates JOIN between Table A and B
5. User selects INNER JOIN
6. User creates JOIN between Table B and C
7. User selects LEFT JOIN
8. User creates JOIN between Table C and D
9. User double-clicks Table A
10. User adds WHERE condition
11. User unchecks unwanted columns
12. User adds column alias
13. User repeats for other tables
14. User clicks "Validate Query"
15. System shows validation results
16. User fixes any warnings
17. User clicks "Generate SQL"
18. User reviews generated SQL
19. User clicks "Copy SQL"
20. User saves project
```

---

## 8. Interface Descriptions

### 8.1 Landing Page (/)
**Purpose:** Welcome new users and provide access to authentication

**Elements:**
- Application logo and name
- Brief description of features
- "Sign Up" button
- "Login" button
- Screenshot or demo animation
- Feature highlights

**Navigation:**
- Sign Up → /signup
- Login → /login

---

### 8.2 Login Page (/login)
**Purpose:** Authenticate existing users

**Elements:**
- Email input field
- Password input field
- "Login" button
- "Forgot Password" link (future)
- "Sign Up" link
- Error message area

**Validation:**
- Email required and valid format
- Password required

**Navigation:**
- Success → /home (projects)
- Sign Up → /signup

---

### 8.3 Sign Up Page (/signup)
**Purpose:** Register new users

**Elements:**
- Email input field
- Password input field
- Confirm password input field
- "Create Account" button
- "Already have account? Login" link
- Password requirements text
- Error message area

**Validation:**
- Email required, valid format, unique
- Password required, min 8 chars
- Passwords must match

**Navigation:**
- Success → /login
- Login → /login

---

### 8.4 Projects Page (/home)
**Purpose:** Display and manage user's projects

**Layout:**
- Header with user menu
- "New Project" button (prominent)
- Search bar
- Project grid/list
- Each project card shows:
  - Project name
  - Description
  - Last modified date
  - Thumbnail (optional)
  - Actions: Open, Delete

**Actions:**
- New Project → Modal dialog
- Open Project → /canvas/:id
- Delete Project → Confirmation dialog
- Search → Filter projects

---

### 8.5 Canvas Page (/canvas/:id)
**Purpose:** Visual query builder interface

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ Toolbar                                         │
├───────────┬─────────────────────────────────────┤
│           │                                     │
│  Sidebar  │         Canvas                     │
│           │                                     │
│  - Tables │     [Nodes and Connections]        │
│  - Search │                                     │
│  - ...    │                                     │
│           │                                     │
│           │                                     │
├───────────┴─────────────────────────────────────┤
│ Status Bar                                      │
└─────────────────────────────────────────────────┘
```

**Toolbar Items:**
- Project name (editable)
- Save button
- Undo/Redo buttons
- Zoom controls (+/- and percentage)
- Generate SQL button
- User menu

**Sidebar Sections:**
- Table browser (expandable tree)
- Search tables
- Recently used tables
- Favorites (optional)

**Canvas:**
- Zoomable/pannable area
- Grid background
- Nodes (tables)
- Connections (joins)
- Context menus on right-click

**Status Bar:**
- Save status indicator
- Validation warnings
- Zoom level
- Node/connection count

---

### 8.6 SQL Export Modal
**Purpose:** Display generated SQL and export options

**Elements:**
- SQL code display (syntax highlighted)
- Copy to Clipboard button
- Download as File button
- Close button
- Format options (optional):
  - Indentation style
  - Keyword case (UPPER/lower)

---

### 8.7 Node Properties Panel
**Purpose:** Configure node (table) settings

**Elements:**
- Table name (read-only)
- Table alias input
- Column list with checkboxes
- Column order controls (drag handles)
- WHERE clause editor
- Apply/Cancel buttons

**Sections:**
- Columns (select which to include)
- Filters (WHERE conditions)
- Aggregations (GROUP BY, HAVING) (optional)
- Sorting (ORDER BY) (optional)

---

### 8.8 Connection Properties Dialog
**Purpose:** Configure connection (join) settings

**Elements:**
- Source table/column (read-only)
- Target table/column (read-only)
- Join type dropdown:
  - INNER JOIN
  - LEFT JOIN
  - RIGHT JOIN
  - FULL OUTER JOIN
- Additional conditions (AND)
- OK/Cancel buttons

---

## 9. Data Dictionary

### 9.1 User Entity
| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| id | Integer | Unique identifier | Primary Key, Auto-increment |
| email | String | User email address | Unique, Required, Max 255 |
| password_hash | String | Hashed password | Required, Max 255 |
| created_at | Timestamp | Account creation date | Auto-generated |
| updated_at | Timestamp | Last update date | Auto-updated |

### 9.2 Project Entity
| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| id | Integer | Unique identifier | Primary Key, Auto-increment |
| user_id | Integer | Owner user ID | Foreign Key, Required |
| name | String | Project name | Required, Max 255 |
| description | Text | Project description | Optional |
| viewport_state | JSON | Zoom and pan state | Optional |
| created_at | Timestamp | Creation date | Auto-generated |
| updated_at | Timestamp | Last modified date | Auto-updated |

### 9.3 Node Entity
| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| id | Integer | Unique identifier | Primary Key, Auto-increment |
| project_id | Integer | Parent project ID | Foreign Key, Required |
| node_type | String | Type of node | Required, Max 50 |
| name | String | Table name | Required, Max 255 |
| position_x | Float | X coordinate | Required |
| position_y | Float | Y coordinate | Required |
| width | Float | Node width | Default 200 |
| height | Float | Node height | Default 150 |
| metadata | JSON | Additional properties | Optional |
| created_at | Timestamp | Creation date | Auto-generated |

### 9.4 Row (Column) Entity
| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| id | Integer | Unique identifier | Primary Key, Auto-increment |
| node_id | Integer | Parent node ID | Foreign Key, Required |
| name | String | Column name | Required, Max 255 |
| data_type | String | SQL data type | Required, Max 100 |
| is_nullable | Boolean | Allows NULL | Default TRUE |
| is_primary_key | Boolean | Is primary key | Default FALSE |
| is_foreign_key | Boolean | Is foreign key | Default FALSE |
| default_value | String | Default value | Optional, Max 255 |
| display_order | Integer | Order in node | Required |
| is_visible | Boolean | Show in SELECT | Default TRUE |
| created_at | Timestamp | Creation date | Auto-generated |

### 9.5 Connection Entity
| Attribute | Type | Description | Constraints |
|-----------|------|-------------|-------------|
| id | Integer | Unique identifier | Primary Key, Auto-increment |
| project_id | Integer | Parent project ID | Foreign Key, Required |
| source_node_id | Integer | Source node | Foreign Key, Required |
| source_row_id | Integer | Source column | Foreign Key, Required |
| target_node_id | Integer | Target node | Foreign Key, Required |
| target_row_id | Integer | Target column | Foreign Key, Required |
| join_type | String | Type of join | Required, Max 20 |
| conditions | JSON | Additional conditions | Optional |
| created_at | Timestamp | Creation date | Auto-generated |

---

## 10. Constraints and Assumptions

### 10.1 Technical Constraints
- MySQL 8.0+ required for database
- Minimum 1024x768 screen resolution
- JavaScript must be enabled in browser
- Internet connection required (no offline mode)
- Modern browser required (Chrome 90+, Firefox 88+, etc.)

### 10.2 Business Constraints
- Single-user projects only (no multi-user collaboration in v1.0)
- MySQL dialect only (other databases future enhancement)
- English language only (localization future enhancement)
- Free tier only (no payment processing in v1.0)

### 10.3 Assumptions
- Users have basic SQL knowledge
- Users understand database concepts (tables, columns, joins)
- Users have access to target database for testing queries
- Users use desktop/laptop computers (not mobile)
- Network latency < 200ms for good UX

---

## 11. Success Criteria

### 11.1 User Adoption
- 100+ registered users within 3 months
- Average 5 projects per user
- 70%+ user retention after first month
- Average session duration: 15+ minutes

### 11.2 Functionality
- All Must Have features implemented and tested
- < 5 critical bugs in production
- 95%+ uptime
- Query generation accuracy: 100%

### 11.3 Performance
- Page load under 2 seconds
- Canvas interactions feel smooth (60fps)
- Support projects with 50+ nodes
- Auto-save completes within 1 second

### 11.4 User Satisfaction
- System Usability Scale (SUS) score: 70+
- Positive user feedback: 80%+
- Users successfully create query on first attempt: 80%+
- User-reported bugs resolved within 1 week

---

## 12. Future Enhancements

### 12.1 Phase 2 Features
- PostgreSQL and SQL Server support
- Real-time collaboration
- Advanced query builder (subqueries, CTEs, window functions)
- Query execution and results preview
- Database schema import

### 12.2 Phase 3 Features
- Mobile responsive design
- Offline mode with sync
- API for integration
- Webhooks and automation
- Team workspaces and permissions

### 12.3 Long-term Vision
- AI-powered query suggestions
- Natural language to SQL
- Query performance optimization
- Data visualization integration
- Enterprise features (SSO, audit logs)

---

## Appendix A: Glossary

**Canvas:** The main workspace where users create visual queries  
**Node:** Visual representation of a database table  
**Connection:** Visual line representing a JOIN between tables  
**Row:** A column/field within a node (database column)  
**Viewport:** The visible area of the canvas with zoom and pan state  
**Join:** SQL operation to combine rows from two or more tables  
**Primary Key:** Column(s) that uniquely identify each row  
**Foreign Key:** Column that references primary key in another table  

---

## Appendix B: References

- SQL Standard: ISO/IEC 9075
- MySQL Documentation: https://dev.mysql.com/doc/
- Web Content Accessibility Guidelines (WCAG) 2.1
- System Usability Scale (SUS)

---

**Document Status:** Living Document  
**Last Updated:** January 14, 2026  
**Next Review:** February 14, 2026  
**Maintained By:** Product Team

# SketchSQL - Use Cases

## User Personas

### 1. **Database Designer**
- Experienced with SQL and database design
- Needs to create complex queries quickly
- Wants visual feedback on query structure
- Goal: Build and test SQL queries without writing code manually

### 2. **Business Analyst**
- May have limited SQL knowledge
- Needs to extract data for reporting
- Wants intuitive, drag-and-drop interface
- Goal: Generate reports from database data

### 3. **Student/Learner**
- Learning SQL concepts
- Benefits from visual representation
- Wants to understand query structure
- Goal: Learn SQL through visual interaction

### 4. **IT Administrator**
- Manages multiple projects
- Needs version control and user management
- Wants to monitor query performance
- Goal: Maintain and optimize database queries

---

## Primary Use Cases

### UC-1: User Registration
**Actor:** New User  
**Preconditions:** User has not registered yet  
**Goal:** Create a new account

**Main Flow:**
1. User clicks "Sign Up" on home page
2. User enters email and password
3. User confirms password
4. System validates input
5. System creates user account
6. System confirms registration
7. User is redirected to login page

**Alternative Flows:**
- A2: Email already exists → Display error, suggest login
- A3: Passwords don't match → Display error, ask user to re-enter
- A4: Weak password → Display requirements, ask for stronger password

---

### UC-2: User Login
**Actor:** Registered User  
**Preconditions:** User has created an account  
**Goal:** Access application and saved projects

**Main Flow:**
1. User navigates to login page
2. User enters email and password
3. System validates credentials
4. System creates session
5. User is redirected to home/projects page

**Alternative Flows:**
- A2: Invalid email → Display error message
- A3: Invalid password → Display error message
- A4: Account locked → Display message and recovery options

---

### UC-3: Create New Project
**Actor:** Logged-in User  
**Preconditions:** User is logged in  
**Goal:** Start building a new SQL query

**Main Flow:**
1. User clicks "New Project" button
2. System prompts for project name and description
3. User enters project details
4. System creates new project
5. User is taken to canvas editor
6. Empty canvas is displayed

**Alternative Flows:**
- A2: Project name already exists → Display error, ask for different name
- A3: User cancels → Return to projects page without creating

---

### UC-4: Load Existing Project
**Actor:** Logged-in User  
**Preconditions:** User has saved projects  
**Goal:** Continue editing a previously saved project

**Main Flow:**
1. User views projects list on home page
2. User selects a project from the list
3. System loads project from database
4. Canvas is populated with nodes and connections
5. User can now edit the query

**Alternative Flows:**
- A2: Project not found → Display error, refresh list
- A3: Load fails → Display error message and retry option

---

### UC-5: Create Nodes on Canvas
**Actor:** Logged-in User (in Canvas)  
**Preconditions:** User is in canvas editor with open project  
**Goal:** Add database tables/operations to query

**Main Flow:**
1. User opens sidebar with available tables
2. User selects a table from sidebar
3. User drags table to canvas
4. System creates a node for the table
5. Node displays table name and columns
6. User can continue adding more nodes

**Alternative Flows:**
- A2: User clicks button instead of drag → System places node at default position
- A3: Invalid table → Display error message
- A4: User cancels → No node is created

---

### UC-6: Connect Nodes
**Actor:** Logged-in User (in Canvas)  
**Preconditions:** Two or more nodes exist on canvas  
**Goal:** Establish relationships between tables (joins)

**Main Flow:**
1. User selects connection tool
2. User clicks on column in first node
3. User clicks on column in second node
4. System creates connection line
5. System opens join configuration dialog
6. User selects join type (INNER, LEFT, RIGHT, FULL)
7. System saves connection

**Alternative Flows:**
- A2: Incompatible columns → Display warning, suggest compatible columns
- A3: User cancels connection → No connection is created
- A4: Connection already exists → Display confirmation to replace

---

### UC-7: Edit Node Configuration
**Actor:** Logged-in User (in Canvas)  
**Preconditions:** Node exists on canvas  
**Goal:** Configure columns, filters, and aliases

**Main Flow:**
1. User clicks on a node
2. System opens node properties panel
3. User selects columns to include
4. User adds WHERE conditions
5. User sets column aliases
6. System updates node visualization
7. User confirms changes

**Alternative Flows:**
- A2: User removes required column → Display warning
- A3: Invalid condition syntax → Display error, highlight issue
- A4: User cancels → Changes are discarded

---

### UC-8: Export to SQL
**Actor:** Logged-in User (in Canvas)  
**Preconditions:** Valid query structure exists on canvas  
**Goal:** Generate and view SQL code

**Main Flow:**
1. User clicks "Export SQL" button
2. System validates query structure
3. System generates SQL code
4. System displays generated SQL in dialog
5. User can copy SQL to clipboard
6. User can save SQL to file

**Alternative Flows:**
- A2: Invalid query structure → Display error message with issues
- A3: Unsupported query type → Display message about limitations
- A4: User copies → SQL is copied to clipboard with confirmation

---

### UC-9: Save Project
**Actor:** Logged-in User (in Canvas)  
**Preconditions:** User has made changes to project  
**Goal:** Persist project changes to database

**Main Flow:**
1. User clicks "Save Project" button
2. System validates query structure
3. System saves project to database
4. System saves all nodes and connections
5. System shows success message
6. Project last-modified timestamp is updated

**Alternative Flows:**
- A2: Save fails → Display error message with retry option
- A3: User has unsaved changes when navigating away → Prompt to save
- A4: Project name changed → Update project name in database

---

### UC-10: Delete Project
**Actor:** Logged-in User (on Projects Page)  
**Preconditions:** User has projects in list  
**Goal:** Remove a project permanently

**Main Flow:**
1. User views projects list
2. User selects project to delete
3. User clicks delete/trash button
4. System asks for confirmation
5. User confirms deletion
6. System deletes project from database
7. Project is removed from list

**Alternative Flows:**
- A2: User cancels deletion → Project remains intact
- A3: Deletion fails → Display error message
- A4: User tries to delete while project is open → Close project first

---

### UC-11: Preview Query Results
**Actor:** Logged-in User (in Canvas)  
**Preconditions:** Valid query exists and database is connected  
**Goal:** See actual data returned by query

**Main Flow:**
1. User clicks "Preview Results" button
2. System generates SQL from query
3. System executes query against database
4. System retrieves result set
5. System displays results in table format
6. User can scroll and review data

**Alternative Flows:**
- A2: Query execution fails → Display error message with SQL
- A3: No results returned → Display "No data" message
- A4: Large result set → Display pagination controls
- A5: Database connection fails → Display connection error

---

### UC-12: Manage Canvas Layout
**Actor:** Logged-in User (in Canvas)  
**Preconditions:** Nodes exist on canvas  
**Goal:** Organize and navigate the canvas

**Main Flow:**
1. User can pan canvas by dragging background
2. User can zoom in/out with mouse wheel
3. User can select multiple nodes
4. User can align nodes (left, center, right, top, middle, bottom)
5. User can auto-arrange nodes
6. Layout is maintained when saved

**Alternative Flows:**
- A2: User selects single node → Only that node is affected by alignment
- A3: User zooms too far out → Fit-to-screen option available
- A4: Canvas becomes crowded → Suggest auto-arrange

---

### UC-13: Manage User Account
**Actor:** Logged-in User  
**Preconditions:** User is logged in  
**Goal:** Update profile or account settings

**Main Flow:**
1. User clicks account/profile menu
2. User views account settings page
3. User can update profile information
4. User can change password
5. User can view login history
6. System saves changes

**Alternative Flows:**
- A2: User wants to delete account → Confirmation required
- A3: Password change fails → Display error
- A4: User logs out → Session is terminated

---

### UC-14: Undo/Redo Operations
**Actor:** Logged-in User (in Canvas)  
**Preconditions:** User has performed actions on canvas  
**Goal:** Revert or restore previous actions

**Main Flow:**
1. User performs action (add node, connect, delete, etc.)
2. Action is added to undo stack
3. User clicks Undo button (or Ctrl+Z)
4. Previous state is restored
5. Action moves to redo stack
6. User can click Redo to restore action

**Alternative Flows:**
- A2: No undo available → Undo button is disabled
- A3: New action performed → Redo stack is cleared
- A4: Multiple undos → User can undo multiple times

---

### UC-15: Search/Filter Projects
**Actor:** Logged-in User  
**Preconditions:** User has multiple projects  
**Goal:** Quickly find specific project

**Main Flow:**
1. User sees projects list with search bar
2. User types project name or keyword
3. System filters projects in real-time
4. Matching projects are displayed
5. User clicks project to open

**Alternative Flows:**
- A2: No matches found → Display "No projects found"
- A3: User clears search → All projects shown again

---

## Supporting Use Cases

### UC-S1: Validate SQL Syntax
**Actor:** System  
**Preconditions:** SQL has been generated  
**Goal:** Ensure generated SQL is valid

- System validates SQL against database syntax rules
- Highlights syntax errors if found
- Suggests corrections where possible

---

### UC-S2: Handle Database Connection
**Actor:** System  
**Preconditions:** User opens canvas  
**Goal:** Maintain connection to database

- System connects to MySQL on startup
- Retries on connection failure
- Displays connection status to user
- Auto-reconnects if connection drops

---

### UC-S3: Session Management
**Actor:** System  
**Preconditions:** User is logged in  
**Goal:** Keep user authenticated

- Maintain session for logged-in user
- Timeout inactive sessions
- Prevent unauthorized access

---

## Use Case Diagram (Text Format)

```
┌─────────────────────────────────────────────────────────────┐
│                     SketchSQL System                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Authentication                                       │  │
│  │  ├─ UC-1: User Registration                          │  │
│  │  ├─ UC-2: User Login                                │  │
│  │  └─ UC-13: Manage Account                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Project Management                                   │  │
│  │  ├─ UC-3: Create New Project                         │  │
│  │  ├─ UC-4: Load Existing Project                      │  │
│  │  ├─ UC-10: Delete Project                            │  │
│  │  └─ UC-15: Search/Filter Projects                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Canvas Operations                                    │  │
│  │  ├─ UC-5: Create Nodes on Canvas                     │  │
│  │  ├─ UC-6: Connect Nodes                              │  │
│  │  ├─ UC-7: Edit Node Configuration                    │  │
│  │  ├─ UC-9: Save Project                               │  │
│  │  ├─ UC-12: Manage Canvas Layout                      │  │
│  │  └─ UC-14: Undo/Redo Operations                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Query Execution & Export                             │  │
│  │  ├─ UC-8: Export to SQL                              │  │
│  │  └─ UC-11: Preview Query Results                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Priority Matrix

| Priority | Use Cases |
|----------|-----------|
| **High** | UC-2, UC-3, UC-4, UC-5, UC-6, UC-7, UC-8, UC-9 |
| **Medium** | UC-1, UC-11, UC-12, UC-13, UC-14 |
| **Low** | UC-10, UC-15 |

---

## Notes
- Use cases can be refined based on stakeholder feedback
- Additional use cases may emerge during development
- Consider user testing with actual users to validate scenarios
- Update use cases as features are implemented

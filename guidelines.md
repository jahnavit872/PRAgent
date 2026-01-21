# Coding Guidelines for E-Commerce Project

## 1. Authentication & Authorization

### Rule 1.1: Protected Routes
- **ALL** routes that modify data (POST, PUT, DELETE) MUST use `authenticateToken` middleware
- Admin-only operations MUST verify user role in addition to authentication
- Public GET routes are allowed only for product listings and general information

### Rule 1.2: User Data Access
- Users can ONLY access their own data
- MUST verify `req.user.id` matches the data owner before returning sensitive information
- NEVER expose other users' personal information in API responses

## 2. Data Storage & Persistence

### Rule 2.1: Storage Utility Usage
- **ALWAYS** use `readData()` and `writeData()` from `src/utils/storage.js`
- **NEVER** use `fs` module directly in route handlers
- **NEVER** use synchronous file operations

### Rule 2.2: Async/Await Pattern
- ALL calls to `readData()` MUST use `await`
- ALL calls to `writeData()` MUST use `await`
- Functions calling async operations MUST be declared as `async`

### Rule 2.3: Function Signatures
- `readData()` accepts NO parameters
- `writeData(data)` accepts ONLY ONE parameter (the complete store object)
- DO NOT pass additional parameters like collection names or IDs

## 3. Security & Data Protection

### Rule 3.1: Password Security
- Use `bcrypt.hash()` with `await` for hashing passwords
- NEVER store plain text passwords
- NEVER expose password hashes in API responses
- Salt rounds should be 10 or higher

### Rule 3.2: Sensitive Data Protection
- NEVER return password hashes, JWT secrets, or API keys in responses
- NEVER log sensitive user data
- Filter sensitive fields before sending responses

### Rule 3.3: Input Validation
- Validate ALL user inputs
- Check for required fields before processing
- Validate data types (numbers, emails, etc.)
- Sanitize inputs to prevent injection attacks

## 4. Error Handling

### Rule 4.1: Null/Undefined Checks
- ALWAYS check if data exists before accessing properties
- Validate array/object existence before using `.find()`, `.filter()`, etc.
- Return appropriate error messages for missing data

### Rule 4.2: Error Responses
- Use appropriate HTTP status codes (400, 404, 500)
- Return consistent error format: `{ error: 'message' }`
- Include helpful error messages for debugging

## 5. Response Format

### Rule 5.1: Consistent JSON Structure
- Success responses should include relevant data and success indicators
- Use camelCase for all JSON keys
- Include meaningful field names

### Rule 5.2: HTTP Status Codes
- 200: Successful GET/PUT requests
- 201: Successful POST (creation)
- 400: Bad request (validation errors)
- 401: Unauthorized (no token)
- 403: Forbidden (insufficient permissions)
- 404: Resource not found
- 500: Internal server error

## 6. Business Logic

### Rule 6.1: Data Integrity
- Validate business rules before saving data
- Check constraints (minimum values, maximum limits, etc.)
- Prevent duplicate entries where applicable

### Rule 6.2: Transaction Safety
- Read fresh data before modifications
- Avoid race conditions in concurrent operations
- Update all related data atomically when possible

## 7. Code Style

### Rule 7.1: Variable Declarations
- Use `const` for values that don't change
- Use `let` for values that change
- NEVER use `var`

### Rule 7.2: ES6+ Features
- Use ES6 modules (`import/export`)
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Use destructuring where appropriate

### Rule 7.3: Naming Conventions
- Use camelCase for variables and functions
- Use descriptive names that explain purpose
- Avoid single-letter variables (except in loops)

## 8. Dependencies

### Rule 8.1: Package Usage
- ONLY use packages listed in `package.json`
- DO NOT import packages that are not installed
- Keep dependencies up to date

### Rule 8.2: Import Statements
- Use ES6 import syntax
- Import only what you need (destructuring)
- Group imports: external packages first, then local modules

## 9. API Design

### Rule 9.1: RESTful Conventions
- Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- Use plural nouns for resource endpoints
- Use path parameters for resource IDs

### Rule 9.2: Query Parameters
- Use query parameters for filtering, sorting, pagination
- Provide sensible defaults
- Validate query parameter values

## 10. Performance

### Rule 10.1: Efficient Operations
- Avoid nested loops where possible
- Filter data early to reduce processing
- Use array methods efficiently (map, filter, reduce)

### Rule 10.2: Data Loading
- Don't load entire datasets when only partial data is needed
- Implement pagination for large result sets
- Cache frequently accessed data when appropriate

## Critical Rules Summary

❌ **NEVER:**
- Use `fs` directly in routes
- Use synchronous operations
- Expose password hashes
- Skip authentication on data-modifying routes
- Use `var` keyword
- Import non-existent packages
- Access other users' private data
- Call async functions without `await`

✅ **ALWAYS:**
- Use `authenticateToken` middleware
- Use `readData()` and `writeData()` utilities
- Use `await` with async functions
- Validate user input
- Check for null/undefined
- Use consistent error responses
- Follow ES6+ syntax
- Verify user permissions


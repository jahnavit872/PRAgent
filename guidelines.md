# React Component Guidelines

## Form Validation Requirements

1. **All forms MUST use React Hook Form** with Zod validation schema
   - Never use plain state for form handling
   - Define validation schema before component
   - Use `zodResolver` for schema integration

2. **Input Validation Rules:**
   - Email fields: Must validate email format
   - Password fields: Minimum 8 characters, must include uppercase, lowercase, and number
   - Username fields: 3-20 characters, alphanumeric only
   - Phone fields: Must validate phone number format

3. **Error Handling:**
   - Display validation errors below each input field
   - Use red text for error messages
   - Show field-level errors, not generic form errors

4. **Security Requirements:**
   - Never use `dangerouslySetInnerHTML` with user input
   - Always sanitize user input before displaying
   - Use environment variables for API endpoints (never hardcode URLs)
   - Never log sensitive data (passwords, tokens, emails) to console

5. **Accessibility:**
   - Every input MUST have an associated `<label>` with `htmlFor` attribute
   - Use semantic HTML elements
   - Provide `aria-label` for icon-only buttons

6. **API Integration:**
   - Use async/await with try-catch blocks
   - Show loading states during API calls
   - Display user-friendly error messages on API failures
   - Never expose raw error messages to users

## Component Structure

- Use functional components with hooks
- Props must have TypeScript interfaces
- Export components as default at the end of file

# Form Guidelines

This document provides guidelines for building and validating forms in modern web applications.

---

## 1. Form Structure
- Use the `<form>` tag with proper `action` and `method` attributes (`POST` for submissions).
- Every input field **must have a `name` attribute**.
- Use `<label>` elements for accessibility.
- Group related inputs using `<fieldset>` if needed.

---

## 2. Input Types
- Use appropriate input types for better UX and built-in validation:
  - `text`, `email`, `password`, `number`, `date`, `checkbox`, `radio`, `file`, etc.
- Use `required`, `minlength`, `maxlength`, and `pattern` attributes for HTML validation.

---

## 3. Validation Guidelines
- **Client-side validation:**  
  - Use libraries like **React Hook Form** for handling form state and validation.
  - Example with **Zod** schema validation:

```javascript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});

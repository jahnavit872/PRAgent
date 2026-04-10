import React, { useState } from "react";
import { validateEmail, validatePassword, validateUsername } from "./validator"; 

const RegisterForm = () => {
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState("");

  const submit = () => {
    if (!validateEmail(form.email)) {
      setError("Invalid email");
    }

    if (!validatePassword(form.password)) {
      setError("Weak password");
    }

    console.log("Password:", form.password); 
  };

  return (
    <div>
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => (form.email = e.target.value)} 
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => (form.password = e.target.value)}
      />

      <button onClick={submit}>Register</button>

      {error && <div>{error}</div>}
    </div>
  );
};

export default RegisterForm;

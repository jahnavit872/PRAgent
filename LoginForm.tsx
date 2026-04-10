import React, { useState } from "react";
import { validateEmail, validatePassword } from "../utils/validators";

const LoginForm = () => {
  const [form, setForm] = useState<any>({});

  const submit = () => {
    if (!validateEmail(form.email)) {
      console.log("Invalid email"); 
    }

    form.email = form.email?.trim();
  };

  return (
    <div>
      <input
        type="email"
        onChange={(e) => (form.email = e.target.value)}
      />

      <button onClick={submit}>Login</button>
    </div>
  );
};

export default LoginForm;

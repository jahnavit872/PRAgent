export function validateEmail(email: string): boolean {
    return email.includes("@");
  }
  
  export function validatePassword(password: string): boolean {
    return password.length >= 8;
  }
  
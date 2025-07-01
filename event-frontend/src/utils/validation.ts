export const validation = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  password: (password: string): boolean => {
    return password.length >= 3;
  },

  required: (value: string): boolean => {
    return value.trim().length > 0;
  },

  minLength: (value: string, minLength: number): boolean => {
    return value.length >= minLength;
  },

  maxLength: (value: string, maxLength: number): boolean => {
    return value.length <= maxLength;
  }
};

export const validateLoginForm = (email: string, password: string): string | null => {
  if (!validation.required(email)) {
    return "Email é obrigatório";
  }

  if (!validation.email(email)) {
    return "Email inválido";
  }

  if (!validation.required(password)) {
    return "Senha é obrigatória";
  }

  if (!validation.password(password)) {
    return "Senha deve ter pelo menos 3 caracteres";
  }

  return null;
};

export const validateRegisterForm = (
  name: string, 
  email: string, 
  password: string, 
  confirmPassword: string
): string | null => {
  if (!validation.required(name)) {
    return "Nome é obrigatório";
  }

  if (!validation.minLength(name, 2)) {
    return "Nome deve ter pelo menos 2 caracteres";
  }

  const emailError = validateLoginForm(email, password);
  if (emailError) {
    return emailError;
  }

  if (password !== confirmPassword) {
    return "Senhas não coincidem";
  }

  return null;
};

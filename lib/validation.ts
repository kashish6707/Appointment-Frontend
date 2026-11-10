export const isIndianMobile = (v: string) => /^[6-9]\d{9}$/.test(v);
export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export const passwordRules = [
  { id: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "letter", label: "At least one letter", test: (p: string) => /[A-Za-z]/.test(p) },
  { id: "number", label: "At least one number", test: (p: string) => /\d/.test(p) },
];
export const isStrongPassword = (p: string) => passwordRules.every((r) => r.test(p));

export const PASSWORD_RULES = [
  { key: 'minLength' as const, test: (pw: string) => pw.length >= 8 },
  { key: 'hasLowercase' as const, test: (pw: string) => /[a-z]/.test(pw) },
  { key: 'hasUppercase' as const, test: (pw: string) => /[A-Z]/.test(pw) },
  { key: 'hasDigit' as const, test: (pw: string) => /\d/.test(pw) },
  { key: 'hasSpecial' as const, test: (pw: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/.test(pw) },
] as const;

export function allRulesPass(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}

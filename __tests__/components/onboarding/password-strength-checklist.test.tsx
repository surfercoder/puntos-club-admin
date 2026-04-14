import { render, screen } from '@testing-library/react';
import {
  PasswordStrengthChecklist,
  PASSWORD_RULES,
  allRulesPass,
} from '@/components/onboarding/password-strength-checklist';

describe('PASSWORD_RULES', () => {
  it('minLength passes for 8+ chars', () => {
    const rule = PASSWORD_RULES.find((r) => r.key === 'minLength')!;
    expect(rule.test('1234567')).toBe(false);
    expect(rule.test('12345678')).toBe(true);
  });

  it('hasLowercase detects lowercase letters', () => {
    const rule = PASSWORD_RULES.find((r) => r.key === 'hasLowercase')!;
    expect(rule.test('ABCDEFG')).toBe(false);
    expect(rule.test('ABCDEFa')).toBe(true);
  });

  it('hasUppercase detects uppercase letters', () => {
    const rule = PASSWORD_RULES.find((r) => r.key === 'hasUppercase')!;
    expect(rule.test('abcdefg')).toBe(false);
    expect(rule.test('abcdefG')).toBe(true);
  });

  it('hasDigit detects digits', () => {
    const rule = PASSWORD_RULES.find((r) => r.key === 'hasDigit')!;
    expect(rule.test('abcdefg')).toBe(false);
    expect(rule.test('abcdef1')).toBe(true);
  });

  it('hasSpecial detects special characters', () => {
    const rule = PASSWORD_RULES.find((r) => r.key === 'hasSpecial')!;
    expect(rule.test('abcdefg')).toBe(false);
    expect(rule.test('abcdef!')).toBe(true);
    expect(rule.test('abcdef@')).toBe(true);
    expect(rule.test('abcdef$')).toBe(true);
  });
});

describe('allRulesPass', () => {
  it('returns false for weak password', () => {
    expect(allRulesPass('abc')).toBe(false);
    expect(allRulesPass('password')).toBe(false);
    expect(allRulesPass('PASSWORD1')).toBe(false);
  });

  it('returns true for strong password', () => {
    expect(allRulesPass('Strong1!')).toBe(true);
    expect(allRulesPass('MyP@ss123')).toBe(true);
  });
});

describe('PasswordStrengthChecklist', () => {
  it('renders nothing when password is empty', () => {
    const { container } = render(<PasswordStrengthChecklist password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all 5 rules when password is provided', () => {
    render(<PasswordStrengthChecklist password="a" />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(5);
  });

  it('shows passing rules with brand-green text', () => {
    render(<PasswordStrengthChecklist password="abcdefgh" />);
    // minLength and hasLowercase should pass
    const items = screen.getAllByRole('listitem');
    // minLength passed
    expect(items[0].querySelector('span')).toHaveClass('text-brand-green');
    // hasLowercase passed
    expect(items[1].querySelector('span')).toHaveClass('text-brand-green');
    // hasUppercase not passed
    expect(items[2].querySelector('span')).toHaveClass('text-muted-foreground');
  });
});

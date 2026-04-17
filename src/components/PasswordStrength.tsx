import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PasswordChecks = {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  symbol: boolean;
};

export const evaluatePassword = (password: string): PasswordChecks => ({
  length: password.length >= 8,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /[0-9]/.test(password),
  symbol: /[^A-Za-z0-9]/.test(password),
});

export const passwordScore = (checks: PasswordChecks): number =>
  Object.values(checks).filter(Boolean).length;

export const isPasswordStrong = (password: string): boolean => {
  const c = evaluatePassword(password);
  // Exigência mínima: 8+ chars, maiúscula, número e símbolo
  return c.length && c.uppercase && c.number && c.symbol;
};

const RULES: { key: keyof PasswordChecks; label: string }[] = [
  { key: 'length', label: 'Pelo menos 8 caracteres' },
  { key: 'uppercase', label: 'Uma letra maiúscula' },
  { key: 'lowercase', label: 'Uma letra minúscula' },
  { key: 'number', label: 'Um número' },
  { key: 'symbol', label: 'Um símbolo (!@#$...)' },
];

interface Props {
  password: string;
  className?: string;
}

export const PasswordStrength = ({ password, className }: Props) => {
  const checks = evaluatePassword(password);
  const score = passwordScore(checks);

  const levelLabel =
    score <= 1 ? 'Muito fraca' :
    score === 2 ? 'Fraca' :
    score === 3 ? 'Média' :
    score === 4 ? 'Forte' : 'Muito forte';

  const barColor =
    score <= 1 ? 'bg-destructive' :
    score === 2 ? 'bg-orange-500' :
    score === 3 ? 'bg-yellow-500' :
    score === 4 ? 'bg-lime-500' : 'bg-green-500';

  const labelColor =
    score <= 1 ? 'text-destructive' :
    score === 2 ? 'text-orange-500' :
    score === 3 ? 'text-yellow-600 dark:text-yellow-500' :
    score === 4 ? 'text-lime-600 dark:text-lime-500' : 'text-green-600 dark:text-green-500';

  if (!password) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= score ? barColor : 'bg-muted'
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs font-medium', labelColor)}>
        Força: {levelLabel}
      </p>
      <ul className="space-y-1">
        {RULES.map((rule) => {
          const ok = checks[rule.key];
          return (
            <li
              key={rule.key}
              className={cn(
                'flex items-center gap-2 text-xs',
                ok ? 'text-muted-foreground' : 'text-muted-foreground/70'
              )}
            >
              {ok ? (
                <Check className="h-3 w-3 text-green-600 dark:text-green-500" />
              ) : (
                <X className="h-3 w-3 text-muted-foreground/60" />
              )}
              <span className={ok ? 'line-through opacity-70' : ''}>{rule.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

import { Pergunta, Respostas } from '@/config/diagnosticoSchema';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  pergunta: Pergunta;
  respostas: Respostas;
  onChange: (id: string, value: unknown) => void;
}

export const PerguntaField = ({ pergunta, respostas, onChange }: Props) => {
  const value = respostas[pergunta.id];

  // Para radio dependente (estratégia maior/menor retorno)
  let opcoes = pergunta.opcoes ?? [];
  if (pergunta.opcoesDe) {
    const base = respostas[pergunta.opcoesDe];
    if (Array.isArray(base)) {
      // pega labels do schema-mãe
      const baseField = pergunta.opcoesDe;
      const baseValues = base as string[];
      // tentamos achar labels no schema; fallback usa o próprio value como label
      opcoes = baseValues.map((v) => ({
        value: v,
        label: pergunta.opcoes?.find((o) => o.value === v)?.label ?? v,
      }));
      // se não tinha opcoes próprias, usar fallback simples
      if (opcoes.length === 0) {
        opcoes = baseValues.map((v) => ({ value: v, label: v }));
      }
      // ignore baseField unused warning
      void baseField;
    }
  }

  const labelText = (
    <Label className="text-sm font-medium">
      {pergunta.label}
      {pergunta.obrigatoria && <span className="text-destructive"> *</span>}
    </Label>
  );

  switch (pergunta.tipo) {
    case 'radio':
      if (pergunta.opcoesDe && opcoes.length === 0) {
        return (
          <div className="space-y-2">
            {labelText}
            <p className="text-xs text-muted-foreground italic">
              Selecione opções na pergunta anterior primeiro.
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-2">
          {labelText}
          <RadioGroup
            value={(value as string) ?? ''}
            onValueChange={(v) => onChange(pergunta.id, v)}
          >
            {opcoes.map((o) => (
              <div
                key={o.value}
                className="flex items-center space-x-2 rounded-md border p-2 hover:bg-muted/40"
              >
                <RadioGroupItem value={o.value} id={`${pergunta.id}-${o.value}`} />
                <Label
                  htmlFor={`${pergunta.id}-${o.value}`}
                  className="font-normal cursor-pointer flex-1"
                >
                  {o.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case 'multi-select':
      return (
        <div className="space-y-2">
          {labelText}
          <div className="space-y-1">
            {opcoes.map((o) => {
              const arr = Array.isArray(value) ? (value as string[]) : [];
              const checked = arr.includes(o.value);
              return (
                <div
                  key={o.value}
                  className="flex items-center space-x-2 rounded-md border p-2 hover:bg-muted/40"
                >
                  <Checkbox
                    id={`${pergunta.id}-${o.value}`}
                    checked={checked}
                    onCheckedChange={(c) => {
                      const next = c
                        ? [...arr, o.value]
                        : arr.filter((v) => v !== o.value);
                      onChange(pergunta.id, next);
                    }}
                  />
                  <Label
                    htmlFor={`${pergunta.id}-${o.value}`}
                    className="font-normal cursor-pointer flex-1"
                  >
                    {o.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'number':
    case 'currency':
    case 'percent': {
      const suffix = pergunta.tipo === 'percent' ? '%' : pergunta.tipo === 'currency' ? 'R$' : null;
      return (
        <div className="space-y-2">
          {labelText}
          <div className="flex items-center gap-2">
            {suffix === 'R$' && <span className="text-sm text-muted-foreground">R$</span>}
            <Input
              type="number"
              value={(value as number | string) ?? ''}
              onChange={(e) =>
                onChange(pergunta.id, e.target.value === '' ? '' : Number(e.target.value))
              }
              placeholder={pergunta.placeholder}
              min={pergunta.min}
              max={pergunta.max}
            />
            {suffix === '%' && <span className="text-sm text-muted-foreground">%</span>}
          </div>
        </div>
      );
    }

    case 'textarea':
      return (
        <div className="space-y-2">
          {labelText}
          <Textarea
            value={(value as string) ?? ''}
            onChange={(e) => onChange(pergunta.id, e.target.value)}
            placeholder={pergunta.placeholder}
            rows={3}
          />
        </div>
      );

    default:
      return null;
  }
};

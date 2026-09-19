import { Pipe, PipeTransform } from '@angular/core';

const ETIQUETAS: Record<string, string> = {
  income: 'Ingreso',
  expense: 'Gasto',
  debt: 'Deuda',
  saving: 'Ahorro'
};

/**
 * Traduce el tipo que viaja por la API (income, expense, debt, saving)
 * a la etiqueta que se muestra en pantalla.
 */
@Pipe({
  name: 'kindLabel',
  standalone: true
})
export class KindLabelPipe implements PipeTransform {
  transform(kind: string | null | undefined): string {
    if (!kind) return '—';
    return ETIQUETAS[kind.toLowerCase()] ?? kind;
  }
}

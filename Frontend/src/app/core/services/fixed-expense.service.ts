import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FixedExpense {
  id: string;
  nombre: string;
  amount: number;
  paymentDay: number;
  /** Apartar la mitad en cada quincena en vez de todo en la del pago */
  splitBetweenPaydays: boolean;
  categoryId: string | null;
  categoryName: string;
  activo: boolean;
  /** Si ya se registró el pago de este recibo en el mes en curso */
  paidThisMonth: boolean;
}

export interface SaveFixedExpenseRequest {
  nombre: string;
  amount: number;
  paymentDay: number;
  splitBetweenPaydays: boolean;
  categoryId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class FixedExpenseService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5211/api/fixedexpenses';

  getFixedExpenses(): Observable<FixedExpense[]> {
    return this.http.get<FixedExpense[]>(this.apiUrl);
  }

  createFixedExpense(data: SaveFixedExpenseRequest): Observable<FixedExpense> {
    return this.http.post<FixedExpense>(this.apiUrl, data);
  }

  updateFixedExpense(id: string, data: SaveFixedExpenseRequest): Observable<FixedExpense> {
    return this.http.put<FixedExpense>(`${this.apiUrl}/${id}`, data);
  }

  /** Registra el pago del recibo como transacción de gasto. */
  payFixedExpense(id: string): Observable<FixedExpense> {
    return this.http.post<FixedExpense>(`${this.apiUrl}/${id}/payments`, {});
  }

  deleteFixedExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

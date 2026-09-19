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

  deleteFixedExpense(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Debt } from '../models/domain.models';

export interface SaveDebtRequest {
  nombre: string;
  balance: number;
  originalAmount: number;
  annualRate: number;
  minimumPayment: number;
  paymentDay: number;
}

@Injectable({
  providedIn: 'root'
})
export class DebtService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5211/api/debts';

  getDebts(): Observable<Debt[]> {
    return this.http.get<Debt[]>(this.apiUrl);
  }

  getDebt(id: string): Observable<Debt> {
    return this.http.get<Debt>(`${this.apiUrl}/${id}`);
  }

  createDebt(data: SaveDebtRequest): Observable<Debt> {
    return this.http.post<Debt>(this.apiUrl, data);
  }

  updateDebt(id: string, data: SaveDebtRequest): Observable<Debt> {
    return this.http.put<Debt>(`${this.apiUrl}/${id}`, data);
  }

  deleteDebt(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  spent: number;
  month: number;
  year: number;
}

export interface SaveBudgetRequest {
  categoryId: string;
  amount: number;
  month: number;
  year: number;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5211/api/budgets';

  getBudgets(month: number, year: number): Observable<Budget[]> {
    const params = new HttpParams().set('month', month).set('year', year);
    return this.http.get<Budget[]>(this.apiUrl, { params });
  }

  createBudget(data: SaveBudgetRequest): Observable<Budget> {
    return this.http.post<Budget>(this.apiUrl, data);
  }

  updateBudget(id: string, data: SaveBudgetRequest): Observable<Budget> {
    return this.http.put<Budget>(`${this.apiUrl}/${id}`, data);
  }

  deleteBudget(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

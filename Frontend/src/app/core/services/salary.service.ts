import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Salary {
  id: string;
  amount: number;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalaryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5211/api/salaries';

  getSalaries(): Observable<Salary[]> {
    return this.http.get<Salary[]>(this.apiUrl);
  }

  /** Devuelve null (204) si el usuario aún no ha registrado ningún salario. */
  getCurrentSalary(): Observable<Salary | null> {
    return this.http.get<Salary | null>(`${this.apiUrl}/current`);
  }

  saveSalary(amount: number): Observable<Salary> {
    return this.http.post<Salary>(this.apiUrl, { amount });
  }
}

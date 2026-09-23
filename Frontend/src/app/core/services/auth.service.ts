import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { User, AuthResponse, JwtToken } from '../models/domain.models';

export interface ForgotPasswordResponse {
  message: string;
  /** Sólo en desarrollo: el enlace que iría por correo */
  resetUrl?: string | null;
  token?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5211/api';

  // Deben declararse antes que los subjects: los inicializadores corren en
  // orden y hasToken()/getStoredUser() los leerían como undefined.
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  private userSubject = new BehaviorSubject<User | null>(this.getStoredUser());

  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  user$ = this.userSubject.asObservable();

  constructor() {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        this.storeToken(response.token);
        this.storeUser(response.user);
        this.isAuthenticatedSubject.next(true);
        this.userSubject.next(response.user);
      })
    );
  }

  register(nombre: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, {
      nombre,
      email,
      password
    }).pipe(
      tap(response => {
        this.storeToken(response.token);
        this.storeUser(response.user);
        this.isAuthenticatedSubject.next(true);
        this.userSubject.next(response.user);
      })
    );
  }

  logout(): Observable<void> {
    return of(void 0).pipe(
      tap(() => {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.isAuthenticatedSubject.next(false);
        this.userSubject.next(null);
      })
    );
  }

  /**
   * Pide un enlace de recuperación. El backend responde lo mismo exista o no
   * el correo, así que aquí no hay caso de error que distinguir.
   *
   * En desarrollo la respuesta trae `resetUrl`/`token` para poder probar el
   * flujo sin servidor de correo; en producción vienen vacíos.
   */
  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/auth/forgot-password`, { email });
  }

  /**
   * Canjea el enlace por una contraseña nueva. No pide la anterior: el token
   * es la prueba de acceso.
   */
  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/auth/reset-password`, {
      token,
      newPassword
    });
  }

  /**
   * Obtiene el token JWT actual
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.userSubject.getValue();
  }

  /**
   * Si el usuario actual es administrador. Sirve para mostrar u ocultar el
   * panel; el permiso real lo aplica el backend con el rol del token.
   */
  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'admin';
  }

  /**
   * Refresca el usuario en memoria y en localStorage tras editar el perfil
   */
  updateStoredUser(user: User): void {
    this.storeUser(user);
    this.userSubject.next(user);
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  /**
   * Decodifica el token JWT (MOCK)
   */
  decodeToken(): JwtToken | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const parts = token.split('.');
      const decoded = JSON.parse(atob(parts[1]));
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Verifica si el token ha expirado
   */
  isTokenExpired(): boolean {
    const decoded = this.decodeToken();
    if (!decoded) return true;

    const now = Date.now() / 1000;
    return decoded.exp < now;
  }


  /**
   * Almacena el token en localStorage
   */
  private storeToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Almacena el usuario en localStorage
   */
  private storeUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  /**
   * Recupera el usuario almacenado
   */
  private getStoredUser(): User | null {
    const stored = localStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Verifica si hay un token válido
   */
  private hasToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token && !this.isTokenExpired();
  }
}

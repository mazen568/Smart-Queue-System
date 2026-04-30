import { inject, Injectable, signal } from '@angular/core';
import { User } from '../../../types/user';
import { HttpClient } from '@angular/common/http';
import { loginForm, registerForm } from '../../../types/forms';
import { environment } from '../../../../environments/environment';
import { finalize, tap } from 'rxjs';
import { refreshDTO, UserDTO } from '../../../types/auth.dto';

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private _User = signal<User | null>(this.readStoredUser());

  private token = signal<string | null>(this._User()?.accessToken ?? null);

  // user = this._User.asReadonly()

  API_URL = environment.apiUrl

  private http = inject(HttpClient)

  login(loginData: loginForm) {
    return this.http.post<UserDTO>(`${this.API_URL}/auth/login`, loginData).pipe(
      tap((res) => {
        this._User.set(res.user)
        this.token.set(res.user.accessToken)
        localStorage.setItem('user', JSON.stringify(res.user))
      })
    )
  }

  register(registerData: registerForm) {
    return this.http.post<UserDTO>(`${this.API_URL}/auth/register`, registerData)
  }

  logout() {
    return this.http.post(`${this.API_URL}/auth/logout`, {}).pipe(
      finalize(() => {
        this._User.set(null);
        this.token.set(null);
        localStorage.removeItem('user');
      })
    );
  }

  refreshToken() {
    return this.http.post<refreshDTO>(
      `${this.API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(res => {
        this.token.set(res.accessToken);
      })
    );
  }

  getToken() {
    return this.token()//Used by interceptor
  }

  getCurrentUser() {
    return this._User()//Used by UI, guards, role checks
  }

  private readStoredUser(): User | null {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;

      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') return null;

      return parsed as User;
    } catch {
      return null;
    }
  }

}

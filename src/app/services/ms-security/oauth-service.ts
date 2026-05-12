import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Auth, GoogleAuthProvider, GithubAuthProvider, OAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { environment } from '@environments/environment';
import { AuthResponse } from '@app/services/ms-security/security';

@Injectable({
  providedIn: 'root'
})
export class OAuthService {
  private auth = inject(Auth);
  private http = inject(HttpClient);

  // =========================
  // FIREBASE — GOOGLE
  // =========================
  async loginWithGoogle(): Promise<string | null> {
    try {
      const result = await signInWithPopup(this.auth, new GoogleAuthProvider());
      return await result.user.getIdToken();
    } catch (error) {
      console.error('Error Google OAuth: ', error);
      return null;
    }
  }

  // =========================
  // FIREBASE — GITHUB
  // =========================
  async loginWithGithub(): Promise<string | null> {
    try {
      const result = await signInWithPopup(this.auth, new GithubAuthProvider());
      return await result.user.getIdToken();
    } catch (error) {
      console.error('Error GitHub OAuth: ', error);
      return null;
    }
  }

  // =========================
  // FIREBASE — MICROSOFT
  // =========================
  async loginWithMicrosoft(): Promise<string | null> {
    try {
      const result = await signInWithPopup(this.auth, new OAuthProvider('microsoft.com'));
      return await result.user.getIdToken();
    } catch (error) {
      console.error('Error Microsoft OAuth: ', error);
      return null;
    }
  }

  // =========================
  // BACKEND — GOOGLE
  // =========================
  loginOAuthGoogle(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.url_backend}/api/public/security/login/oauth/google`,
      { idToken }
    );
  }

  // =========================
  // BACKEND — GITHUB
  // =========================
  loginOAuthGithub(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.url_backend}/api/public/security/login/oauth/github`,
      { idToken }
    );
  }

  // =========================
  // BACKEND — MICROSOFT
  // =========================
  loginOAuthMicrosoft(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${environment.url_backend}/api/public/security/login/oauth/microsoft`,
      { idToken }
    );
  }

}
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5288/api/Usuario/login';
  private apiUrlRecuperar = 'http://localhost:5288/api/Usuario/recuperar-contrasena';

  constructor(private http: HttpClient) {}

  login(nombre: string, contraseña: string) {
    return this.http.post<{ token: string }>(this.apiUrl, {
      nombre,
      contraseña,
    });
  }

  guardarToken(token: string) {
    localStorage.setItem('token', token);
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  obtenerIdUsuario(): number | null {
    const token = this.obtenerToken();
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return parseInt(payload.idUsuario); 
  }
   recuperarContrasena(correo: string) {
  // Le decimos a HttpClient que la respuesta es un string
  return this.http.post(this.apiUrlRecuperar, { correo }, { responseType: 'text' });
}

}

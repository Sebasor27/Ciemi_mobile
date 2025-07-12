import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:5288/api'; // Ajusta tu URL

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  // Obtiene todos los emprendedores
  getEmprendedores() {
    return this.http.get(`${this.baseUrl}/Emprendedores`);
  }

  // Inactiva un emprendedor
  inactivarEmprendedor(id: number) {
    return this.http.delete(`${this.baseUrl}/Emprendedores/${id}`);
  }

  // Activa un emprendedor
  activarEmprendedor(id: number) {
    return this.http.put(`${this.baseUrl}/Emprendedores/activate/${id}`, {});
  }
  // Obtiene detalles de un emprendedor
getEmprendedor(id: number) {
  return this.http.get(`${this.baseUrl}/Emprendedores/${id}`);
}

// Actualiza emprendedor
updateEmprendedor(id: number, data: any) {
  return this.http.put(`${this.baseUrl}/Emprendedores/${id}`, data);
}

// Obtiene encuestas del emprendedor
getEncuestasEmprendedor(id: number) {
  return this.http.get(`${this.baseUrl}/Emprendedores/${id}/encuestas`);
}
// Crea nuevo emprendedor
createEmprendedor(data: any) {
  return this.http.post(`${this.baseUrl}/Emprendedores`, data);
}
}

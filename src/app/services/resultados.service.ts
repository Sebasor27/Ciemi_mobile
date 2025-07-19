import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ResultadosService {
  private apiUrl = 'http://localhost:5288/api';

  constructor(private http: HttpClient) {}

  getIndicadoresDimensiones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/PreguntasIepm/detailed`);
  }

  getEncuestas(idEmprendedor: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Encuesta/encuestas/${idEmprendedor}`);
  }

  getEncuestasIEPM(idEmprendedor: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/IepmCalculation/Encuestas/${idEmprendedor}`);
  }

  getEmprendedor(idEmprendedor: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Emprendedores/${idEmprendedor}`);
  }

  getResultadosResumen(idEmprendedor: number, idEncuesta: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/Encuesta/resultados-resumen/${idEmprendedor}/${idEncuesta}`);
  }

  getResultadosIEPM(idEmprendedor: number, idEncuesta: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/IepmCalculation/Resultado/${idEmprendedor}/${idEncuesta}`);
  }
}
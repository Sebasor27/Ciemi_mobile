// src/app/services/encuesta-iepm.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EncuestaIepmService {
  private baseUrl = 'https://localhost:7075/api';

  constructor(private http: HttpClient) { }

  getPreguntasDetalladas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/PreguntasIepm/detailed`);
  }

  enviarRespuestas(respuestas: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/RespuestasIepm`, respuestas);
  }
}
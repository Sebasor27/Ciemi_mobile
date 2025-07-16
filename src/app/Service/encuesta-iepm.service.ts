import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EncuestaIepmService {
  private preguntasUrl = 'http://localhost:5288/api/PreguntasIepm/detailed';
  private respuestasUrl = 'http://localhost:5288/api/RespuestasIepm';

  constructor(private http: HttpClient) {}

  obtenerPreguntas(): Observable<any[]> {
    return this.http.get<any[]>(this.preguntasUrl);
  }

  enviarRespuestas(payload: any[]): Observable<any> {
    return this.http.post(this.respuestasUrl, payload);
  }
}

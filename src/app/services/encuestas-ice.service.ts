import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EncuestaIceService {
  private preguntasUrl = 'http://localhost:5288/api/PreguntasIce';
  private competenciasUrl = 'http://localhost:5288/api/Competencia';
  private respuestasUrl = 'http://localhost:5288/api/EncuestasIce/procesar-encuesta';

  constructor(private http: HttpClient) {}

  obtenerPreguntas(): Observable<any[]> {
    return this.http.get<any[]>(this.preguntasUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  obtenerCompetencias(): Observable<any[]> {
    return this.http.get<any[]>(this.competenciasUrl)
      .pipe(
        catchError(this.handleError)
      );
  }

  enviarRespuestas(payload: any): Observable<any> {
    return this.http.post(this.respuestasUrl, payload)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en el servicio:', error);
    
    if (error.status === 0) {
      // Error del lado del cliente o problema de red
      console.error('Error de conexión:', error.error);
    } else {
      // Error del lado del servidor
      console.error(`Error ${error.status}: ${error.message}`);
    }
    
    return throwError(() => new Error('Algo salió mal; por favor intenta de nuevo.'));
  }
}
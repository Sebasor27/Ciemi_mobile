import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';

interface EncuestaResponse {
  idEncuesta: number;
  fechaEvaluacion: string;
  fechaAplicacion: string;
}

interface EmprendedorResponse {
  idEmprendedor: number;
  nombre: string;
  email?: string;
}

interface ResultadoResumenResponse {
  resultados: any[];
  resumen: {
    valorIceTotal: number;
  };
}

interface ResultadoIEPMResponse {
  iepm: {
    iepm: number;
    valoracion: string;
  };
  dimensiones: Array<{
    idDimension: number;
    valor: number;
  }>;
  indicadores: Array<{
    idIndicador: number;
    valor: number;
  }>;
  accionMejora: {
    descripcion: string;
    recomendaciones: string;
    rangoMin: number;
    rangoMax: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ResultadosService {

  private readonly apiUrl = 'http://localhost:5288/api';
  private readonly headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  constructor(private http: HttpClient) {}

  getIndicadoresDimensiones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/PreguntasIepm/detailed`, { headers: this.headers })
      .pipe(
        retry(2),
        catchError(this.handleError('getIndicadoresDimensiones'))
      );
  }

  getEncuestas(idEmprendedor: number): Observable<EncuestaResponse[]> {
    this.validateId(idEmprendedor, 'idEmprendedor');

    return this.http.get<EncuestaResponse[]>(`${this.apiUrl}/Encuesta/encuestas/${idEmprendedor}`, { headers: this.headers })
      .pipe(
        map(this.transformEncuestasData),
        retry(2),
        catchError(this.handleError('getEncuestas'))
      );
  }

  getEncuestasIEPM(idEmprendedor: number): Observable<EncuestaResponse[]> {
    this.validateId(idEmprendedor, 'idEmprendedor');

    return this.http.get<EncuestaResponse[]>(`${this.apiUrl}/IepmCalculation/Encuestas/${idEmprendedor}`, { headers: this.headers })
      .pipe(
        map(this.transformEncuestasData),
        retry(2),
        catchError(this.handleError('getEncuestasIEPM'))
      );
  }

  getEmprendedor(idEmprendedor: number): Observable<EmprendedorResponse> {
    this.validateId(idEmprendedor, 'idEmprendedor');

    return this.http.get<EmprendedorResponse>(`${this.apiUrl}/Emprendedores/${idEmprendedor}`, { headers: this.headers })
      .pipe(
        map(this.transformEmprendedorData),
        retry(2),
        catchError(this.handleError('getEmprendedor'))
      );
  }

  getResultadosResumen(idEmprendedor: number, idEncuesta: number): Observable<ResultadoResumenResponse> {
    this.validateId(idEmprendedor, 'idEmprendedor');
    this.validateId(idEncuesta, 'idEncuesta');

    return this.http.get<ResultadoResumenResponse>(`${this.apiUrl}/Encuesta/resultados-resumen/${idEmprendedor}/${idEncuesta}`, { headers: this.headers })
      .pipe(
        map(this.transformResultadosResumen),
        retry(2),
        catchError(this.handleError('getResultadosResumen'))
      );
  }

  getResultadosIEPM(idEmprendedor: number, idEncuesta: number): Observable<ResultadoIEPMResponse> {
    this.validateId(idEmprendedor, 'idEmprendedor');
    this.validateId(idEncuesta, 'idEncuesta');

    return this.http.get<ResultadoIEPMResponse>(`${this.apiUrl}/IepmCalculation/Resultado/${idEmprendedor}/${idEncuesta}`, { headers: this.headers })
      .pipe(
        map(this.transformResultadosIEPM),
        retry(2),
        catchError(this.handleError('getResultadosIEPM'))
      );
  }

  getResultadosIcePorId(idResultado: number): Observable<any> {
    this.validateId(idResultado, 'idResultado');
    
    return this.http.get<any>(`${this.apiUrl}/ResultadosIce/${idResultado}`, { headers: this.headers })
      .pipe(
        retry(2),
        catchError(this.handleError('getResultadosIcePorId'))
      );
  }

  getRespuestasIepm(idEncuesta: number, idEmprendedor: number): Observable<any> {
    this.validateId(idEncuesta, 'idEncuesta');
    this.validateId(idEmprendedor, 'idEmprendedor');
    
    return this.http.get<any>(
      `${this.apiUrl}/RespuestasIepm/encuesta/${idEncuesta}/emprendedor/${idEmprendedor}`, 
      { headers: this.headers }
    ).pipe(
      retry(2),
      catchError(this.handleError('getRespuestasIepm'))
    );
  }

  private transformEncuestasData = (data: any[]): EncuestaResponse[] => {
    if (!Array.isArray(data)) {
      console.warn('transformEncuestasData: datos no son array', data);
      return [];
    }
    return data.map(encuesta => ({
      idEncuesta: encuesta.idEncuesta || 0,
      fechaEvaluacion: encuesta.fechaEvaluacion || new Date().toISOString(),
      fechaAplicacion: encuesta.fechaAplicacion || new Date().toISOString()
    }));
  }

  private transformEmprendedorData = (data: any): EmprendedorResponse => {
    return {
      idEmprendedor: data.idEmprendedor || 0,
      nombre: data.nombre || 'Sin nombre',
      email: data.email || data.correo || undefined
    };
  }

  private transformResultadosResumen = (data: any): ResultadoResumenResponse => {
    return {
      resultados: Array.isArray(data.resultados) ? data.resultados : (Array.isArray(data) ? data : []),
      resumen: {
        valorIceTotal: data.resumen?.valorIceTotal || data.valorTotal || 0
      }
    };
  }

  private transformResultadosIEPM = (data: any): ResultadoIEPMResponse => {
    return {
      iepm: {
        iepm: data.iepm?.iepm || data.valorIepm || 0,
        valoracion: data.iepm?.valoracion || data.nivel || 'No disponible'
      },
      dimensiones: Array.isArray(data.dimensiones) ? data.dimensiones : [],
      indicadores: Array.isArray(data.indicadores) ? data.indicadores : [],
      accionMejora: {
        descripcion: data.accionMejora?.descripcion || 'Sin descripción',
        recomendaciones: data.accionMejora?.recomendaciones || 'Sin recomendaciones',
        rangoMin: data.accionMejora?.rangoMin || 0,
        rangoMax: data.accionMejora?.rangoMax || 0
      }
    };
  }

  private validateId(id: number, paramName: string): void {
    if (!id || id <= 0 || isNaN(id)) {
      throw new Error(`${paramName} debe ser un número válido mayor a 0`);
    }
  }

  private handleError = (operation: string) => {
    return (error: HttpErrorResponse): Observable<never> => {
      console.error(`Error en ${operation}:`, error);
      console.error('Status:', error.status);
      console.error('URL:', error.url);
      console.error('Message:', error.message);
      
      let userMessage = 'Error desconocido';
      
      if (error.status === 0) {
        userMessage = 'Error de conexión. Verifique que el servidor esté ejecutándose.';
      } else if (error.status === 404) {
        userMessage = 'Endpoint no encontrado. Verifique la URL del API.';
      } else if (error.status >= 400 && error.status < 500) {
        userMessage = 'Error en la solicitud. Verifique los datos enviados.';
      } else if (error.status >= 500) {
        userMessage = 'Error del servidor. Intente más tarde.';
      }
      
      return throwError(() => new Error(`${operation}: ${userMessage}`));
    };
  }

  checkApiHealth(): Observable<boolean> {
    return this.http.get(`${this.apiUrl}/health`, { headers: this.headers })
      .pipe(
        map(() => true),
        catchError(() => [false])
      );
  }

  getApiUrl(): string {
    return this.apiUrl;
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as CryptoJS from 'crypto-js';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SeguridadRealService {
  readonly apiUrl = 'http://localhost:5288/api';
  constructor(private http: HttpClient) {}

  cifrarAES(texto: string) {
    const t0 = performance.now();
    const key = CryptoJS.enc.Utf8.parse('12345678901234567890123456789012');
    const iv  = CryptoJS.enc.Utf8.parse('1234567890123456');
    const cifrado = CryptoJS.AES.encrypt(texto, key, { iv, mode: CryptoJS.mode.CBC }).toString();
    const descifrado = CryptoJS.AES.decrypt(cifrado, key, { iv, mode: CryptoJS.mode.CBC }).toString(CryptoJS.enc.Utf8);
    const t1 = performance.now();
    return { original: texto, cifrado, descifrado, ms: t1 - t0 };
  }

  hashSHA(pwd: string) {
    return { md5: CryptoJS.MD5(pwd).toString(), sha256: CryptoJS.SHA256(pwd).toString(), sha512: CryptoJS.SHA512(pwd).toString() };
  }

  sanitizarInput(html: string) {
    const map: any = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
    return html.replace(/[&<>"'/]/g, s => map[s]);
  }

  verificarHTTPS$() {
    return this.http.get(`${this.apiUrl}/health`, { observe: 'response' }).pipe(
      map(resp => ({ ok: resp.status === 200, status: resp.status, cert: resp.headers.get('x-cert-fingerprint') || undefined, message: 'API responde por HTTPS/HTTP real' })),
      catchError((e: HttpErrorResponse) => throwError(() => new Error(`API caída o sin HTTPS – ${e.message}`)))
    );
  }

  getEmprendedores$() { return this.http.get<any[]>(`${this.apiUrl}/Emprendedores`); }

  async backupCifrado(data: any[]) {
    const json = JSON.stringify(data);
    const key = CryptoJS.enc.Utf8.parse('claveDe32BytesExactaParaAES256');
    const iv  = CryptoJS.enc.Utf8.parse('16BytesParaElIV!!');
    const enc = CryptoJS.AES.encrypt(json, key, { iv }).toString();
    const fileName = `backup-real-${Date.now()}.json.enc`;

    try {
      // Detectar si está en navegador (ionic serve) o en dispositivo móvil
      if (this.isRunningInBrowser()) {
        // DESARROLLO: Descargar archivo en navegador (carpeta Downloads)
        this.downloadFileInBrowser(enc, fileName);
        console.log('DESARROLLO: Backup descargado en carpeta Downloads del navegador');
        return { 
          filename: fileName, 
          size: enc.length, 
          location: 'Downloads del navegador',
          environment: 'development'
        };
      } else {
        // MÓVIL: Usar Capacitor Filesystem
        await Filesystem.writeFile({ 
          path: fileName, 
          data: enc, 
          directory: Directory.ExternalStorage, 
          encoding: Encoding.UTF8 
        });
        
        // Obtener la ruta completa en el dispositivo
        const fileUri = await Filesystem.getUri({
          directory: Directory.ExternalStorage,
          path: fileName
        });
        
        console.log('MÓVIL: Backup guardado en:', fileUri.uri);
        return { 
          filename: fileName, 
          size: enc.length, 
          location: fileUri.uri,
          environment: 'mobile'
        };
      }
    } catch (error) {
      console.error('Error al crear backup:', error);
      throw new Error(`Error al crear backup: ${error}`);
    }
  }

  private isRunningInBrowser(): boolean {
    return !!(window && window.location && window.location.protocol.startsWith('http'));
  }

  private downloadFileInBrowser(data: string, filename: string): void {
    try {
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpiar memoria
      window.URL.revokeObjectURL(url);
      
      console.log(`Archivo ${filename} descargado exitosamente`);
    } catch (error) {
      console.error('Error al descargar archivo:', error);
      throw error;
    }
  }

  private logs: any[] = [];
  log(evento: string, detalle: any) { this.logs.push({ t: new Date().toISOString(), evento, detalle }); }
  exportLogs() { return JSON.stringify(this.logs, null, 2); }
}
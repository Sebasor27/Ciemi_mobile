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
    await Filesystem.writeFile({ path: fileName, data: enc, directory: Directory.ExternalStorage, encoding: Encoding.UTF8 });
    return { filename: fileName, size: enc.length };
  }

  private logs: any[] = [];
  log(evento: string, detalle: any) { this.logs.push({ t: new Date().toISOString(), evento, detalle }); }
  exportLogs() { return JSON.stringify(this.logs, null, 2); }
}
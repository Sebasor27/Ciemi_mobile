import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpClientModule } from '@angular/common/http';
import { SeguridadRealService } from '../services/seguridad-real.service';
import jsPDF from 'jspdf';
import { finalize, firstValueFrom, map, catchError, throwError } from 'rxjs';

@Component({
  selector: 'app-seguridad-real',
  templateUrl: './seguridad-real.page.html',
  styleUrls: ['./seguridad-real.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, HttpClientModule],
  providers: [SeguridadRealService]
})
export class SeguridadRealPage {
  private seg = inject(SeguridadRealService);
  private http = inject(HttpClient);
  private router = inject(Router);
  
  cargando = false;
  idEmprendedor: string = ''; // Agregar esta propiedad
  demos: any[] = [
    { id: 'aes', titulo: 'Cifrado AES-256', sub: 'Confidencialidad', icon: 'lock-closed', status: 'Pendiente', color: 'medium', resultado: '' },
    { id: 'hash', titulo: 'Hash SHA-256/512', sub: 'Integridad', icon: 'finger-print', status: 'Pendiente', color: 'medium', resultado: '' },
    { id: 'xss', titulo: 'Sanitización Anti-XSS', sub: 'Mitigación vulnerabilidad', icon: 'shield-checkmark', status: 'Pendiente', color: 'medium', resultado: '' },
    { id: 'https', titulo: 'HTTPS/API Real', sub: 'Seguridad en red', icon: 'globe', status: 'Pendiente', color: 'medium', resultado: '' },
    { id: 'back', titulo: 'Backup cifrado datos reales', sub: 'Disponibilidad', icon: 'cloud-upload', status: 'Pendiente', color: 'medium', resultado: '' }
  ];

  async ejecutarDemoCompleta() {
    this.cargando = true;
    for (const demo of this.demos) {
      await this.ejecutar(demo);
    }
    this.cargando = false;
  }

  navigateBack(): void {
    this.router.navigate(['/home']);
  }

  private async ejecutar(demo: any) {
    demo.status = 'Ejecutando...'; 
    demo.color = 'warning'; 
    demo.resultado = '';
    
    try {
      switch (demo.id) {
        case 'aes': {
          const resultado = this.seg.cifrarAES('Texto sensible de emprendedores');
          demo.resultado = `Original: ${resultado.original}\nCifrado: ${resultado.cifrado}\nDescifrado: ${resultado.descifrado}\nTiempo: ${resultado.ms} ms`;
          break;
        }
        case 'hash': {
          const hash = this.seg.hashSHA('MiPassword123!@#');
          demo.resultado = `MD5: ${hash.md5}\nSHA256: ${hash.sha256}\nSHA512: ${hash.sha512}`;
          break;
        }
        case 'xss': {
          const dirty = '<script>alert("XSS")</script>';
          const clean = this.seg.sanitizarInput(dirty);
          demo.resultado = `Entrada: ${dirty}\nSalida: ${clean}`;
          break;
        }
        case 'https': {
          try {
            const response = await firstValueFrom(
              this.verificarHTTPS$().pipe(
                finalize(() => {
                  console.log('Verificación HTTPS completada');
                })
              )
            );
            demo.resultado = `API: ${this.seg['apiUrl'] || 'URL no disponible'}\nStatus: ${response.status}\nCert fingerprint: ${response.cert || 'No disponible'}\nMensaje: ${response.message}`;
          } catch (error) {
            throw new Error(`Error en verificación HTTPS: ${error}`);
          }
          break;
        }
        case 'back': {
          try {
            const emprendedores = await firstValueFrom(this.seg.getEmprendedores$());
            const backup = await this.seg.backupCifrado(emprendedores.slice(0, 3));
            demo.resultado = `Emprendedores respaldados: 3\nBackup: ${backup.filename} (${backup.size} bytes)`;
          } catch (error) {
            throw new Error(`Error en backup: ${error}`);
          }
          break;
        }
      }
      demo.status = 'Éxito'; 
      demo.color = 'success';
      this.seg.log(demo.id, 'OK');
    } catch (error) {
      demo.status = 'Error'; 
      demo.color = 'danger'; 
      demo.resultado = String(error);
      this.seg.log(demo.id, 'ERROR');
    }
  }

  verificarHTTPS$() {
    // Usamos TU endpoint real → /PreguntasIce
    return this.http.get(`${this.seg['apiUrl']}/PreguntasIce`, { observe: 'response' }).pipe(
      map(resp => ({
        ok: resp.status === 200,
        status: resp.status,
        cert: resp.headers.get('x-cert-fingerprint') || undefined,
        message: 'API responde por HTTPS/HTTP real – endpoint /PreguntasIce'
      })),
      catchError((e: HttpErrorResponse) => throwError(() => new Error(`API caída o sin HTTPS – ${e.message}`)))
    );
  }

  async exportarReporte() {
    try {
      // Crear PDF
      const pdf = new jsPDF();
      const fecha = new Date().toLocaleDateString('es-ES');
      const hora = new Date().toLocaleTimeString('es-ES');
      
      // Título y encabezado
      pdf.setFontSize(18);
      pdf.text('REPORTE DE SEGURIDAD INFORMÁTICA', 20, 20);
      
      pdf.setFontSize(12);
      pdf.text(`Fecha: ${fecha} - Hora: ${hora}`, 20, 35);
      pdf.text('Demostraciones de Ciberseguridad', 20, 45);
      
      let yPosition = 60;
      
      // Agregar cada demo al PDF
      this.demos.forEach((demo, index) => {
        // Verificar si necesitamos nueva página
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Título de la demo
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${index + 1}. ${demo.titulo}`, 20, yPosition);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Categoría: ${demo.sub}`, 20, yPosition + 8);
        pdf.text(`Estado: ${demo.status}`, 20, yPosition + 16);
        
        // Resultado (multilinea)
        if (demo.resultado) {
          const resultadoLines = pdf.splitTextToSize(demo.resultado, 170);
          pdf.text('Resultado:', 20, yPosition + 24);
          pdf.text(resultadoLines, 20, yPosition + 32);
          yPosition += 32 + (resultadoLines.length * 5) + 15;
        } else {
          yPosition += 35;
        }
      });
      
      // Descargar PDF directamente
      const fileName = `ReporteSeguridad-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error al exportar reporte:', error);
    }
  }

  scrollToTop() { 
    const content = document.querySelector('ion-content');
    if (content) {
      content.scrollToTop(500);
    }
  }
}
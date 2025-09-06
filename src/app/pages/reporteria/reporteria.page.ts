import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ApiService } from 'src/app/Service/api.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reporteria',
  templateUrl: './reporteria.page.html',
  styleUrls: ['./reporteria.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
})
export class ReporteriaPage implements OnInit {
  reporte: any[] = [];
  reporteFiltrado: any[] = [];
  filtro: string = '';

  displayedColumns = [
    'nombre',
    'correo',
    'fechaRegistro',
    'fechaUltimaEvaluacion',
    'puntajeIEPM',
    'puntajeICE',
  ];

  constructor(private api: ApiService) {}
  
  fechasDisponibles: string[] = [];
  
  ngOnInit() {
    this.loadReporte();
  }

  async loadReporte() {
    try {
      const emprendedores: any = await this.api.getEmprendedores().toPromise();

      const reportePromises = emprendedores.map(async (e: any) => {
        // ICE
        const resumenIce: any = await this.api
          .getResumenIce(e.idEmprendedor)
          .toPromise()
          .catch(() => null);
        const puntajeICE = resumenIce?.ice ?? null;

        // IEPM
        const respuestas: any = await this.api
          .getRespuestasIepm(0, e.idEmprendedor)
          .toPromise()
          .catch(() => []);
        const ultimaEncuesta = respuestas.length
          ? respuestas.sort(
              (a: any, b: any) =>
                new Date(b.fechaCalculo || b.fechaEvaluacion).getTime() -
                new Date(a.fechaCalculo || a.fechaEvaluacion).getTime()
            )[0]
          : null;
        const puntajeIEPM = ultimaEncuesta ? ultimaEncuesta.puntajeIepm : null;

        return {
          nombre: e.nombre,
          correo: e.correo,
          fechaRegistro: e.fechaRegistro,
          fechaUltimaEvaluacion: ultimaEncuesta?.fechaEvaluacion ?? null,
          puntajeIEPM,
          puntajeICE,
        };
        
      });

      this.reporte = await Promise.all(reportePromises);
      this.reporteFiltrado = [...this.reporte];
    } catch (error) {
      console.error('Error cargando reporte:', error);
    }
  }

  fechaDesde: string = '';
  fechaHasta: string = '';

  filtrarReporte() {
    const filtroText = this.filtro.toLowerCase();

    this.reporteFiltrado = this.reporte.filter((r) => {
      // Filtrar por nombre/correo
      const matchesText =
        r.nombre.toLowerCase().includes(filtroText) ||
        r.correo.toLowerCase().includes(filtroText);

      // Filtrar por fecha
      let matchesFecha = true;
      if (this.fechaDesde) {
        matchesFecha =
          matchesFecha &&
          new Date(r.fechaRegistro) >= new Date(this.fechaDesde);
      }
      if (this.fechaHasta) {
        matchesFecha =
          matchesFecha &&
          new Date(r.fechaRegistro) <= new Date(this.fechaHasta);
      }

      return matchesText && matchesFecha;
    });
  }

  exportCSV() {
    const csvRows = [];
    csvRows.push(this.displayedColumns.join(','));

    this.reporteFiltrado.forEach((row) => {
      const values = this.displayedColumns.map((col) => {
        let val = row[col];
        if (val instanceof Date) val = new Date(val).toLocaleDateString();
        return `"${val ?? ''}"`;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_emprendedores.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  exportPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.setTextColor(255, 0, 0);
    doc.text('📄 Reporte Emprendedores', 14, 22); // icono PDF arriba

    autoTable(doc, {
      startY: 30,
      head: [this.displayedColumns.map((c) => c.toUpperCase())],
      body: this.reporteFiltrado.map((r) =>
        this.displayedColumns.map((c) => {
          let val = r[c];
          if (val instanceof Date) val = new Date(val).toLocaleDateString();
          return val ?? '-';
        })
      ),
      theme: 'grid',
      headStyles: { fillColor: [33, 150, 243], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 248, 255] },
    });

    doc.save('reporte_emprendedores.pdf');
  }
  
}

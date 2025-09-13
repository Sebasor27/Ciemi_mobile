import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  displayedColumns = ['nombre', 'correo', 'fechaRegistro'];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadReporte();
  }

  async loadReporte() {
    try {
      const emprendedores: any = await this.api.getEmprendedores().toPromise();

      this.reporte = emprendedores.map((e: any) => ({
        nombre: e.nombre,
        correo: e.correo,
        fechaRegistro: e.fechaRegistro,
      }));

      this.reporteFiltrado = [...this.reporte];
    } catch (error) {
      console.error('Error cargando reporte:', error);
    }
  }

  filtrarReporte() {
    const filtroText = this.filtro.toLowerCase();

    this.reporteFiltrado = this.reporte.filter((r) => {
      return (
        r.nombre.toLowerCase().includes(filtroText) ||
        r.correo.toLowerCase().includes(filtroText)
      );
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
    doc.setTextColor(0, 0, 0);
    doc.text('Reporte Emprendedores', 14, 22);

    autoTable(doc, {
      startY: 30,
      head: [this.displayedColumns.map(c => c.toUpperCase())],
      body: this.reporteFiltrado.map(r =>
        this.displayedColumns.map(c => {
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

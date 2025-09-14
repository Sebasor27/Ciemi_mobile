import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, SegmentCustomEvent } from '@ionic/angular';
import { Chart, registerables, ChartType } from 'chart.js';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ResultadosService } from '../../services/resultados.service';

Chart.register(...registerables);

interface Resultado {
  idCompetencia: number;
  puntuacionCompetencia: number;
  nombre: string;
  color: string;
}

interface Emprendedor {
  idEmprendedor: number;
  nombre: string;
}

interface ResumenResponse {
  resultados: any[];
  resumen?: {
    valorIceTotal: number;
  };
}

interface Estadisticas {
  promedio: number;
  maximo: number;
  minimo: number;
  total: number;
}

type GraficoTipo = 'pie' | 'doughnut' | 'bar';

@Component({
  selector: 'app-grafica-ice-resultados',
  templateUrl: './grafica-ice-resultados.page.html',
  styleUrls: ['./grafica-ice-resultados.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class GraficaIceResultadosPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pieChart', { static: false }) pieChart!: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  private destroy$ = new Subject<void>();

  idEmprendedor: string | null = null;
  idEncuesta: string | null = null;
  emprendedor: Emprendedor | null = null;
  resultados: Resultado[] = [];
  valorIceTotal = 0;

  isLoading = true;
  error: string | null = null;
  tipoGrafico: GraficoTipo = 'pie';

  readonly competenciasNombres = [
    'Comportamiento Emprendedor',
    'Creatividad',
    'Liderazgo',
    'Personalidad Proactiva',
    'Tolerancia a la incertidumbre',
    'Trabajo en Equipo',
    'Pensamiento Estratégico',
    'Proyección Social',
    'Orientación Financiera',
    'Orientación Tecnológica e innovación'
  ];

  readonly colors = [
    '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController,
    private resultadosService: ResultadosService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.resultados.length > 0 && !this.isLoading && !this.error) {
        this.createChart();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  initializeComponent(): void {
    this.initializeParams();
    if (this.isValidParams()) {
      this.loadData();
    }
  }

  private initializeParams(): void {
    this.idEmprendedor = this.route.snapshot.paramMap.get('id');
    this.idEncuesta = this.route.snapshot.paramMap.get('idEncuesta');
  }

  private isValidParams(): boolean {
    if (!this.idEmprendedor || !this.idEncuesta) {
      this.handleError('Parámetros faltantes: ID emprendedor o encuesta requeridos');
      return false;
    }
    return true;
  }

  private async loadData(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      await Promise.all([
        this.fetchEmprendedor(),
        this.fetchResultados()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      this.handleError('Error al cargar los datos. Por favor, intenta nuevamente.');
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchEmprendedor(): Promise<void> {
    if (!this.idEmprendedor) throw new Error('ID emprendedor no disponible');

    try {
      this.emprendedor = await firstValueFrom(
        this.resultadosService.getEmprendedor(Number(this.idEmprendedor))
          .pipe(takeUntil(this.destroy$))
      );

      if (!this.emprendedor) {
        throw new Error('Emprendedor no encontrado');
      }
    } catch (error) {
      console.error('Error fetching emprendedor:', error);
      throw new Error('Error al cargar la información del emprendedor');
    }
  }

  private async fetchResultados(): Promise<void> {
    if (!this.idEmprendedor || !this.idEncuesta) {
      throw new Error('Parámetros faltantes para cargar resultados');
    }

    try {
      const data: ResumenResponse = await firstValueFrom(
        this.resultadosService.getResultadosResumen(
          Number(this.idEmprendedor),
          Number(this.idEncuesta)
        ).pipe(takeUntil(this.destroy$))
      );

      if (!data || !data.resultados) {
        throw new Error('No se encontraron resultados');
      }

      this.resultados = this.transformData(data.resultados);
      this.valorIceTotal = data.resumen?.valorIceTotal || 0;

      setTimeout(() => {
        if (this.resultados.length > 0) {
          this.createChart();
        }
      }, 100);
    } catch (error) {
      console.error('Error fetching resultados:', error);
      throw new Error('Error al cargar los resultados de la encuesta');
    }
  }

  private transformData(resultados: any[]): Resultado[] {
    if (!Array.isArray(resultados)) {
      console.warn('Los resultados no son un array válido');
      return [];
    }

    return resultados.map((resultado, index) => {
      const puntuacion = Number(resultado.puntuacionCompetencia) || 0;
      const idCompetencia = Number(resultado.idCompetencia) || (index + 1);

      return {
        idCompetencia,
        puntuacionCompetencia: puntuacion,
        nombre: resultado.nombre ||
          this.competenciasNombres[idCompetencia - 1] ||
          `Competencia ${idCompetencia}`,
        color: resultado.color || this.colors[index % this.colors.length]
      };
    }).filter(resultado => resultado.puntuacionCompetencia > 0);
  }

  private createChart(): void {
    if (!this.pieChart?.nativeElement || !this.resultados.length) return;

    this.destroyChart();

    const ctx = this.pieChart.nativeElement.getContext('2d');
    if (!ctx) return;

    try {
      const chartConfig = this.getChartConfig();
      this.chart = new Chart(ctx, chartConfig);
    } catch (error) {
      console.error('Error creando el gráfico:', error);
      this.showToast('Error al crear el gráfico', 'danger');
    }
  }

  private getChartConfig() {
    const isBarChart = this.tipoGrafico === 'bar';

    return {
      type: this.tipoGrafico as ChartType,
      data: {
        labels: this.resultados.map(r => r.nombre),
        datasets: [{
          label: 'Puntuación',
          data: this.resultados.map(r => r.puntuacionCompetencia),
          backgroundColor: this.resultados.map(r => r.color),
          borderColor: isBarChart ? this.resultados.map(r => r.color) : '#ffffff',
          borderWidth: isBarChart ? 1 : 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Competencias Emprendedoras (ICE)',
            font: { size: 16, weight: 'bold' as const }
          },
          legend: {
            position: 'bottom' as const,
            labels: {
              font: { size: 12 },
              usePointStyle: true,
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.parsed || (isBarChart ? context.parsed.y : context.parsed);
                const total = this.resultados.reduce((sum, r) => sum + r.puntuacionCompetencia, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return `${context.label}: ${value.toFixed(3)} (${percentage}%)`;
              }
            }
          }
        },
        scales: isBarChart ? {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Puntuación' }
          },
          x: {
            title: { display: true, text: 'Competencias' }
          }
        } : undefined
      }
    };
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private cleanup(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyChart();
  }

  cambiarTipoGrafico(event: Event): void {
    const customEvent = event as SegmentCustomEvent;
    const value = customEvent.detail.value;

    if (value && typeof value === 'string' && ['pie', 'doughnut', 'bar'].includes(value)) {
      this.tipoGrafico = value as GraficoTipo;
      this.createChart();
    }
  }

  calcularIceGeneral(): number {
    return this.valorIceTotal;
  }

  navigateBack(): void {
    this.router.navigate(['/informacion-resultados', this.idEmprendedor])
      .catch(error => this.showToast('Error en la navegación', 'danger'));
  }

  navigateToHome(): void {
    this.router.navigate(['/home'])
      .catch(error => this.showToast('Error en la navegación', 'danger'));
  }

  navegarAResultados(): void {
    this.router.navigate(['/informacion-resultados', this.idEmprendedor])
      .catch(error => this.showToast('Error en la navegación', 'danger'));
  }

  async imprimir(): Promise<void> {
    try {
      if ('print' in window) {
        window.print();
        await this.showToast('Preparando impresión...', 'success');
      } else {
        throw new Error('Impresión no soportada en este navegador');
      }
    } catch (error) {
      await this.showToast('Error al imprimir. Verifica que tu navegador soporte esta función.', 'danger');
    }
  }

  async recargarDatos(): Promise<void> {
    if (this.isValidParams()) {
      await this.loadData();
    }
  }

  private handleError(message: string): void {
    this.error = message;
    this.isLoading = false;
    this.showToast(message, 'danger');
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning' = 'success'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [{ text: 'Cerrar', role: 'cancel' }]
    });
    await toast.present();
  }

  getEstadisticas(): Estadisticas | null {
    if (!this.resultados.length) return null;

    const puntuaciones = this.resultados.map(r => r.puntuacionCompetencia);
    const promedio = puntuaciones.reduce((sum, p) => sum + p, 0) / puntuaciones.length;
    const maximo = Math.max(...puntuaciones);
    const minimo = Math.min(...puntuaciones);

    return {
      promedio: Number(promedio.toFixed(3)),
      maximo: Number(maximo.toFixed(3)),
      minimo: Number(minimo.toFixed(3)),
      total: this.resultados.length
    };
  }
}
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, SegmentCustomEvent } from '@ionic/angular';
import { Chart, registerables, ChartType, ChartConfiguration } from 'chart.js';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ResultadosService } from '../../services/resultados.service';

Chart.register(...registerables);

interface Emprendedor {
  idEmprendedor: number;
  nombre: string;
  email?: string;
}

interface IepmData {
  resultadoTotal: {
    puntaje: number;
    valoracion: string;
    criterio: string;
  };
  porDimension: Array<{
    idDimension: number;
    dimension: string;
    puntaje: number;
    porcentaje: number;
  }>;
  porIndicador: Array<{
    idIndicador: number;
    indicador: string;
    idDimension: number;
    dimension: string;
    enfoque: string;
    puntaje: number;
    porcentaje: number;
  }>;
}

interface IndicadorInfo {
  idIndicador: number;
  nombre: string;
  enfoque: 'Cliente' | 'Emprendedor' | 'Trabajador';
  idDimension: number;
}

interface DimensionInfo {
  idDimension: number;
  nombre: string;
}

type GraficoTipo = 'bar' | 'pie' | 'doughnut' | 'radar';

@Component({
  selector: 'app-grafica-iepm-resultados',
  templateUrl: './grafica-iepm-resultados.page.html',
  styleUrls: ['./grafica-iepm-resultados.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class GraficaIepmResultadosPage implements OnInit, AfterViewInit, OnDestroy {
  
  @ViewChild('chartCanvas') private chartCanvas!: ElementRef<HTMLCanvasElement>;
  
  private chart: Chart | null = null;
  private destroy$ = new Subject<void>();

  // Propiedades principales
  idEmprendedor: string | null = null;
  idEncuesta: string | null = null;
  emprendedor: Emprendedor | null = null;
  iepmData: IepmData | null = null;

  // Estados
  isLoading = true;
  error: string | null = null;
  tipoGrafico: GraficoTipo = 'bar';

  // Información de referencia actualizada (8 indicadores en 3 dimensiones)
  private readonly indicadoresInfo: IndicadorInfo[] = [
    // Dimensión 1: Calidad y Eficiencia Laboral (3 indicadores)
    { idIndicador: 1, nombre: 'Índice de Satisfacción del Cliente', enfoque: 'Cliente', idDimension: 1 },
    { idIndicador: 2, nombre: 'Ingresos', enfoque: 'Emprendedor', idDimension: 1 },
    { idIndicador: 3, nombre: 'Tiempo de Obtención de Permisos', enfoque: 'Emprendedor', idDimension: 1 },
    
    // Dimensión 2: Infraestructura Laboral (3 indicadores)
    { idIndicador: 4, nombre: 'Accesibilidad de la Instalación', enfoque: 'Cliente', idDimension: 2 },
    { idIndicador: 5, nombre: 'Gastos de Transportación', enfoque: 'Trabajador', idDimension: 2 },
    { idIndicador: 6, nombre: 'Comodidad del Trabajador', enfoque: 'Trabajador', idDimension: 2 },
    
    // Dimensión 3: Tecnología e Innovación (2 indicadores)
    { idIndicador: 7, nombre: 'Capacidad Tecnológica', enfoque: 'Emprendedor', idDimension: 3 },
    { idIndicador: 8, nombre: 'Liderazgo Creativo con Énfasis Innovador', enfoque: 'Emprendedor', idDimension: 3 }
  ];

  private readonly dimensionesInfo: DimensionInfo[] = [
    { idDimension: 1, nombre: 'Calidad y Eficiencia Laboral' },
    { idDimension: 2, nombre: 'Infraestructura Laboral' },
    { idDimension: 3, nombre: 'Tecnología e Innovación' }
  ];

  readonly coloresDimensiones = ['#FF6E6E', '#6A8CFF', '#7CFFCB'];
  readonly coloresIndicadores = [
    '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', 
    '#00bcd4', '#009688', '#4caf50', '#8bc34a'
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController,
    private resultadosService: ResultadosService
  ) {}

  ngOnInit(): void {
    this.initializeParams();
    if (this.isValidParams()) {
      this.initializeComponent();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.iepmData && !this.isLoading && !this.error) {
        this.createChart();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    this.cleanup();
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

  async initializeComponent(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      await Promise.all([
        this.fetchEmprendedor(),
        this.fetchIEPMData()
      ]);

    } catch (error) {
      console.error('Error al inicializar componente:', error);
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

  private async fetchIEPMData(): Promise<void> {
    if (!this.idEmprendedor || !this.idEncuesta) {
      throw new Error('Parámetros faltantes para cargar resultados IEPM');
    }

    try {
      const data = await firstValueFrom(
        this.resultadosService.getResultadosIEPM(
          Number(this.idEmprendedor), 
          Number(this.idEncuesta)
        ).pipe(takeUntil(this.destroy$))
      );

      if (!data) {
        throw new Error('No se encontraron resultados IEPM');
      }

      this.iepmData = this.transformIEPMData(data);

      setTimeout(() => {
        if (this.iepmData) {
          this.createChart();
        }
      }, 100);

    } catch (error) {
      console.error('Error fetching IEPM data:', error);
      throw new Error('Error al cargar los resultados IEPM');
    }
  }

  private transformIEPMData(data: any): IepmData {
    return {
      resultadoTotal: {
        puntaje: data.iepm?.iepm || 0,
        valoracion: data.iepm?.valoracion || 'N/A',
        criterio: data.accionMejora?.descripcion || 'N/A'
      },
      porDimension: (data.dimensiones || []).map((d: any) => ({
        idDimension: d.idDimension,
        dimension: this.getNombreDimension(d.idDimension),
        puntaje: d.valor,
        porcentaje: (d.valor / 5) * 100
      })),
      porIndicador: (data.indicadores || []).map((i: any) => {
        const indicadorInfo = this.getIndicadorInfo(i.idIndicador);
        return {
          idIndicador: i.idIndicador,
          indicador: indicadorInfo.nombre,
          idDimension: indicadorInfo.idDimension,
          dimension: this.getNombreDimension(indicadorInfo.idDimension),
          enfoque: indicadorInfo.enfoque,
          puntaje: i.valor,
          porcentaje: (i.valor / 5) * 100
        };
      })
    };
  }

  private getIndicadorInfo(idIndicador: number): IndicadorInfo {
    const indicador = this.indicadoresInfo.find(i => i.idIndicador === idIndicador);
    return indicador || {
      idIndicador,
      nombre: `Indicador ${idIndicador}`,
      enfoque: 'Emprendedor',
      idDimension: 1
    };
  }

  private getNombreIndicador(idIndicador: number): string {
    return this.getIndicadorInfo(idIndicador).nombre;
  }

  private getNombreDimension(idDimension: number): string {
    const dimension = this.dimensionesInfo.find(d => d.idDimension === idDimension);
    return dimension?.nombre || `Dimensión ${idDimension}`;
  }

  private createChart(): void {
    if (!this.chartCanvas?.nativeElement || !this.iepmData) return;

    this.destroyChart();

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    try {
      const chartConfig = this.getChartConfig();
      this.chart = new Chart(ctx, chartConfig);
    } catch (error) {
      console.error('Error creando el gráfico:', error);
      this.showToast('Error al crear el gráfico', 'danger');
    }
  }

  private getChartConfig(): ChartConfiguration {
    switch (this.tipoGrafico) {
      case 'bar':
        return this.getBarChartConfig();
      case 'pie':
      case 'doughnut':
        return this.getPieChartConfig();
      case 'radar':
        return this.getRadarChartConfig();
      default:
        return this.getBarChartConfig();
    }
  }

  private getBarChartConfig(): ChartConfiguration {
    if (!this.iepmData) {
      return {
        type: 'bar',
        data: { labels: [], datasets: [] },
        options: {}
      };
    }

    return {
      type: 'bar',
      data: {
        labels: this.iepmData.porDimension.map(d => d.dimension),
        datasets: [{
          label: 'Puntaje por Dimensión',
          data: this.iepmData.porDimension.map(d => d.puntaje),
          backgroundColor: this.coloresDimensiones,
          borderColor: this.coloresDimensiones,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Resultados IEPM por Dimensiones (44 Preguntas)',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                return `${context.label}: ${context.parsed.y.toFixed(2)} / 5.00`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: { stepSize: 1 },
            title: { display: true, text: 'Puntaje' }
          },
          x: {
            title: { display: true, text: 'Dimensiones' }
          }
        }
      }
    };
  }

  private getPieChartConfig(): ChartConfiguration {
    if (!this.iepmData) {
      return {
        type: this.tipoGrafico === 'doughnut' ? 'doughnut' : 'pie',
        data: { labels: [], datasets: [] },
        options: {}
      };
    }

    return {
      type: this.tipoGrafico === 'doughnut' ? 'doughnut' : 'pie',
      data: {
        labels: this.iepmData.porIndicador.map(i => i.indicador),
        datasets: [{
          label: 'Indicadores IEPM',
          data: this.iepmData.porIndicador.map(i => i.puntaje),
          backgroundColor: this.coloresIndicadores,
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Distribución de 8 Indicadores IEPM',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 10 },
              usePointStyle: true,
              padding: 10
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const indicador = this.iepmData?.porIndicador[context.dataIndex];
                return [
                  `${context.label}`,
                  `Enfoque: ${indicador?.enfoque}`,
                  `Puntaje: ${context.parsed.toFixed(2)} / 5.00`
                ];
              }
            }
          }
        }
      }
    };
  }

  private getRadarChartConfig(): ChartConfiguration {
    if (!this.iepmData) {
      return {
        type: 'radar',
        data: { labels: [], datasets: [] },
        options: {}
      };
    }

    return {
      type: 'radar',
      data: {
        labels: this.iepmData.porDimension.map(d => d.dimension),
        datasets: [{
          label: 'Perfil IEPM',
          data: this.iepmData.porDimension.map(d => d.puntaje),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Perfil Radar IEPM - 3 Dimensiones',
            font: { size: 16, weight: 'bold' }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 5,
            ticks: { stepSize: 1 }
          }
        }
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

    if (value && typeof value === 'string' && ['bar', 'pie', 'doughnut', 'radar'].includes(value)) {
      this.tipoGrafico = value as GraficoTipo;
      this.createChart();
    }
  }

  navigateToHome(): void {
    this.router.navigate(['/home'])
      .catch(error => this.showToast('Error en la navegación', 'danger'));
  }

  navegarAResultados(): void {
    this.router.navigate(['/informacion-resultados', this.idEmprendedor])
      .catch(error => this.showToast('Error en la navegación', 'danger'));
  }

  navigateBack(): void {
    this.router.navigate(['/iepm-resultados', this.idEmprendedor, this.idEncuesta])
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
      await this.initializeComponent();
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

  getEstadisticas() {
    if (!this.iepmData?.porDimension.length) return null;

    const puntajes = this.iepmData.porDimension.map(d => d.puntaje);
    const promedio = puntajes.reduce((sum, p) => sum + p, 0) / puntajes.length;
    const maximo = Math.max(...puntajes);
    const minimo = Math.min(...puntajes);

    return {
      promedio: Number(promedio.toFixed(3)),
      maximo: Number(maximo.toFixed(3)),
      minimo: Number(minimo.toFixed(3)),
      totalDimensiones: this.iepmData.porDimension.length,
      totalIndicadores: this.iepmData.porIndicador.length,
      iepmTotal: this.iepmData.resultadoTotal.puntaje
    };
  }

  getIndicadoresPorEnfoque(enfoque: string) {
    if (!this.iepmData?.porIndicador) return [];
    return this.iepmData.porIndicador.filter(i => i.enfoque === enfoque);
  }
}
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

interface CompetenciaInfo {
  id: number;
  nombre: string;
  descripcion: string;
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

  // 10 Competencias ICE - EXACTAMENTE 10 COMPETENCIAS
  private readonly competenciasInfo: CompetenciaInfo[] = [
    { id: 1, nombre: 'Comportamiento Emprendedor', descripcion: 'Iniciativa y actitud emprendedora' },
    { id: 2, nombre: 'Creatividad', descripcion: 'Capacidad de generar ideas innovadoras' },
    { id: 3, nombre: 'Liderazgo', descripcion: 'Habilidad para dirigir y motivar equipos' },
    { id: 4, nombre: 'Personalidad Proactiva', descripcion: 'Anticipación y acción preventiva' },
    { id: 5, nombre: 'Tolerancia a la Incertidumbre', descripcion: 'Manejo de situaciones ambiguas' },
    { id: 6, nombre: 'Trabajo en Equipo', descripcion: 'Colaboración y comunicación efectiva' },
    { id: 7, nombre: 'Pensamiento Estratégico', descripcion: 'Visión a largo plazo y planificación' },
    { id: 8, nombre: 'Proyección Social', descripcion: 'Responsabilidad social y comunitaria' },
    { id: 9, nombre: 'Orientación Financiera', descripcion: 'Gestión de recursos económicos' },
    { id: 10, nombre: 'Orientación Tecnológica e Innovación', descripcion: 'Adopción de tecnología e innovación' }
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
    console.log('Inicializando GraficaIceResultadosPage');
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
    console.log('Limpiando componente GraficaIceResultados');
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

      console.log('Datos cargados para gráficas:', {
        emprendedor: this.emprendedor?.nombre,
        competencias: this.resultados.length,
        valorTotal: this.valorIceTotal
      });

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

      // VALIDACIÓN: Asegurar que solo hay 10 competencias
      if (this.resultados.length !== 10) {
        console.warn(`⚠️ ADVERTENCIA: Se esperaban 10 competencias pero se encontraron ${this.resultados.length}`);
      }

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

    // IMPORTANTE: Filtrar para obtener solo competencias únicas del 1 al 10
    const competenciasMap = new Map<number, any>();
    
    resultados.forEach(resultado => {
      const idCompetencia = resultado.idCompetencia;
      
      // Normalizar ID: si es mayor a 10, mapear al rango 1-10
      const idNormalizado = idCompetencia > 10 
        ? ((idCompetencia - 1) % 10) + 1 
        : idCompetencia;
      
      // Solo guardar si es un ID válido (1-10) y aún no existe
      if (idNormalizado >= 1 && idNormalizado <= 10) {
        if (!competenciasMap.has(idNormalizado)) {
          competenciasMap.set(idNormalizado, {
            ...resultado,
            idCompetencia: idNormalizado
          });
        } else {
          // Si ya existe, sumar las puntuaciones (promedio)
          const existente = competenciasMap.get(idNormalizado);
          existente.puntuacionCompetencia = 
            (Number(existente.puntuacionCompetencia) + Number(resultado.puntuacionCompetencia)) / 2;
        }
      }
    });

    // Convertir el Map a array y transformar
    const resultadosUnicos = Array.from(competenciasMap.values()).map(resultado => {
      const idCompetencia = resultado.idCompetencia;
      const competenciaInfo = this.getCompetenciaInfo(idCompetencia);
      
      return {
        idCompetencia: idCompetencia,
        puntuacionCompetencia: Number(resultado.puntuacionCompetencia) || 0,
        nombre: competenciaInfo.nombre,
        color: this.colors[(idCompetencia - 1) % this.colors.length]
      };
    }).sort((a, b) => a.idCompetencia - b.idCompetencia);

    console.log(`📊 Competencias procesadas para gráficas: ${resultadosUnicos.length}/10`);
    
    return resultadosUnicos;
  }

  private getCompetenciaInfo(idCompetencia: number): CompetenciaInfo {
    // Asegurar que el ID está en el rango 1-10
    const idNormalizado = idCompetencia > 10 
      ? ((idCompetencia - 1) % 10) + 1 
      : idCompetencia;
    
    // Buscar la competencia por ID normalizado
    const competencia = this.competenciasInfo.find(c => c.id === idNormalizado);
    
    if (competencia) {
      return competencia;
    }

    // Fallback (no debería llegar aquí)
    return {
      id: idNormalizado,
      nombre: `Competencia ${idNormalizado}`,
      descripcion: 'Sin descripción'
    };
  }

  private createChart(): void {
    if (!this.pieChart?.nativeElement || !this.resultados.length) {
      console.warn('No se puede crear el gráfico: canvas o datos no disponibles');
      return;
    }

    this.destroyChart();

    const ctx = this.pieChart.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('No se pudo obtener el contexto 2D del canvas');
      return;
    }

    try {
      const chartConfig = this.getChartConfig();
      this.chart = new Chart(ctx, chartConfig);
      console.log('Gráfico creado exitosamente:', this.tipoGrafico);
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
            text: 'Competencias Emprendedoras ICE (10 Competencias)',
            font: { size: 16, weight: 'bold' as const }
          },
          legend: {
            position: 'bottom' as const,
            labels: {
              font: { size: 11 },
              usePointStyle: true,
              padding: 10,
              boxWidth: 12
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
            title: { display: true, text: 'Puntuación' },
            ticks: {
              callback: (value: number | string) => {
                return Number(value).toFixed(2);
              }
            }
          },
          x: {
            title: { display: true, text: 'Competencias' },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
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
      console.log('Cambiando tipo de gráfico a:', this.tipoGrafico);
      this.createChart();
    }
  }

  calcularIceGeneral(): number {
    return this.valorIceTotal;
  }

  navigateBack(): void {
    this.router.navigate(['/ice-resultados', this.idEmprendedor, this.idEncuesta])
      .catch(error => {
        console.error('Error en navegación:', error);
        this.showToast('Error en la navegación', 'danger');
      });
  }

  navigateToHome(): void {
    this.router.navigate(['/home'])
      .catch(error => {
        console.error('Error en navegación:', error);
        this.showToast('Error en la navegación', 'danger');
      });
  }

  navegarAResultados(): void {
    this.router.navigate(['/ice-resultados', this.idEmprendedor, this.idEncuesta])
      .catch(error => {
        console.error('Error en navegación:', error);
        this.showToast('Error en la navegación', 'danger');
      });
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
      console.error('Error al imprimir:', error);
      await this.showToast('Error al imprimir. Verifica que tu navegador soporte esta función.', 'danger');
    }
  }

  async recargarDatos(): Promise<void> {
    if (this.isValidParams()) {
      await this.loadData();
    }
  }

  private handleError(message: string): void {
    console.error('Error:', message);
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

  // Diagnóstico
  diagnosticarGraficas(): void {
    console.log('════════════════════════════════');
    console.log('DIAGNÓSTICO - GRÁFICAS ICE');
    console.log('════════════════════');
    console.log('PARÁMETROS:');
    console.log('  • ID Emprendedor:', this.idEmprendedor);
    console.log('  • ID Encuesta:', this.idEncuesta);
    console.log('───────────────────────────────────────────────');
    console.log('DATOS PARA GRÁFICAS:');
    console.log('  • Emprendedor:', this.emprendedor?.nombre || 'N/A');
    console.log('  • Competencias:', this.resultados.length, '/ 10 esperadas');
    console.log('  • ICE Total:', this.valorIceTotal.toFixed(3));
    console.log('  • Tipo Gráfico:', this.tipoGrafico);
    console.log('───────────────────────────────────────────────');
    console.log('DATOS DEL GRÁFICO:');
    this.resultados.forEach(r => {
      console.log(`  C${r.idCompetencia}. ${r.nombre}: ${r.puntuacionCompetencia.toFixed(3)}`);
    });
    console.log('───────────────────────────────────────────────');
    const stats = this.getEstadisticas();
    if (stats) {
      console.log('ESTADÍSTICAS:');
      console.log('  • Promedio:', stats.promedio);
      console.log('  • Máximo:', stats.maximo);
      console.log('  • Mínimo:', stats.minimo);
      console.log('  • Total:', stats.total);
    }
    console.log('═══════════════════════════════════════════════');
    
    if (this.resultados.length !== 10) {
      console.error(' ERROR: Se esperaban 10 competencias, se encontraron:', this.resultados.length);
    } else {
      console.log(' CORRECTO: 10 competencias para gráficas');
    }
  }
}
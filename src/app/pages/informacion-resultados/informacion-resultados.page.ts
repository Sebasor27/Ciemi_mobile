import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ResultadosService } from '../../services/resultados.service';

interface Emprendedor {
  idEmprendedor: number;
  nombre: string;
  email?: string;
}

interface Encuesta {
  idEncuesta: number;
  fechaEvaluacion: string;
  fechaAplicacion: string;
}

interface ResultadoICE {
  dimension: string;
  puntaje: number;
  nivel: string;
  descripcion: string;
  recomendaciones: string[];
}

interface ResultadoIEPM {
  factor: string;
  puntaje: number;
  nivel: string;
  descripcion: string;
  recomendaciones: string[];
}

interface DatosGrafica {
  labels: string[];
  data: number[];
  colores: string[];
}

interface Comparaciones {
  correlacion: number;
  analisis: string;
  recomendacionesIntegradas: string[];
}

@Component({
  selector: 'app-informacion-resultados',
  templateUrl: './informacion-resultados.page.html',
  styleUrls: ['./informacion-resultados.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class InformacionResultadosPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  idEmprendedor: string | null = null;
  emprendedor: Emprendedor | null = null;
  encuestas: Encuesta[] = [];
  encuestasIEPM: Encuesta[] = [];
  encuestaSeleccionada: number | null = null;
  encuestaSeleccionadaIEPM: number | null = null;

  // Propiedades para el template
  encuestaSeleccionadaObj: Encuesta | null = null;
  encuestaSeleccionadaIEPMObj: Encuesta | null = null;

  // Propiedades faltantes para la vista de impresión
  isPrinting: boolean = false;
  resultadosICE: ResultadoICE[] = [];
  resultadosIEPM: ResultadoIEPM[] = [];
  datosGraficaICE: DatosGrafica | null = null;
  datosGraficaIEPM: DatosGrafica | null = null;
  comparaciones: Comparaciones | null = null;

  isLoading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController,
    private resultadosService: ResultadosService
  ) {}

  ngOnInit(): void {
    this.idEmprendedor = this.route.snapshot.paramMap.get('id');

    if (!this.idEmprendedor) {
      this.handleError('No se encontró el ID del emprendedor');
      return;
    }

    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  retryLoading(): void {
    this.isLoading = true;
    this.error = null;
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      await Promise.all([
        this.fetchEmprendedor(),
        this.fetchEncuestas(),
        this.fetchEncuestasIEPM()
      ]);
    } catch (error) {
      this.handleError('Error al cargar datos');
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchEmprendedor(): Promise<void> {
    if (!this.idEmprendedor) return;

    try {
      this.emprendedor = await firstValueFrom(
        this.resultadosService.getEmprendedor(Number(this.idEmprendedor))
          .pipe(takeUntil(this.destroy$))
      );
    } catch (error) {
      throw new Error('Error al cargar emprendedor');
    }
  }

  private async fetchEncuestas(): Promise<void> {
    if (!this.idEmprendedor) return;

    try {
      const data = await firstValueFrom(
        this.resultadosService.getEncuestas(Number(this.idEmprendedor))
          .pipe(takeUntil(this.destroy$))
      );
      
      this.encuestas = Array.isArray(data) ? data : [];
      
      if (this.encuestas.length > 0) {
        this.encuestaSeleccionada = this.encuestas[0].idEncuesta;
        this.syncEncuestaObjects();
      }
    } catch (error) {
      this.encuestas = [];
    }
  }

  private async fetchEncuestasIEPM(): Promise<void> {
    if (!this.idEmprendedor) return;

    try {
      const data = await firstValueFrom(
        this.resultadosService.getEncuestasIEPM(Number(this.idEmprendedor))
          .pipe(takeUntil(this.destroy$))
      );
      
      this.encuestasIEPM = Array.isArray(data) ? data : [];
      
      if (this.encuestasIEPM.length > 0) {
        this.encuestaSeleccionadaIEPM = this.encuestasIEPM[0].idEncuesta;
        this.syncEncuestaObjects();
      }
    } catch (error) {
      this.encuestasIEPM = [];
    }
  }

  private syncEncuestaObjects(): void {
    this.encuestaSeleccionadaObj = this.encuestas.find(e => e.idEncuesta === this.encuestaSeleccionada) || null;
    this.encuestaSeleccionadaIEPMObj = this.encuestasIEPM.find(e => e.idEncuesta === this.encuestaSeleccionadaIEPM) || null;
  }

  onEncuestaSeleccionadaChange(event: any): void {
    const valor = event?.detail?.value;
    this.encuestaSeleccionada = valor ? Number(valor) : null;
    this.syncEncuestaObjects();
  }

  onEncuestaSeleccionadaIEPMChange(event: any): void {
    const valor = event?.detail?.value;
    this.encuestaSeleccionadaIEPM = valor ? Number(valor) : null;
    this.syncEncuestaObjects();
  }

  // MÉTODOS DE NAVEGACIÓN
  
  verResultadosICE(): void {
    if (!this.encuestaSeleccionada) {
      this.showToast('Selecciona una encuesta ICE', 'warning');
      return;
    }
    
    this.router.navigate(['/ice-resultados', this.idEmprendedor, this.encuestaSeleccionada]);
  }

  verResultadosIEPM(): void {
    if (!this.encuestaSeleccionadaIEPM) {
      this.showToast('Selecciona una encuesta IEPM', 'warning');
      return;
    }
    
    this.router.navigate(['/iepm-resultados', this.idEmprendedor, this.encuestaSeleccionadaIEPM]);
  }

  navegarAGraficaICE(): void {
    if (!this.encuestaSeleccionada) {
      this.showToast('Selecciona una encuesta ICE', 'warning');
      return;
    }
    
    this.router.navigate(['/grafica-ice-resultados', this.idEmprendedor, this.encuestaSeleccionada]);
  }

  navegarAGraficaIEPM(): void {
    if (!this.encuestaSeleccionadaIEPM) {
      this.showToast('Selecciona una encuesta IEPM', 'warning');
      return;
    }
    
    this.router.navigate(['/grafica-iepm-resultados', this.idEmprendedor, this.encuestaSeleccionadaIEPM]);
  }

  navegarAComparaciones(): void {
    if (!this.encuestaSeleccionada || !this.encuestaSeleccionadaIEPM) {
      this.showToast('Selecciona encuestas para comparar', 'warning');
      return;
    }
    
    this.router.navigate(['/comparaciones-recomendaciones', this.idEmprendedor], {
      queryParams: {
        encuestaICE: this.encuestaSeleccionada,
        encuestaIEPM: this.encuestaSeleccionadaIEPM
      }
    });
  }

  // MÉTODOS DE IMPRESIÓN Y DATOS PARA VISTA COMPLETA
  
  async printPage(): Promise<void> {
    if (!this.encuestaSeleccionada || !this.encuestaSeleccionadaIEPM) {
      this.showToast('Selecciona ambas encuestas para imprimir el reporte completo', 'warning');
      return;
    }

    try {
      this.isPrinting = true;
      
      // Cargar todos los datos necesarios para la impresión
      await Promise.all([
        this.loadResultadosICE(),
        this.loadResultadosIEPM(),
        this.loadDatosGraficaICE(),
        this.loadDatosGraficaIEPM(),
        this.loadComparaciones()
      ]);

      // Esperar un momento para que se renderice la vista
      setTimeout(() => {
        window.print();
        this.isPrinting = false;
      }, 1000);
      
    } catch (error) {
      this.isPrinting = false;
      this.showToast('Error al generar el reporte', 'danger');
    }
  }

  private async loadResultadosICE(): Promise<void> {
    if (!this.encuestaSeleccionada) return;
    
    try {
      // Mock data temporal - reemplazar con servicio real
      this.resultadosICE = [
        {
          dimension: "Innovación",
          puntaje: 85,
          nivel: "Alto",
          descripcion: "Excelente capacidad de innovación",
          recomendaciones: ["Continuar desarrollando ideas creativas", "Buscar financiamiento para proyectos"]
        },
        {
          dimension: "Creatividad", 
          puntaje: 78,
          nivel: "Medio-Alto",
          descripcion: "Buena creatividad empresarial",
          recomendaciones: ["Participar en workshops de creatividad"]
        },
        {
          dimension: "Emprendimiento",
          puntaje: 92,
          nivel: "Alto",
          descripcion: "Fuerte espíritu emprendedor",
          recomendaciones: ["Considerar mentoría empresarial"]
        }
      ];
    } catch (error) {
      this.resultadosICE = [];
    }
  }

  private async loadResultadosIEPM(): Promise<void> {
    if (!this.encuestaSeleccionadaIEPM) return;
    
    try {
      // Mock data temporal - reemplazar con servicio real
      this.resultadosIEPM = [
        {
          factor: "Motivación",
          puntaje: 88,
          nivel: "Alto",
          descripcion: "Alta motivación empresarial",
          recomendaciones: ["Mantener el enfoque en objetivos"]
        },
        {
          factor: "Perseverancia",
          puntaje: 75,
          nivel: "Medio-Alto", 
          descripcion: "Buena capacidad de persistencia",
          recomendaciones: ["Desarrollar técnicas de resiliencia"]
        }
      ];
    } catch (error) {
      this.resultadosIEPM = [];
    }
  }

  private async loadDatosGraficaICE(): Promise<void> {
    if (!this.encuestaSeleccionada) return;
    
    try {
      // Mock data temporal - reemplazar con servicio real
      this.datosGraficaICE = {
        labels: ["Innovación", "Creatividad", "Emprendimiento"],
        data: [85, 78, 92],
        colores: ["#3498db", "#e74c3c", "#2ecc71"]
      };
    } catch (error) {
      this.datosGraficaICE = null;
    }
  }

  private async loadDatosGraficaIEPM(): Promise<void> {
    if (!this.encuestaSeleccionadaIEPM) return;
    
    try {
      // Mock data temporal - reemplazar con servicio real
      this.datosGraficaIEPM = {
        labels: ["Motivación", "Perseverancia"],
        data: [88, 75],
        colores: ["#9b59b6", "#f39c12"]
      };
    } catch (error) {
      this.datosGraficaIEPM = null;
    }
  }

  private async loadComparaciones(): Promise<void> {
    if (!this.encuestaSeleccionada || !this.encuestaSeleccionadaIEPM) return;
    
    try {
      // Mock data temporal - reemplazar con servicio real
      this.comparaciones = {
        correlacion: 0.75,
        analisis: "Existe una correlación positiva fuerte entre los resultados ICE e IEPM, indicando consistencia en el perfil emprendedor.",
        recomendacionesIntegradas: [
          "Aprovechar la alta puntuación en innovación para desarrollar productos únicos",
          "Combinar creatividad con perseverancia para superar obstáculos",
          "Usar la motivación alta para mantener el impulso emprendedor"
        ]
      };
    } catch (error) {
      this.comparaciones = null;
    }
  }

  // MÉTODOS AUXILIARES PARA GRÁFICAS

  getBarPercentage(value: number, data: number[]): number {
    if (!data || data.length === 0) return 0;
    const max = Math.max(...data);
    return max > 0 ? (value / max) * 100 : 0;
  }

  getAbsoluteValue(value: number): number {
    return Math.abs(value);
  }

  // Navegación general
  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  navigateBack(): void {
    this.router.navigate(['/ventana-encuestas', this.idEmprendedor]);
  }

  // Métodos de utilidad
  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    try {
      const date = new Date(fecha);
      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('es-ES');
    } catch {
      return 'N/A';
    }
  }

  getFechaEvaluacion(encuesta: Encuesta | null): string {
    return encuesta?.fechaEvaluacion ? this.formatearFecha(encuesta.fechaEvaluacion) : 'N/A';
  }

  getFechaAplicacion(encuesta: Encuesta | null): string {
    return encuesta?.fechaAplicacion ? this.formatearFecha(encuesta.fechaAplicacion) : 'N/A';
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES');
  }

  async verificarConectividadAPI(): Promise<void> {
    try {
      this.isLoading = true;
      
      const isHealthy = await firstValueFrom(
        this.resultadosService.checkApiHealth()
          .pipe(takeUntil(this.destroy$))
      );
      
      await this.showToast(
        isHealthy ? 'Conexión con API exitosa' : 'Problemas de conexión con API',
        isHealthy ? 'success' : 'warning'
      );
    } catch (error) {
      await this.showToast('Error de conectividad', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  diagnosticarEstado(): void {
    console.log('DIAGNÓSTICO - INFORMACIÓN RESULTADOS:');
    console.log('ID Emprendedor:', this.idEmprendedor);
    console.log('Emprendedor:', !!this.emprendedor);
    console.log('Encuestas ICE:', this.encuestas?.length || 0);
    console.log('Encuestas IEPM:', this.encuestasIEPM?.length || 0);
    console.log('ICE seleccionada:', this.encuestaSeleccionada);
    console.log('IEPM seleccionada:', this.encuestaSeleccionadaIEPM);
  }

  private async handleError(message: string): Promise<void> {
    this.error = message;
    this.isLoading = false;
    await this.showToast(message, 'danger');
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success'): Promise<void> {
    try {
      const toast = await this.toastController.create({
        message,
        duration: 3000,
        color,
        position: 'top'
      });
      await toast.present();
    } catch (error) {
      console.error('Error al mostrar toast:', error);
    }
  }
}
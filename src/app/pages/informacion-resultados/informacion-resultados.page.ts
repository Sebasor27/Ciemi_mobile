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
  idOriginal?: number;
  idMostrar?: number;
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

  encuestaSeleccionadaObj: Encuesta | null = null;
  encuestaSeleccionadaIEPMObj: Encuesta | null = null;

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
      
      this.encuestas.sort((a, b) => {
        const fechaA = new Date(a.fechaAplicacion || a.fechaEvaluacion).getTime();
        const fechaB = new Date(b.fechaAplicacion || b.fechaEvaluacion).getTime();
        return fechaB - fechaA;
      });
      
      this.encuestas = this.encuestas.map((encuesta, index): Encuesta => ({
        ...encuesta,
        idOriginal: encuesta.idEncuesta,
        idMostrar: index + 1
      }));
      
      if (this.encuestas.length > 0) {
        this.encuestaSeleccionada = this.encuestas[0].idOriginal!;
        this.syncEncuestaObjects();
      }

      console.log('Encuestas ICE cargadas:', this.encuestas.length);
    } catch (error) {
      console.error('Error al cargar encuestas ICE:', error);
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
      
      this.encuestasIEPM.sort((a, b) => {
        const fechaA = new Date(a.fechaAplicacion || a.fechaEvaluacion).getTime();
        const fechaB = new Date(b.fechaAplicacion || b.fechaEvaluacion).getTime();
        return fechaB - fechaA;
      });
      
      this.encuestasIEPM = this.encuestasIEPM.map((encuesta, index): Encuesta => ({
        ...encuesta,
        idOriginal: encuesta.idEncuesta,
        idMostrar: index + 1
      }));
      
      if (this.encuestasIEPM.length > 0) {
        this.encuestaSeleccionadaIEPM = this.encuestasIEPM[0].idOriginal!;
        this.syncEncuestaObjects();
      }

      console.log('Encuestas IEPM cargadas:', this.encuestasIEPM.length);
    } catch (error) {
      console.error('Error al cargar encuestas IEPM:', error);
      this.encuestasIEPM = [];
    }
  }

  private syncEncuestaObjects(): void {
    this.encuestaSeleccionadaObj = this.encuestas.find(e => e.idOriginal === this.encuestaSeleccionada) || null;
    this.encuestaSeleccionadaIEPMObj = this.encuestasIEPM.find(e => e.idOriginal === this.encuestaSeleccionadaIEPM) || null;
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

  async printPage(): Promise<void> {
    if (!this.encuestaSeleccionada || !this.encuestaSeleccionadaIEPM) {
      this.showToast('Selecciona ambas encuestas para imprimir el reporte completo', 'warning');
      return;
    }

    try {
      this.isPrinting = true;
      
      await Promise.all([
        this.loadResultadosICE(),
        this.loadResultadosIEPM(),
        this.loadDatosGraficaICE(),
        this.loadDatosGraficaIEPM(),
        this.loadComparaciones()
      ]);

      setTimeout(() => {
        window.print();
        this.isPrinting = false;
      }, 1000);
      
    } catch (error) {
      this.isPrinting = false;
      this.showToast('Error al generar el reporte', 'danger');
      console.error('Error en printPage:', error);
    }
  }

  private async loadResultadosICE(): Promise<void> {
    if (!this.encuestaSeleccionada || !this.idEmprendedor) return;
    
    try {
      const data = await firstValueFrom(
        this.resultadosService.getResultadosResumen(
          Number(this.idEmprendedor), 
          this.encuestaSeleccionada
        ).pipe(takeUntil(this.destroy$))
      );
      
      this.resultadosICE = data.resultados.map((resultado: any) => ({
        dimension: resultado.dimension || resultado.nombre || 'Sin nombre',
        puntaje: resultado.puntaje || resultado.valor || 0,
        nivel: this.getNivelICE(resultado.puntaje || resultado.valor || 0),
        descripcion: resultado.descripcion || 'Sin descripción',
        recomendaciones: Array.isArray(resultado.recomendaciones) 
          ? resultado.recomendaciones 
          : (resultado.recomendaciones ? [resultado.recomendaciones] : [])
      }));
      
      console.log('Resultados ICE cargados:', this.resultadosICE);
    } catch (error) {
      console.error('Error cargando resultados ICE:', error);
      this.resultadosICE = [];
    }
  }

  private async loadResultadosIEPM(): Promise<void> {
    if (!this.encuestaSeleccionadaIEPM || !this.idEmprendedor) return;
    
    try {
      const data = await firstValueFrom(
        this.resultadosService.getResultadosIEPM(
          Number(this.idEmprendedor),
          this.encuestaSeleccionadaIEPM
        ).pipe(takeUntil(this.destroy$))
      );
      
      this.resultadosIEPM = data.dimensiones.map((dim: any) => ({
        factor: this.getNombreDimension(dim.idDimension),
        puntaje: dim.valor || 0,
        nivel: this.getNivelIEPM(dim.valor || 0),
        descripcion: data.accionMejora?.descripcion || 'Sin descripción',
        recomendaciones: this.getRecomendacionesPorDimension(dim.idDimension, data.accionMejora?.recomendaciones)
      }));
      
      console.log('Resultados IEPM cargados:', this.resultadosIEPM);
    } catch (error) {
      console.error('Error cargando resultados IEPM:', error);
      this.resultadosIEPM = [];
    }
  }

  private async loadDatosGraficaICE(): Promise<void> {
    if (!this.encuestaSeleccionada || !this.idEmprendedor) return;
    
    try {
      const data = await firstValueFrom(
        this.resultadosService.getResultadosResumen(
          Number(this.idEmprendedor),
          this.encuestaSeleccionada
        ).pipe(takeUntil(this.destroy$))
      );
      
      this.datosGraficaICE = {
        labels: data.resultados.map((r: any) => r.dimension || r.nombre || 'Sin nombre'),
        data: data.resultados.map((r: any) => r.puntaje || r.valor || 0),
        colores: this.generarColores(data.resultados.length)
      };
      
      console.log('Datos gráfica ICE:', this.datosGraficaICE);
    } catch (error) {
      console.error('Error cargando gráfica ICE:', error);
      this.datosGraficaICE = null;
    }
  }

  private async loadDatosGraficaIEPM(): Promise<void> {
    if (!this.encuestaSeleccionadaIEPM || !this.idEmprendedor) return;
    
    try {
      const data = await firstValueFrom(
        this.resultadosService.getResultadosIEPM(
          Number(this.idEmprendedor),
          this.encuestaSeleccionadaIEPM
        ).pipe(takeUntil(this.destroy$))
      );
      
      this.datosGraficaIEPM = {
        labels: data.dimensiones.map((d: any) => this.getNombreDimension(d.idDimension)),
        data: data.dimensiones.map((d: any) => d.valor || 0),
        colores: this.generarColores(data.dimensiones.length)
      };
      
      console.log('Datos gráfica IEPM:', this.datosGraficaIEPM);
    } catch (error) {
      console.error('Error cargando gráfica IEPM:', error);
      this.datosGraficaIEPM = null;
    }
  }

  private async loadComparaciones(): Promise<void> {
    if (!this.encuestaSeleccionada || !this.encuestaSeleccionadaIEPM || !this.idEmprendedor) return;
    
    try {
      const [dataICE, dataIEPM] = await Promise.all([
        firstValueFrom(
          this.resultadosService.getResultadosResumen(
            Number(this.idEmprendedor),
            this.encuestaSeleccionada
          ).pipe(takeUntil(this.destroy$))
        ),
        firstValueFrom(
          this.resultadosService.getResultadosIEPM(
            Number(this.idEmprendedor),
            this.encuestaSeleccionadaIEPM
          ).pipe(takeUntil(this.destroy$))
        )
      ]);
      
      const promedioICE = dataICE.resumen?.valorIceTotal || 0;
      const promedioIEPM = dataIEPM.iepm?.iepm || 0;
      
      this.comparaciones = {
        correlacion: this.calcularCorrelacion(promedioICE, promedioIEPM),
        analisis: this.generarAnalisisComparativo(promedioICE, promedioIEPM),
        recomendacionesIntegradas: this.generarRecomendacionesIntegradas(dataICE, dataIEPM)
      };
      
      console.log('Comparaciones:', this.comparaciones);
    } catch (error) {
      console.error('Error cargando comparaciones:', error);
      this.comparaciones = null;
    }
  }

  private getNivelICE(puntaje: number): string {
    if (puntaje >= 80) return 'Alto';
    if (puntaje >= 60) return 'Medio-Alto';
    if (puntaje >= 40) return 'Medio';
    return 'Bajo';
  }

  private getNivelIEPM(puntaje: number): string {
    if (puntaje >= 80) return 'Alto';
    if (puntaje >= 60) return 'Medio-Alto';
    if (puntaje >= 40) return 'Medio';
    return 'Bajo';
  }

  private getNombreDimension(idDimension: number): string {
    const nombres: { [key: number]: string } = {
      1: 'Calidad y Eficiencia Laboral',
      2: 'Infraestructura Laboral',
      3: 'Tecnología e Innovación'
    };
    return nombres[idDimension] || `Dimensión ${idDimension}`;
  }

  private getRecomendacionesPorDimension(idDimension: number, recomendacionesGenerales?: string): string[] {
    if (recomendacionesGenerales) {
      return recomendacionesGenerales
        .split('.')
        .map(r => r.trim())
        .filter(r => r.length > 0);
    }
    return ['Continuar desarrollando esta dimensión'];
  }

  private calcularCorrelacion(ice: number, iepm: number): number {
    const max = Math.max(ice, iepm);
    const min = Math.min(ice, iepm);
    return max > 0 ? min / max : 0;
  }

  private generarAnalisisComparativo(ice: number, iepm: number): string {
    const diferencia = Math.abs(ice - iepm);
    
    if (diferencia < 10) {
      return 'Existe una alta consistencia entre los resultados ICE e IEPM, indicando un perfil emprendedor equilibrado.';
    } else if (diferencia < 20) {
      return 'Se observa una correlación moderada entre ICE e IEPM, con algunas áreas de oportunidad.';
    } else {
      return 'Los resultados muestran diferencias significativas entre ICE e IEPM, sugiriendo áreas específicas de desarrollo.';
    }
  }

  private generarRecomendacionesIntegradas(dataICE: any, dataIEPM: any): string[] {
    const recomendaciones: string[] = [];
    
    const valorICE = dataICE.resumen?.valorIceTotal || 0;
    const valorIEPM = dataIEPM.iepm?.iepm || 0;
    
    if (valorICE > 70) {
      recomendaciones.push('Aprovechar la alta capacidad de innovación para desarrollar productos únicos');
    } else if (valorICE < 50) {
      recomendaciones.push('Enfocarse en fortalecer las dimensiones de creatividad e innovación');
    }
    
    if (valorIEPM > 70) {
      recomendaciones.push('Utilizar el fuerte perfil emprendedor para liderar nuevos proyectos');
    } else if (valorIEPM < 50) {
      recomendaciones.push('Trabajar en el desarrollo de habilidades emprendedoras fundamentales');
    }
    
    if (dataIEPM.accionMejora?.recomendaciones) {
      const recsIEPM = dataIEPM.accionMejora.recomendaciones
        .split('.')
        .map((r: string) => r.trim())
        .filter((r: string) => r.length > 0);
      recomendaciones.push(...recsIEPM);
    }
    
    return recomendaciones.length > 0 ? recomendaciones : ['Continuar desarrollando habilidades emprendedoras'];
  }

  private generarColores(cantidad: number): string[] {
    const coloresBase = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#16a085'];
    return Array(cantidad).fill(0).map((_, i) => coloresBase[i % coloresBase.length]);
  }

  getBarPercentage(value: number, data: number[]): number {
    if (!data || data.length === 0) return 0;
    const max = Math.max(...data);
    return max > 0 ? (value / max) * 100 : 0;
  }

  getAbsoluteValue(value: number): number {
    return Math.abs(value);
  }

  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  navigateBack(): void {
    this.router.navigate(['/ventana-encuestas', this.idEmprendedor]);
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    
    try {
      const date = new Date(fecha);
      
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', fecha);
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'UTC'
      });
    } catch (error) {
      console.error('Error formateando fecha:', fecha, error);
      return 'Error en fecha';
    }
  }

  getFechaEvaluacion(encuesta: Encuesta | null): string {
    if (!encuesta) return 'N/A';
    const fecha = encuesta.fechaEvaluacion || encuesta.fechaAplicacion;
    if (!fecha) return 'N/A';
    return this.formatearFecha(fecha);
  }

  getFechaAplicacion(encuesta: Encuesta | null): string {
    if (!encuesta) return 'N/A';
    const fecha = encuesta.fechaAplicacion;
    if (!fecha) return 'N/A';
    return this.formatearFecha(fecha);
  }

  getDescripcionEncuesta(encuesta: Encuesta | null): string {
    if (!encuesta) return 'No seleccionada';
    
    const fechaAplicacion = this.getFechaAplicacion(encuesta);
    const fechaEvaluacion = this.getFechaEvaluacion(encuesta);
    
    if (fechaAplicacion === fechaEvaluacion) {
      return `Encuesta del ${fechaAplicacion}`;
    } else {
      return `Aplicada: ${fechaAplicacion} | Evaluada: ${fechaEvaluacion}`;
    }
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
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
    console.log('═══════════════════════════════════════════════');
    console.log('DIAGNÓSTICO - INFORMACIÓN RESULTADOS');
    console.log('═══════════════════════════════════════════════');
    console.log('PARÁMETROS:');
    console.log('  • ID Emprendedor:', this.idEmprendedor);
    console.log('───────────────────────────────────────────────');
    console.log('EMPRENDEDOR:');
    console.log('  • Cargado:', !!this.emprendedor);
    console.log('  • Nombre:', this.emprendedor?.nombre || 'N/A');
    console.log('───────────────────────────────────────────────');
    console.log('ENCUESTAS ICE:');
    console.log('  • Total:', this.encuestas.length);
    console.log('  • Seleccionada (ID Original):', this.encuestaSeleccionada);
    if (this.encuestaSeleccionadaObj) {
      console.log('  • Detalles encuesta seleccionada:');
      console.log('    - ID Original:', this.encuestaSeleccionadaObj.idOriginal);
      console.log('    - ID Mostrar:', this.encuestaSeleccionadaObj.idMostrar);
      console.log('    - Fecha Aplicación:', this.encuestaSeleccionadaObj.fechaAplicacion);
    }
    console.log('───────────────────────────────────────────────');
    console.log('ENCUESTAS IEPM:');
    console.log('  • Total:', this.encuestasIEPM.length);
    console.log('  • Seleccionada (ID Original):', this.encuestaSeleccionadaIEPM);
    if (this.encuestaSeleccionadaIEPMObj) {
      console.log('  • Detalles encuesta seleccionada:');
      console.log('    - ID Original:', this.encuestaSeleccionadaIEPMObj.idOriginal);
      console.log('    - ID Mostrar:', this.encuestaSeleccionadaIEPMObj.idMostrar);
      console.log('    - Fecha Aplicación:', this.encuestaSeleccionadaIEPMObj.fechaAplicacion);
    }
    console.log('───────────────────────────────────────────────');
    console.log('RESULTADOS CARGADOS:');
    console.log('  • ICE:', this.resultadosICE.length);
    console.log('  • IEPM:', this.resultadosIEPM.length);
    console.log('═══════════════════════════════════════════════');
  }

  private async handleError(message: string): Promise<void> {
    console.error('Error:', message);
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
import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';
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

interface IepmTransformado {
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
  accionRecomendada: {
    descripcion: string;
    recomendaciones: string;
    rango: string;
  };
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

@Component({
  selector: 'app-iepm-resultados',
  templateUrl: './iepm-resultados.page.html',
  styleUrls: ['./iepm-resultados.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class IepmResultadosPage implements OnInit, OnDestroy {
  
  private destroy$ = new Subject<void>();

  // Propiedades principales
  idEmprendedor: string | null = null;
  idEncuesta: string | null = null;
  emprendedor: Emprendedor | null = null;
  iepmData: IepmTransformado | null = null;

  // Estados de carga
  isLoading = true;
  error: string | null = null;

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController,
    private alertController: AlertController,
    private resultadosService: ResultadosService
  ) {}

  ngOnInit(): void {
    console.log('Inicializando IepmResultadosPage');
    
    this.idEmprendedor = this.route.snapshot.paramMap.get('id');
    this.idEncuesta = this.route.snapshot.paramMap.get('idEncuesta');

    if (!this.idEmprendedor || !this.idEncuesta) {
      this.handleError('Parámetros faltantes: ID emprendedor o encuesta');
      return;
    }

    this.initializeComponent();
  }

  ngOnDestroy(): void {
    console.log('Limpiando componente IepmResultados');
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  // INICIALIZACIÓN
  private async initializeComponent(): Promise<void> {
    try {
      await Promise.all([
        this.fetchEmprendedor(),
        this.fetchIEPMData()
      ]);

    } catch (error) {
      console.error('Error en inicialización:', error);
      this.handleError('Error al inicializar el componente');
    } finally {
      this.isLoading = false;
    }
  }

  // CARGA DE DATOS DEL EMPRENDEDOR
  private async fetchEmprendedor(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.resultadosService.getEmprendedor(Number(this.idEmprendedor))
          .pipe(takeUntil(this.destroy$))
      );
      
      this.emprendedor = data;
      console.log('Emprendedor cargado:', this.emprendedor?.nombre);
    } catch (error) {
      console.error('Error al cargar emprendedor:', error);
      this.handleError('Error al cargar información del emprendedor');
    }
  }

  // CARGA DE DATOS IEPM
  private async fetchIEPMData(): Promise<void> {
    if (!this.idEncuesta) {
      console.warn('No hay encuesta IEPM seleccionada');
      return;
    }

    try {
      console.log('Cargando datos IEPM para encuesta:', this.idEncuesta);

      const data = await firstValueFrom(
        this.resultadosService.getResultadosIEPM(Number(this.idEmprendedor), Number(this.idEncuesta))
          .pipe(takeUntil(this.destroy$))
      );

      this.iepmData = this.transformIEPMData(data);

      console.log('Datos IEPM cargados:', {
        puntaje: this.iepmData.resultadoTotal.puntaje,
        dimensiones: this.iepmData.porDimension.length,
        indicadores: this.iepmData.porIndicador.length
      });

    } catch (error) {
      console.error('Error al cargar datos IEPM:', error);
      this.handleError('Error al cargar datos IEPM');
    }
  }

  // TRANSFORMACIÓN DE DATOS IEPM
  private transformIEPMData(data: any): IepmTransformado {
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
      }),
      accionRecomendada: {
        descripcion: data.accionMejora?.descripcion || 'N/A',
        recomendaciones: data.accionMejora?.recomendaciones || 'N/A',
        rango: `${data.accionMejora?.rangoMin || 0}-${data.accionMejora?.rangoMax || 0}`
      }
    };
  }

  // MÉTODOS DE OBTENCIÓN DE INFORMACIÓN
  getIndicadorInfo(idIndicador: number): IndicadorInfo {
    const indicador = this.indicadoresInfo.find(i => i.idIndicador === idIndicador);
    return indicador || {
      idIndicador,
      nombre: `Indicador ${idIndicador}`,
      enfoque: 'Emprendedor',
      idDimension: 1
    };
  }

  getNombreIndicador(idIndicador: number): string {
    return this.getIndicadorInfo(idIndicador).nombre;
  }

  getNombreDimension(idDimension: number): string {
    const dimension = this.dimensionesInfo.find(d => d.idDimension === idDimension);
    return dimension?.nombre || `Dimensión ${idDimension}`;
  }

  getEnfoqueName(enfoque: string): string {
    const enfoques: { [key: string]: string } = {
      'Cliente': 'Cliente',
      'Emprendedor': 'Emprendedor',
      'Trabajador': 'Trabajador'
    };
    return enfoques[enfoque] || enfoque;
  }

  // MÉTODOS DE CÁLCULO Y ANÁLISIS - CORREGIDO
  getNivelPuntaje(puntaje: number): { nivel: string; color: string } {
    // Convertir a escala 0-1 si viene en escala 0-5
    const puntajeNormalizado = puntaje > 1 ? puntaje / 5 : puntaje;
    
    // Rangos según tabla de acciones recomendadas (escala 0-1)
    if (puntajeNormalizado >= 0 && puntajeNormalizado < 0.300) {
      return { nivel: 'Muy Bajo', color: '#FF3333' };
    } else if (puntajeNormalizado >= 0.300 && puntajeNormalizado < 0.600) {
      return { nivel: 'Bajo', color: '#FF6E6E' };
    } else if (puntajeNormalizado >= 0.600 && puntajeNormalizado < 0.800) {
      return { nivel: 'Medio', color: '#FFE066' };
    } else if (puntajeNormalizado >= 0.800 && puntajeNormalizado <= 1.000) {
      return { nivel: 'Alto', color: '#7CFFCB' };
    }

    return { nivel: 'N/A', color: '#999999' };
  }

  getColorDimension(idDimension: number): string {
    const colores = ['#FF6E6E', '#6A8CFF', '#7CFFCB'];
    return colores[idDimension - 1] || '#999999';
  }

  getColorEnfoque(enfoque: string): string {
    const colores: { [key: string]: string } = {
      'Cliente': '#FF6E6E',
      'Emprendedor': '#6A8CFF',
      'Trabajador': '#7CFFCB'
    };
    return colores[enfoque] || '#999999';
  }

  getIndicadoresPorDimension(idDimension: number): any[] {
    if (!this.iepmData?.porIndicador) return [];
    
    return this.iepmData.porIndicador.filter(ind => ind.idDimension === idDimension);
  }

  // MÉTODOS DE NAVEGACIÓN
  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  navigateBack(): void {
    this.router.navigate(['/informacion-resultados', this.idEmprendedor]);
  }

  navegarAGrafica(): void {
    this.router.navigate(['/grafica-iepm-resultados', this.idEmprendedor, this.idEncuesta]);
  }

  // FUNCIONALIDADES DE IMPRESIÓN
  async imprimir(): Promise<void> {
    try {
      window.print();
    } catch (error) {
      console.error('Error al imprimir:', error);
      await this.showToast('Error al imprimir', 'danger');
    }
  }

  // FORMATEO DE FECHAS
  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // MANEJO DE ERRORES Y NOTIFICACIONES
  private async handleError(message: string): Promise<void> {
    console.error(message);
    this.error = message;
    this.isLoading = false;
    await this.showToast(message, 'danger');
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [{
        text: 'Cerrar',
        role: 'cancel'
      }]
    });
    await toast.present();
  }

  private async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  // DIAGNÓSTICO DEL COMPONENTE
  diagnosticarEstado(): void {
    console.log('═══════════════════════════════════════════════');
    console.log('DIAGNÓSTICO - IEPM RESULTADOS');
    console.log('═══════════════════════════════════════════════');
    console.log('PARÁMETROS:');
    console.log('  • ID Emprendedor:', this.idEmprendedor);
    console.log('  • ID Encuesta:', this.idEncuesta);
    console.log('───────────────────────────────────────────────');
    console.log('DATOS CARGADOS:');
    console.log('  • Emprendedor:', !!this.emprendedor, this.emprendedor?.nombre || 'N/A');
    console.log('  • Datos IEPM:', !!this.iepmData);
    console.log('───────────────────────────────────────────────');
    if (this.iepmData) {
      console.log('RESULTADOS IEPM:');
      console.log('  • Puntaje Total:', this.iepmData.resultadoTotal.puntaje);
      console.log('  • Valoración:', this.iepmData.resultadoTotal.valoracion);
      const nivelTotal = this.getNivelPuntaje(this.iepmData.resultadoTotal.puntaje);
      console.log('  • Nivel Calculado:', nivelTotal.nivel, `(${nivelTotal.color})`);
      console.log('  • Dimensiones:', this.iepmData.porDimension.length);
      console.log('  • Indicadores:', this.iepmData.porIndicador.length);
      console.log('───────────────────────────────────────────────');
      console.log('DIMENSIONES:');
      this.iepmData.porDimension.forEach(d => {
        const nivel = this.getNivelPuntaje(d.puntaje);
        console.log(`  ${d.idDimension}. ${d.dimension}: ${d.puntaje.toFixed(2)}/5.0 - ${nivel.nivel}`);
      });
      console.log('───────────────────────────────────────────────');
      console.log('INDICADORES POR DIMENSIÓN:');
      this.iepmData.porDimension.forEach(d => {
        const indicadores = this.getIndicadoresPorDimension(d.idDimension);
        console.log(`  ${d.dimension}:`);
        indicadores.forEach(i => {
          const nivel = this.getNivelPuntaje(i.puntaje);
          console.log(`    • ${i.indicador} (${i.enfoque}): ${i.puntaje.toFixed(2)}/5.0 - ${nivel.nivel}`);
        });
      });
    }
    console.log('───────────────────────────────────────────────');
    console.log('ESTADOS:');
    console.log('  • Loading:', this.isLoading);
    console.log('  • Error:', this.error || 'Ninguno');
    console.log('═══════════════════════════════════════════════');
  }

  forzarRedibujado(): void {
    this.cdr.detectChanges();
  }
}
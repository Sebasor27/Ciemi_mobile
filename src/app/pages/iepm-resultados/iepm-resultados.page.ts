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
  destinatario?: string;
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

  // Información de referencia
  private readonly indicadoresInfo: IndicadorInfo[] = [
    { idIndicador: 1, nombre: 'Capacidad de Planificación Financiera', destinatario: 'Emprendedor' },
    { idIndicador: 2, nombre: 'Gestión de Recursos Económicos', destinatario: 'Emprendedor' },
    { idIndicador: 3, nombre: 'Análisis de Viabilidad Económica', destinatario: 'Emprendedor' },
    { idIndicador: 4, nombre: 'Eficiencia Operacional', destinatario: 'Emprendedor' },
    { idIndicador: 5, nombre: 'Gestión de Procesos', destinatario: 'Emprendedor' },
    { idIndicador: 6, nombre: 'Control de Calidad', destinatario: 'Emprendedor' },
    { idIndicador: 7, nombre: 'Innovación Tecnológica', destinatario: 'Emprendedor' },
    { idIndicador: 8, nombre: 'Desarrollo de Productos', destinatario: 'Emprendedor' },
    { idIndicador: 9, nombre: 'Adaptación al Cambio', destinatario: 'Emprendedor' }
  ];

  private readonly dimensionesInfo: DimensionInfo[] = [
    { idDimension: 1, nombre: 'Dimensión Económica' },
    { idDimension: 2, nombre: 'Dimensión Operacional' },
    { idDimension: 3, nombre: 'Dimensión de Innovación' }
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
      porIndicador: (data.indicadores || []).map((i: any) => ({
        idIndicador: i.idIndicador,
        indicador: this.getNombreIndicador(i.idIndicador),
        idDimension: Math.ceil(i.idIndicador / 3),
        dimension: this.getNombreDimension(Math.ceil(i.idIndicador / 3)),
        puntaje: i.valor,
        porcentaje: (i.valor / 5) * 100
      })),
      accionRecomendada: {
        descripcion: data.accionMejora?.descripcion || 'N/A',
        recomendaciones: data.accionMejora?.recomendaciones || 'N/A',
        rango: `${data.accionMejora?.rangoMin || 0}-${data.accionMejora?.rangoMax || 0}`
      }
    };
  }

  // MÉTODOS DE OBTENCIÓN DE NOMBRES
  getNombreIndicador(idIndicador: number): string {
    const indicador = this.indicadoresInfo.find(i => i.idIndicador === idIndicador);
    return indicador?.nombre || `Indicador ${idIndicador}`;
  }

  getNombreDimension(idDimension: number): string {
    const dimension = this.dimensionesInfo.find(d => d.idDimension === idDimension);
    return dimension?.nombre || `Dimensión ${idDimension}`;
  }

  // MÉTODOS DE CÁLCULO Y ANÁLISIS
  getNivelPuntaje(puntaje: number): { nivel: string; color: string } {
    if (puntaje >= 0 && puntaje < 2) {
      return { nivel: 'Bajo', color: '#FF6E6E' };
    } else if (puntaje >= 2 && puntaje < 4) {
      return { nivel: 'Medio', color: '#FFE066' };
    } else if (puntaje >= 4 && puntaje <= 5) {
      return { nivel: 'Alto', color: '#7CFFCB' };
    }

    return { nivel: 'N/A', color: '#999999' };
  }

  getColorDimension(idDimension: number): string {
    const colores = ['#FF6E6E', '#6A8CFF', '#7CFFCB'];
    return colores[idDimension - 1] || '#999999';
  }

  getIndicadoresPorDimension(idDimension: number): any[] {
    if (!this.iepmData?.porIndicador) return [];
    
    return this.iepmData.porIndicador.filter(ind => {
      const dimensionCalculada = Math.ceil(ind.idIndicador / 3);
      return dimensionCalculada === idDimension;
    });
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
    return new Date().toLocaleDateString();
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString();
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
    console.log('DIAGNÓSTICO - IEPM RESULTADOS:');
    console.log('ID Emprendedor:', this.idEmprendedor);
    console.log('ID Encuesta:', this.idEncuesta);
    console.log('Emprendedor cargado:', !!this.emprendedor);
    console.log('Datos IEPM cargados:', !!this.iepmData);
    console.log('Puntaje IEPM:', this.iepmData?.resultadoTotal?.puntaje);
    console.log('Dimensiones:', this.iepmData?.porDimension?.length || 0);
    console.log('Indicadores:', this.iepmData?.porIndicador?.length || 0);
    console.log('Loading:', this.isLoading);
    console.log('Error:', this.error);
  }

  forzarRedibujado(): void {
    this.cdr.detectChanges();
  }
}
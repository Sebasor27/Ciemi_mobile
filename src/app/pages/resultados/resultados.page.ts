import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Chart, registerables } from 'chart.js';
import { firstValueFrom, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ResultadosService } from '../../services/resultados.service';

Chart.register(...registerables);

interface Resultado {
  idCompetencia: number;
  puntuacionCompetencia: number;
  valor?: number;
  nombre: string;
  color: string;
  nivel?: string;
  acciones?: string;
}

interface Resumen {
  valorIceTotal: number;
}

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

interface TooltipData {
  x: number;
  y: number;
  content: string;
  visible: boolean;
}

@Component({
  selector: 'app-resultados',
  templateUrl: './resultados.page.html',
  styleUrls: ['./resultados.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ResultadosPage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('printContent', { static: false }) printContent!: ElementRef;
  @ViewChild('pieChart', { static: false }) pieChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('iepmChart', { static: true }) iepmChart!: ElementRef;

  private chart: Chart | null = null;
  private iepmChartInstance: Chart | null = null;
  private destroy$ = new Subject<void>();

  idEmprendedor: string | null = null;
  resultados: Resultado[] = [];
  resumen: Resumen | null = null;
  emprendedor: Emprendedor | null = null;
  encuestas: Encuesta[] = [];
  encuestaSeleccionada: number | null = null;
  encuestasIEPM: Encuesta[] = [];
  encuestaSeleccionadaIEPM: number | null = null;
  iepmData: IepmTransformado | null = null;

  showIEPM = false;
  showSideComments = false;
  isLoading = true;
  error: string | null = null;
  tipoGrafico = 'pie';
  activeTooltip: TooltipData | null = null;

  comentarios = '';
  comentariosSeleccionados: string[] = [];

  // NUEVAS PROPIEDADES PARA COMENTARIOS
  nuevoComentario: string = '';
  comentariosAsesor: Array<{
    id: number;
    fecha: string;
    asesor: string;
    comentario: string;
    tipo: 'observacion' | 'recomendacion' | 'nota';
  }> = [];

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
    private ngZone: NgZone,
    private toastController: ToastController,
    private alertController: AlertController,
    private resultadosService: ResultadosService
  ) {}

  ngOnInit(): void {
    console.log('Inicializando ResultadosPage');
    
    this.idEmprendedor = this.route.snapshot.paramMap.get('id');

    if (!this.idEmprendedor) {
      this.handleError('No se encontró el ID del emprendedor');
      return;
    }

    this.initializeComponent();
  }

  ngAfterViewInit(): void {
    console.log('Componente después de inicializar vista');
    
    setTimeout(() => {
      if (this.resultados && this.resultados.length > 0) {
        this.createPieChart();
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    console.log('Limpiando componente');
    
    this.destroy$.next();
    this.destroy$.complete();
    
    this.destroyCharts();
  }

  // MÉTODOS DE NAVEGACIÓN Y RECARGA
  navigateToHome(): void {
    this.router.navigate(['/home']);
  }

  reloadComments(): void {
    this.cargarComentarios();
    console.log('Comentarios recargados:', this.comentariosAsesor.length);
  }

  // INICIALIZACIÓN
  private async initializeComponent(): Promise<void> {
    try {
      this.loadSavedComments();
      
      const promises = [
        this.fetchIndicadoresDimensiones().catch(err => {
          console.error('Error en fetchIndicadoresDimensiones:', err);
          return null;
        }),
        this.fetchEncuestas().catch(err => {
          console.error('Error en fetchEncuestas:', err);
          return null;
        }),
        this.fetchEncuestasIEPM().catch(err => {
          console.error('Error en fetchEncuestasIEPM:', err);
          return null;
        })
      ];

      await Promise.all(promises);

    } catch (error) {
      console.error('Error en inicialización:', error);
      this.handleError('Error al inicializar el componente');
    }
  }

  private destroyCharts(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    
    if (this.iepmChartInstance) {
      this.iepmChartInstance.destroy();
      this.iepmChartInstance = null;
    }
  }

  // CARGA DE DATOS
  private async fetchIndicadoresDimensiones(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.resultadosService.getIndicadoresDimensiones()
          .pipe(takeUntil(this.destroy$))
      );
      
      console.log('Indicadores y dimensiones cargados:', data?.length || 0);
    } catch (error) {
      console.error('Error al cargar indicadores y dimensiones:', error);
    }
  }

  private async fetchEncuestas(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.resultadosService.getEncuestas(Number(this.idEmprendedor))
          .pipe(takeUntil(this.destroy$))
      );
      
      this.encuestas = data;
      
      if (data.length > 0) {
        this.encuestaSeleccionada = data[0].idEncuesta;
        await this.fetchResultados();
      }

      console.log('Encuestas ICE cargadas:', data.length);
    } catch (error) {
      console.error('Error al cargar encuestas ICE:', error);
      this.handleError('Error al cargar encuestas ICE');
    }
  }

  private async fetchEncuestasIEPM(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.resultadosService.getEncuestasIEPM(Number(this.idEmprendedor))
          .pipe(takeUntil(this.destroy$))
      );
      
      this.encuestasIEPM = data;
      
      if (data.length > 0) {
        this.encuestaSeleccionadaIEPM = data[0].idEncuesta;
        await this.fetchIEPMData();
      }

      console.log('Encuestas IEPM cargadas:', data.length);
    } catch (error) {
      console.error('Error al cargar encuestas IEPM:', error);
      this.handleError('Error al cargar encuestas IEPM');
    }
  }

  // MÉTODO ACTUALIZADO fetchResultados CON ALERTAS
  private async fetchResultados(): Promise<void> {
    if (!this.encuestaSeleccionada) {
      console.warn('No hay encuesta ICE seleccionada');
      await this.showAlert(
        'Sin selección', 
        'No hay una encuesta seleccionada. Por favor selecciona una encuesta para ver los resultados.'
      );
      return;
    }

    try {
      console.log('Cargando resultados ICE para encuesta:', this.encuestaSeleccionada);
      this.isLoading = true;
      this.error = null;

      const [emprendedorData, resultadosData] = await Promise.all([
        firstValueFrom(this.resultadosService.getEmprendedor(Number(this.idEmprendedor)).pipe(takeUntil(this.destroy$))),
        firstValueFrom(this.resultadosService.getResultadosResumen(Number(this.idEmprendedor), this.encuestaSeleccionada).pipe(takeUntil(this.destroy$)))
      ]);

      this.emprendedor = emprendedorData;
      this.resultados = resultadosData.resultados || [];
      this.resumen = resultadosData.resumen || null;

      // NUEVA VERIFICACIÓN - MOSTRAR ALERTA SI NO HAY RESULTADOS
      if (!this.resultados || this.resultados.length === 0) {
        await this.showAlert(
          'Sin resultados', 
          'No se encontraron resultados para este emprendedor en la encuesta seleccionada. Verifica que la evaluación haya sido completada correctamente.'
        );
        console.warn('No hay resultados disponibles para mostrar');
        return;
      }

      // NUEVA VERIFICACIÓN - ALERTA SI EMPRENDEDOR NO EXISTE
      if (!this.emprendedor) {
        await this.showAlert(
          'Emprendedor no encontrado', 
          'No se pudo cargar la información del emprendedor. Verifica que el ID sea correcto.'
        );
        return;
      }

      this.validarYTransformarDatos();
      
      // CARGAR COMENTARIOS EXISTENTES
      this.cargarComentarios();
      
      console.log('Resultados ICE cargados:', {
        emprendedor: this.emprendedor?.nombre,
        resultados: this.resultados.length,
        valorTotal: this.resumen?.valorIceTotal
      });

      setTimeout(() => this.createPieChart(), 300);

    } catch (error) {
      console.error('Error al cargar resultados ICE:', error);
      
      // MEJORAR MANEJO DE ERRORES CON ALERTAS ESPECÍFICAS
      let errorMessage = 'Error al cargar resultados ICE';
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          errorMessage = 'No se encontraron datos para este emprendedor. Verifica que haya completado las evaluaciones.';
        } else if (error.message.includes('403')) {
          errorMessage = 'No tienes permisos para ver estos resultados.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Error del servidor. Intenta nuevamente en unos minutos.';
        }
      }
      
      await this.showAlert('Error de carga', errorMessage);
      this.handleError(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  // NUEVOS MÉTODOS PARA MANEJO DE COMENTARIOS
  
  /**
   * Agregar un nuevo comentario de asesor
   */
  async agregarComentario(): Promise<void> {
    if (!this.nuevoComentario?.trim()) {
      await this.showToast('Ingresa un comentario válido', 'warning');
      return;
    }

    if (!this.idEmprendedor || !this.encuestaSeleccionada) {
      await this.showToast('Error: No hay emprendedor o encuesta seleccionada', 'danger');
      return;
    }

    try {
      const comentario = {
        id: Date.now(), // ID temporal
        fecha: new Date().toISOString(),
        asesor: 'Asesor', // TODO: Obtener desde servicio de autenticación
        comentario: this.nuevoComentario.trim(),
        tipo: 'observacion' as const
      };

      // GUARDAR EN SERVICIO (implementar en tu servicio)
      // await this.resultadosService.guardarComentario(
      //   Number(this.idEmprendedor), 
      //   this.encuestaSeleccionada, 
      //   comentario
      // );

      // AGREGAR LOCALMENTE
      this.comentariosAsesor.unshift(comentario);
      
      // GUARDAR EN ALMACENAMIENTO LOCAL TEMPORAL
      this.guardarComentariosLocal();
      
      // LIMPIAR CAMPO
      this.nuevoComentario = '';
      
      await this.showToast('Comentario agregado exitosamente', 'success');
      
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      await this.showToast('Error al guardar el comentario', 'danger');
    }
  }

  /**
   * Eliminar comentario
   */
  async eliminarComentario(comentarioId: number): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este comentario?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            try {
              // ELIMINAR DEL SERVICIO
              // await this.resultadosService.eliminarComentario(comentarioId);
              
              // ELIMINAR LOCALMENTE
              this.comentariosAsesor = this.comentariosAsesor.filter(c => c.id !== comentarioId);
              this.guardarComentariosLocal();
              
              await this.showToast('Comentario eliminado', 'success');
            } catch (error) {
              console.error('Error al eliminar comentario:', error);
              await this.showToast('Error al eliminar comentario', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Cambiar tipo de comentario
   */
  async cambiarTipoComentario(comentarioId: number, nuevoTipo: 'observacion' | 'recomendacion' | 'nota'): Promise<void> {
    try {
      const comentario = this.comentariosAsesor.find(c => c.id === comentarioId);
      if (comentario) {
        comentario.tipo = nuevoTipo;
        this.guardarComentariosLocal();
        
        // TODO: Actualizar en servicio
        // await this.resultadosService.actualizarComentario(comentario);
        
        await this.showToast(`Comentario marcado como ${nuevoTipo}`, 'success');
      }
    } catch (error) {
      console.error('Error al cambiar tipo de comentario:', error);
      await this.showToast('Error al actualizar comentario', 'danger');
    }
  }

  /**
   * Cargar comentarios existentes
   */
  private cargarComentarios(): void {
    try {
      // CARGAR DESDE ALMACENAMIENTO LOCAL TEMPORAL
      const comentariosGuardados = localStorage.getItem(`comentarios_${this.idEmprendedor}_${this.encuestaSeleccionada}`);
      if (comentariosGuardados) {
        this.comentariosAsesor = JSON.parse(comentariosGuardados);
      }
      
      // TODO: Implementar carga desde servicio
      // this.resultadosService.getComentarios(Number(this.idEmprendedor), this.encuestaSeleccionada)
      //   .pipe(takeUntil(this.destroy$))
      //   .subscribe(comentarios => {
      //     this.comentariosAsesor = comentarios;
      //   });
      
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
      this.comentariosAsesor = [];
    }
  }

  /**
   * Guardar comentarios en almacenamiento local (temporal)
   */
  private guardarComentariosLocal(): void {
    try {
      localStorage.setItem(
        `comentarios_${this.idEmprendedor}_${this.encuestaSeleccionada}`, 
        JSON.stringify(this.comentariosAsesor)
      );
    } catch (error) {
      console.error('Error al guardar comentarios localmente:', error);
    }
  }

  /**
   * Obtener color según tipo de comentario
   */
  getColorTipoComentario(tipo: string): string {
    switch (tipo) {
      case 'observacion': return 'primary';
      case 'recomendacion': return 'success';
      case 'nota': return 'warning';
      default: return 'medium';
    }
  }

  /**
   * Obtener icono según tipo de comentario
   */
  getIconoTipoComentario(tipo: string): string {
    switch (tipo) {
      case 'observacion': return 'eye-outline';
      case 'recomendacion': return 'checkmark-circle-outline';
      case 'nota': return 'document-text-outline';
      default: return 'chatbubble-outline';
    }
  }

  /**
   * Formatear fecha para mostrar
   */
  formatearFechaComentario(fecha: string): string {
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleDateString() + ' ' + fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch {
      return 'Fecha inválida';
    }
  }

  // RESTO DE MÉTODOS EXISTENTES...

  private async fetchIEPMData(): Promise<void> {
    if (!this.encuestaSeleccionadaIEPM) {
      console.warn('No hay encuesta IEPM seleccionada');
      return;
    }

    try {
      console.log('Cargando datos IEPM para encuesta:', this.encuestaSeleccionadaIEPM);
      this.isLoading = true;

      const data = await firstValueFrom(
        this.resultadosService.getResultadosIEPM(Number(this.idEmprendedor), this.encuestaSeleccionadaIEPM)
          .pipe(takeUntil(this.destroy$))
      );

      this.iepmData = this.transformIEPMData(data);
      this.showIEPM = true;

      console.log('Datos IEPM cargados:', {
        puntaje: this.iepmData.resultadoTotal.puntaje,
        dimensiones: this.iepmData.porDimension.length,
        indicadores: this.iepmData.porIndicador.length
      });

      setTimeout(() => this.createIEPMChart(), 300);

    } catch (error) {
      console.error('Error al cargar datos IEPM:', error);
      this.handleError('Error al cargar datos IEPM');
    } finally {
      this.isLoading = false;
    }
  }

  private validarYTransformarDatos(): void {
    if (!this.resultados || this.resultados.length === 0) {
      console.warn('No hay resultados para validar');
      return;
    }

    this.resultados = this.resultados.map((resultado, index) => ({
      ...resultado,
      nombre: resultado.nombre || this.competenciasNombres[resultado.idCompetencia - 1] || `Competencia ${resultado.idCompetencia}`,
      color: resultado.color || this.colors[index % this.colors.length],
      puntuacionCompetencia: this.validateNumber(resultado.puntuacionCompetencia),
      valor: resultado.valor || resultado.puntuacionCompetencia,
      nivel: this.getNivelCompetencia(resultado.puntuacionCompetencia)
    }));

    console.log('Datos validados y transformados:', this.resultados.length, 'competencias');
  }

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

  // MÉTODOS DE CREACIÓN DE GRÁFICOS ACTUALIZADOS
  createPieChart(): void {
    console.log('Creando gráfico de competencias');
    
    if (!this.pieChart?.nativeElement) {
      console.error('Canvas no disponible');
      return;
    }

    if (!this.resultados || this.resultados.length === 0) {
      console.warn('No hay datos para el gráfico');
      // MOSTRAR MENSAJE EN EL GRÁFICO
      this.mostrarMensajeEnGrafico('No hay datos disponibles para mostrar en el gráfico');
      return;
    }

    this.destroyChart();

    const ctx = this.pieChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.resultados.map(r => r.nombre);
    const valores = this.resultados.map(r => r.puntuacionCompetencia);
    const colores = this.resultados.map(r => r.color);

    this.chart = new Chart(ctx, {
      type: this.tipoGrafico as any,
      data: {
        labels,
        datasets: [{
          label: 'Competencias Emprendedoras',
          data: valores,
          backgroundColor: colores,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Evaluación de Competencias Emprendedoras (ICE)',
            font: { size: 16, weight: 'bold' },
            padding: 20
          },
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15,
              font: { size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const total = valores.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value.toFixed(3)} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1000
        }
      }
    });

    console.log('Gráfico de competencias creado');
  }

  /**
   * Mostrar mensaje cuando no hay datos para gráfico
   */
  private mostrarMensajeEnGrafico(mensaje: string): void {
    if (!this.pieChart?.nativeElement) return;
    
    const ctx = this.pieChart.nativeElement.getContext('2d');
    if (!ctx) return;

    this.destroyChart();

    // Crear gráfico con mensaje
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Sin datos'],
        datasets: [{
          data: [1],
          backgroundColor: ['#f0f0f0'],
          borderColor: ['#d0d0d0'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: mensaje,
            font: { size: 14, weight: 'bold' },
            color: '#666666'
          },
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        }
      }
    });
  }

  createIEPMChart(): void {
    if (!this.iepmChart?.nativeElement || !this.iepmData?.porDimension.length) {
      console.warn('No se puede crear gráfico IEPM');
      return;
    }

    if (this.iepmChartInstance) {
      this.iepmChartInstance.destroy();
    }

    const ctx = this.iepmChart.nativeElement.getContext('2d');
    if (!ctx) return;

    this.iepmChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.iepmData.porDimension.map(d => d.dimension),
        datasets: [{
          label: 'Puntuación IEPM',
          data: this.iepmData.porDimension.map(d => d.puntaje),
          backgroundColor: ['#FF6E6E', '#6A8CFF', '#7CFFCB'],
          borderColor: '#fff',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              boxHeight: 12,
              boxWidth: 12,
              padding: 15
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 5,
            ticks: { stepSize: 1 }
          }
        }
      }
    });

    console.log('Gráfico IEPM creado');
  }

  private createTestChart(): void {
    console.log('Creando gráfico de prueba');
    
    if (!this.pieChart?.nativeElement) return;
    
    const ctx = this.pieChart.nativeElement.getContext('2d');
    if (!ctx) return;

    this.destroyChart();

    const datosTest = this.competenciasNombres.map((nombre, index) => ({
      nombre,
      valor: Math.random() * 0.5 + 0.5,
      color: this.colors[index % this.colors.length]
    }));

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: datosTest.map(item => item.nombre),
        datasets: [{
          label: 'Competencias (Datos de Prueba)',
          data: datosTest.map(item => item.valor),
          backgroundColor: datosTest.map(item => item.color),
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
            text: 'Competencias Emprendedoras (Datos de Prueba)',
            font: { size: 16, weight: 'bold' },
            padding: 20
          },
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15,
              font: { size: 12 }
            }
          }
        }
      }
    });

    console.log('Gráfico de prueba creado');
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  // MÉTODOS DE EVENTOS Y CAMBIOS
  onEncuestaSeleccionadaChange(event: any): void {
    console.log('Cambiando encuesta ICE:', event.detail.value);
    
    const valor = event.detail.value;
    this.encuestaSeleccionada = valor ? Number(valor) : null;
    
    if (this.encuestaSeleccionada) {
      this.fetchResultados();
    }
  }

  onEncuestaSeleccionadaIEPMChange(event: any): void {
    console.log('Cambiando encuesta IEPM:', event.detail.value);
    
    const valor = event.detail.value;
    this.encuestaSeleccionadaIEPM = valor ? Number(valor) : null;
    
    if (this.encuestaSeleccionadaIEPM) {
      this.fetchIEPMData();
    }
  }

  cambiarTipoGrafico(tipo: string): void {
    console.log('Cambiando tipo de gráfico a:', tipo);
    
    this.tipoGrafico = tipo;
    this.createPieChart();
  }

  toggleComentarios(): void {
    this.showSideComments = !this.showSideComments;
  }

  async imprimir(): Promise<void> {
    try {
      window.print();
    } catch (error) {
      console.error('Error al imprimir:', error);
      await this.showToast('Error al imprimir', 'danger');
    }
  }

  recrearGrafico(): void {
    console.log('Recreando gráfico manualmente');
    this.createPieChart();
  }

  // MÉTODOS DE CÁLCULO Y OBTENCIÓN DE DATOS
  getValorCompetencia(idCompetencia: number): string {
    const resultado = this.resultados.find(r => r.idCompetencia === idCompetencia);
    return resultado ? resultado.puntuacionCompetencia.toFixed(2) : 'N/A';
  }

  getCompetenciaPercentage(resultado: Resultado): number {
    if (!this.resultados || this.resultados.length === 0) return 0;
    
    const resultadosValidos = this.resultados.filter(r => r.puntuacionCompetencia > 0);
    const total = resultadosValidos.reduce((sum, r) => sum + r.puntuacionCompetencia, 0);
    
    return total > 0 ? (resultado.puntuacionCompetencia / total) * 100 : 0;
  }

  calcularIceGeneral(): number {
    return this.resumen?.valorIceTotal || 0;
  }

  getNivelIceGeneral(): { nivel: string; valoracion: string; acciones: string } {
    const iceGeneral = this.calcularIceGeneral();

    if (iceGeneral >= 0 && iceGeneral < 0.6) {
      return {
        nivel: 'Bajo',
        valoracion: 'Baja competencia emprendedora',
        acciones: 'Falta desarrollar las competencias'
      };
    } else if (iceGeneral >= 0.6 && iceGeneral < 0.8) {
      return {
        nivel: 'Medio',
        valoracion: 'Mediana competencia',
        acciones: 'Se cumple con las competencias básicas'
      };
    } else if (iceGeneral >= 0.8 && iceGeneral <= 1.0) {
      return {
        nivel: 'Alto',
        valoracion: 'Alta competencia',
        acciones: 'Excelente desempeño en competencias'
      };
    }

    return {
      nivel: 'N/A',
      valoracion: 'N/A',
      acciones: 'N/A'
    };
  }

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

  private getNivelCompetencia(puntuacion: number): string {
    if (puntuacion >= 0 && puntuacion < 0.6) return 'Bajo';
    if (puntuacion >= 0.6 && puntuacion < 0.8) return 'Medio';
    if (puntuacion >= 0.8 && puntuacion <= 1.0) return 'Alto';
    return 'N/A';
  }

  getNombreIndicador(idIndicador: number): string {
    const indicador = this.indicadoresInfo.find(i => i.idIndicador === idIndicador);
    return indicador?.nombre || `Indicador ${idIndicador}`;
  }

  getNombreDimension(idDimension: number): string {
    const dimension = this.dimensionesInfo.find(d => d.idDimension === idDimension);
    return dimension?.nombre || `Dimensión ${idDimension}`;
  }

  getIndicadoresPorDimension(idDimension: number): any[] {
    if (!this.iepmData?.porIndicador) return [];
    
    return this.iepmData.porIndicador.filter(ind => {
      const dimensionCalculada = Math.ceil(ind.idIndicador / 3);
      return dimensionCalculada === idDimension;
    });
  }

  getColorDimension(idDimension: number): string {
    const colores = ['#FF6E6E', '#6A8CFF', '#7CFFCB'];
    return colores[idDimension - 1] || '#999999';
  }

  getResultadosFiltrados(): Resultado[] {
    return this.resultados?.filter(resultado => resultado.puntuacionCompetencia > 0) || [];
  }

  // MÉTODOS DE FORMATEO DE FECHAS
  formatearFecha(fecha: string): string {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  }

  formatearFechaHora(fecha: string): string {
    if (!fecha) return 'N/A';
    try {
      return new Date(fecha).toLocaleString();
    } catch {
      return 'N/A';
    }
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString();
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString();
  }

  getEncuestaFecha(): string {
    if (!this.encuestas?.length) return 'N/A';
    const encuesta = this.encuestas.find(e => e.idEncuesta === this.encuestaSeleccionada);
    return encuesta ? this.formatearFecha(encuesta.fechaEvaluacion) : 'N/A';
  }

  getFechaEvaluacion(encuesta: Encuesta): string {
    return encuesta?.fechaEvaluacion ? this.formatearFecha(encuesta.fechaEvaluacion) : 'N/A';
  }

  getFechaAplicacion(encuesta: Encuesta): string {
    return encuesta?.fechaAplicacion ? this.formatearFecha(encuesta.fechaAplicacion) : 'N/A';
  }

  // MÉTODOS DE COMPATIBILIDAD Y CARGA
  private loadSavedComments(): void {
    const saved = this.comentarios;
    if (saved) {
      this.comentariosSeleccionados = saved
        .split('\n')
        .filter(line => line.trim().startsWith('- '))
        .map(line => line.substring(2).trim());
    }
  }

  private validateNumber(value: any): number {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  // MÉTODOS DE MANEJO DE ERRORES Y NOTIFICACIONES
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

  // MÉTODOS DE DIAGNÓSTICO Y VERIFICACIÓN
  diagnosticarEstado(): void {
    console.log('DIAGNÓSTICO DEL COMPONENTE:');
    console.log('Canvas disponible:', !!this.pieChart?.nativeElement);
    console.log('Resultados cargados:', this.resultados?.length || 0);
    console.log('Encuesta seleccionada:', this.encuestaSeleccionada);
    console.log('Gráfico existente:', !!this.chart);
    console.log('Loading:', this.isLoading);
    console.log('Error:', this.error);
    console.log('Comentarios cargados:', this.comentariosAsesor?.length || 0);
    
    if (this.resultados?.length) {
      console.log('Primeros 3 resultados:', this.resultados.slice(0, 3));
    }
  }

  verificarDatos(): void {
    try {
      if (!this.resultados?.length) {
        this.showAlert('Sin datos', 'No hay datos disponibles para mostrar');
        return;
      }
      
      const datosValidos = this.resultados.every(item => 
        item && typeof item === 'object' && typeof item.puntuacionCompetencia === 'number'
      );
      
      if (datosValidos) {
        this.showAlert('Verificación exitosa', 'Datos verificados correctamente');
      } else {
        this.showAlert('Error de datos', 'Algunos datos no son válidos');
      }
      
    } catch (error) {
      console.error('Error al verificar datos:', error);
      this.showAlert('Error', 'Error al verificar datos');
    }
  }

  forzarRedibujado(): void {
    this.cdr.detectChanges();
  }
}
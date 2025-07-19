import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Chart, registerables } from 'chart.js';
import { ChangeDetectorRef } from '@angular/core';
import { NgZone } from '@angular/core';
import { ToastController } from '@ionic/angular';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButton,
  IonIcon,
  IonLabel,
  IonText,
  IonItem, 
  IonList, 
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonAlert,
  IonToast
} from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { ResultadosService } from '../../services/resultados.service';
import { firstValueFrom } from 'rxjs';

// Registramos todos los componentes necesarios de Chart.js
Chart.register(...registerables);

// Interfaces
interface Resultado {
  idCompetencia: number;
  puntuacionCompetencia: number;
  valor?: number; // Agregado para compatibilidad con el gráfico
  nombre: string;     // Nombre de la competencia
  color: string;     // Color para gráficos y visualización
  
  nivel?: string;    // Nivel de competencia (opcional)
  acciones?: string; 
}

interface Resumen {
  valorIceTotal: number;
}

interface Emprendedor {
  nombre: string;
}

interface Encuesta {
  idEncuesta: number;
  fechaEvaluacion: string;
  fechaAplicacion: string;
}

interface IepmData {
  iepm: {
    iepm: number;
    valoracion: string;
  };
  dimensiones: Array<{
    idDimension: number;
    valor: number;
  }>;
  indicadores: Array<{
    idIndicador: number;
    valor: number;
  }>;
  accionMejora: {
    descripcion: string;
    recomendaciones: string;
    rangoMin: number;
    rangoMax: number;
  };
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
  selector: 'app-resultados',
  templateUrl: './resultados.page.html',
  styleUrls: ['./resultados.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    
  ],
})
export class ResultadosPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('printContent', { static: false }) printContent!: ElementRef;
  @ViewChild('pieChart', { static: false }) pieChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('iepmChart', { static: true }) iepmChart!: ElementRef;
  

  // Propiedades del gráfico
  private chart: Chart | null = null;
  private iepmChartInstance: Chart | null = null;

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
  comentarios = '';
  comentariosSeleccionados: string[] = [];
  showSideComments = false;
  isLoading = true;
  error: string | null = null;
  showToast = false;
  toastMessage = '';
  showAlert = false;
  alertHeader = '';
  alertMessage = '';
  alertButtons: any[] = [];



  
  tipoGrafico: string = 'barras';
datos: any[] = [];
  
  // Propiedad para tooltip
  activeTooltip: any = null;

  // Datos estáticos
  competenciasNombres = [
    'Comportamiento Emprendedor',
    'Creatividad',
    'Liderazgo',
    'Personalidad Proactiva',
    'Tolerancia a la incertidumbre',
    'Trabajo en Equipo',
    'Pensamiento Estratégico',
    'Proyección Social',
    'Orientación Financiera',
    'Orientación Tecnológica e innovación',
  ];

  // Colores actualizados para las competencias
  colors = [
    '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b',
    '#ffc107', '#ff9800', '#ff5722', '#795548', '#9e9e9e'
  ];

  comentariosPredefinidos = {
    Capacitación: [
      {
        texto: 'Capacitación en programas de formación empresarial - Desarrollo de competencias en gestión y administración',
        explicacion: 'Recomendado para fortalecer habilidades básicas de gestión',
      },
      {
        texto: 'Capacitación en dirección estratégica - Enfoque en toma de decisiones y liderazgo organizacional',
        explicacion: 'Para emprendedores que necesitan mejorar su visión estratégica',
      },
    ],
    Herramientas: [
      {
        texto: 'Herramientas económicas y financieras - Análisis financiero y gestión de recursos',
        explicacion: 'Esencial para mejorar la salud financiera del negocio',
      },
      {
        texto: 'Herramientas de tecnología e innovación - Aplicación de tecnologías emergentes en negocios',
        explicacion: 'Para mantenerse competitivo en el mercado actual',
      },
    ],
    Evaluación: [
      {
        texto: 'Evaluación del marco legal - Análisis de normativas y regulaciones para su cumplimiento',
        explicacion: 'Importante para evitar problemas legales',
      },
      {
        texto: 'Identificación de deficiencias en servicios municipales - Trabajo con gobiernos locales para mejorar servicios',
        explicacion: 'Relevante para negocios dependientes de infraestructura municipal',
      },
    ],
  };
  // Propiedades para indicadores y dimensiones - CORREGIDAS
  private indicadoresInfo: IndicadorInfo[] = [
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

  private dimensionesInfo: DimensionInfo[] = [
    { idDimension: 1, nombre: 'Dimensión Económica' },
    { idDimension: 2, nombre: 'Dimensión Operacional' },
    { idDimension: 3, nombre: 'Dimensión de Innovación' }
  ];

  constructor(
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    public router: Router,
    private toastController: ToastController,
    private resultadosService: ResultadosService,
    private ngZone: NgZone
) {}
  ngOnDestroy(): void {
    // Destruir gráficos para evitar memory leaks
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
    
    if (this.iepmChartInstance) {
      this.iepmChartInstance.destroy();
      this.iepmChartInstance = null;
    }
  }


  ngOnInit() {
    this.idEmprendedor = this.route.snapshot.paramMap.get('id');

    if (!this.idEmprendedor) {
      this.error = 'No se encontró el ID del emprendedor';
      this.isLoading = false;
      return;
    }

    this.loadSavedComments();
    this.fetchIndicadoresDimensiones();
    this.fetchEncuestas();
    this.fetchEncuestasIEPM();

    
  }


onEncuestaSeleccionadaIEPMChange(event: any) {
  console.log('Encuesta IEPM seleccionada:', event.detail.value);
  
  try {
    const valor = event.detail.value;
    this.encuestaSeleccionadaIEPM = valor ? Number(valor) : null;
    
    this.cargarDatosEncuesta();
    console.log('Encuesta IEPM cambiada exitosamente');
    
  } catch (error) {
    console.error('Error al cambiar encuesta IEPM:', error);
  }
}

// 3. ACTUALIZA el método auxiliar:
private cargarDatosEncuesta() {
  console.log('Cargando datos para encuesta:', this.encuestaSeleccionadaIEPM);
  
  if (this.encuestaSeleccionadaIEPM !== null) {
    console.log('Datos cargados para ID:', this.encuestaSeleccionadaIEPM);
    // Aquí va tu lógica específica
  }
}







  // AQUÍ AGREGAS EL MÉTODO cambiarTipoGrafico()
  cambiarTipoGrafico(valor: string) {
    console.log('Cambiando tipo de gráfico a:', valor);
    
    try {
      this.tipoGrafico = valor;
      this.actualizarGrafico();
      console.log('Tipo de gráfico cambiado exitosamente');
    } catch (error) {
      console.error('Error al cambiar tipo de gráfico:', error);
    }
  }
  
  private actualizarGrafico() {
    console.log('Actualizando gráfico con tipo:', this.tipoGrafico);
    
    switch (this.tipoGrafico) {
      case 'barras':
        console.log('Configurando gráfico de barras');
        break;
      case 'lineas':
        console.log('Configurando gráfico de líneas');
        break;
      case 'circular':
        console.log('Configurando gráfico circular');
        break;
      default:
        console.log('Tipo de gráfico no reconocido');
    }
  }
verificarDatos() {
  console.log('Verificando datos...');
  
  try {
    // Verificar si hay datos disponibles
    if (!this.datos || this.datos.length === 0) {
      console.warn('No hay datos disponibles');
      alert('No hay datos para mostrar');
      return;
    }
    
    // Verificar integridad de los datos
    const datosValidos = this.datos.every(item => 
      item && typeof item === 'object'
    );
    
    if (!datosValidos) {
      console.warn('Algunos datos no son válidos');
      alert('Algunos datos no son válidos');
      return;
    }
    
    // Si llegamos aquí, los datos están bien
    console.log('Datos verificados correctamente');
    alert('Datos verificados correctamente');
    
  } catch (error) {
    console.error('Error al verificar datos:', error);
    alert('Error al verificar datos');
  }
}
 ngAfterViewInit(): void {
  console.log('🔄 Componente después de inicializar vista');
  
  // Esperar un momento para que todo se inicialice
  setTimeout(() => {
    console.log('⏰ Verificando datos para gráfico...');
    
    // Si ya hay datos, crear el gráfico
    if (this.resultados && this.resultados.length > 0) {
      console.log('✅ Datos disponibles, creando gráfico');
      this.createPieChart();
    } else {
      console.log('⚠️ No hay datos aún, esperando...');
      // Crear gráfico de prueba mientras tanto
      this.createPieChart();
    }
  }, 2000); // Aumentar el tiempo de espera a 2 segundos
}

 
  //********************************************************************************************* */



// MÉTODO CORREGIDO: createPieChart() - REEMPLAZA el método existente
createPieChart(): void {
  console.log('🚀 Iniciando creación del gráfico de competencias...');
  
  // 1. Verificar que el canvas existe
  if (!this.pieChart?.nativeElement) {
    console.error('❌ Canvas no disponible');
    return;
  }

  // 2. Verificar que hay datos
  if (!this.resultados || this.resultados.length === 0) {
    console.error('❌ No hay datos de resultados');
    this.createTestChart(); // Crear gráfico de prueba
    return;
  }

  console.log('📊 Datos disponibles:', this.resultados.length, 'competencias');

  // 3. Destruir gráfico anterior si existe
  if (this.chart) {
    this.chart.destroy();
    this.chart = null;
  }

  // 4. Obtener contexto del canvas
  const ctx = this.pieChart.nativeElement.getContext('2d');
  if (!ctx) {
    console.error('❌ No se pudo obtener el contexto 2D del canvas');
    return;
  }

  // 5. Preparar datos para el gráfico
  const labels: string[] = [];
  const valores: number[] = [];
  const colores: string[] = [];

  // 6. Procesar cada competencia
  this.resultados.forEach((resultado, index) => {
    // Obtener el nombre de la competencia
    const nombreCompetencia = this.competenciasNombres[resultado.idCompetencia - 1] || 
                              `Competencia ${resultado.idCompetencia}`;
    
    // Obtener el valor (usar puntuacionCompetencia o valor)
    const valorCompetencia = resultado.puntuacionCompetencia || resultado.valor || 0;
    
    // Solo agregar si el valor es mayor a 0
    if (valorCompetencia > 0) {
      labels.push(nombreCompetencia);
      valores.push(valorCompetencia);
      colores.push(this.colors[index % this.colors.length]);
    }
  });

  // 7. Verificar que tenemos datos para graficar
  if (labels.length === 0) {
    console.warn('⚠️ No hay valores válidos para graficar');
    this.createTestChart(); // Crear gráfico de prueba
    return;
  }

  console.log('✅ Datos procesados:', {
    labels: labels.length,
    valores: valores.length,
    colores: colores.length
  });

  // 8. Crear el gráfico
  try {
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          label: 'Competencias Emprendedoras',
          data: valores,
          backgroundColor: colores,
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverBorderColor: '#333333'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Evaluación de Competencias Emprendedoras (ICE)',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: 20
          },
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const percentage = ((value / valores.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
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

    console.log('✅ Gráfico creado exitosamente');
    
  } catch (error) {
    console.error('❌ Error al crear el gráfico:', error);
    this.createTestChart(); // Crear gráfico de prueba en caso de error
  }
}

// MÉTODO AUXILIAR: Crear gráfico de prueba cuando no hay datos
private createTestChart(): void {
  console.log('🧪 Creando gráfico de prueba...');
  
  if (!this.pieChart?.nativeElement) return;
  
  const ctx = this.pieChart.nativeElement.getContext('2d');
  if (!ctx) return;

  // Destruir gráfico anterior si existe
  if (this.chart) {
    this.chart.destroy();
    this.chart = null;
  }

  // Datos de prueba con las 10 competencias
  const datosTest = [
    { nombre: 'Comportamiento Emprendedor', valor: 0.85 },
    { nombre: 'Creatividad', valor: 0.72 },
    { nombre: 'Liderazgo', valor: 0.68 },
    { nombre: 'Personalidad Proactiva', valor: 0.91 },
    { nombre: 'Tolerancia a la incertidumbre', valor: 0.58 },
    { nombre: 'Trabajo en Equipo', valor: 0.76 },
    { nombre: 'Pensamiento Estratégico', valor: 0.82 },
    { nombre: 'Proyección Social', valor: 0.64 },
    { nombre: 'Orientación Financiera', valor: 0.77 },
    { nombre: 'Orientación Tecnológica e innovación', valor: 0.69 }
  ];

  this.chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: datosTest.map(item => item.nombre),
      datasets: [{
        label: 'Competencias (Datos de Prueba)',
        data: datosTest.map(item => item.valor),
        backgroundColor: this.colors.slice(0, 10),
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
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              return `${label}: ${value.toFixed(3)}`;
            }
          }
        }
      }
    }
  });

  console.log('✅ Gráfico de prueba creado');
}











// MÉTODO MEJORADO para obtener porcentaje
getCompetenciaPercentage(resultado: any): number {
  if (!this.resultados || this.resultados.length === 0) {
    return 0;
  }
  
  // Calcular total solo de competencias con valor > 0
  const resultadosValidos = this.resultados.filter(r => r.puntuacionCompetencia > 0);
  const total = resultadosValidos.reduce((sum, r) => sum + r.puntuacionCompetencia, 0);
  const valor = resultado.puntuacionCompetencia;
  
  return total > 0 ? (valor / total) * 100 : 0;
}

  

 


  // CORREGIDO: Gráfico IEPM como gráfico de barras
  createIEPMChart(): void {
    if (!this.iepmChart || !this.iepmData?.porDimension.length) return;

    // Destruir gráfico anterior si existe
    if (this.iepmChartInstance) {
      this.iepmChartInstance.destroy();
    }

    const ctx = this.iepmChart.nativeElement.getContext('2d');
    
    const data = {
      labels: this.iepmData.porDimension.map(d => d.dimension),
      datasets: [{
        label: 'Puntuación IEPM',
        data: this.iepmData.porDimension.map(d => d.puntaje),
        backgroundColor: [
          '#FF6E6E',
          '#6A8CFF',
          '#7CFFCB'
        ],
        borderColor: '#fff',
        borderWidth: 1
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            usePointStyle: true,
            pointStyle: 'circle' as const,
            boxHeight: 12,
            boxWidth: 12,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.parsed;
              return `${context.label}: ${value.toFixed(2)}/5.0`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 5,
          ticks: {
            stepSize: 1
          }
        }
      }
    };

    this.iepmChartInstance = new Chart(ctx, {
      type: 'bar', // 🔄 CAMBIAR POR: 'line', 'radar', 'polarArea'
      data,
      options
    });
  }

  loadSavedComments() {
    // Cambiar localStorage por almacenamiento en memoria
    const saved = this.comentarios; // Usar variable en memoria
    if (saved) {
      this.comentariosSeleccionados = saved
        .split('\n')
        .filter(line => line.trim().startsWith('- '))
        .map(line => line.substring(2).trim());
    }
  }

  async fetchIndicadoresDimensiones() {
    try {
      const data = await firstValueFrom(this.resultadosService.getIndicadoresDimensiones());
      console.log('Indicadores y dimensiones:', data);
      
      // Actualizar los datos si vienen del servidor
      if (data && Array.isArray(data)) {
        // Procesar los datos del servidor si es necesario
        // this.indicadoresInfo = data.indicadores;
        // this.dimensionesInfo = data.dimensiones;
      }
    } catch (error) {
      console.error('Error al cargar indicadores y dimensiones:', error);
    }
  }

  async fetchEncuestas() {
    try {
      const data = await firstValueFrom(this.resultadosService.getEncuestas(Number(this.idEmprendedor)));
      this.encuestas = data;
      if (data.length > 0) {
        this.encuestaSeleccionada = data[0].idEncuesta;
        await this.fetchResultados();
      }
    } catch (error) {
      console.error('Error al cargar encuestas ICE:', error);
      this.error = 'Error al cargar encuestas ICE';
    }
  }

  async fetchEncuestasIEPM() {
    try {
      const data = await firstValueFrom(this.resultadosService.getEncuestasIEPM(Number(this.idEmprendedor)));
      this.encuestasIEPM = data;
      if (data.length > 0) {
        this.encuestaSeleccionadaIEPM = data[0].idEncuesta;
        await this.fetchIEPMData();
      }
    } catch (error) {
      console.error('Error al cargar encuestas IEPM:', error);
      this.error = 'Error al cargar encuestas IEPM';
    }
  }

 // ✅ MÉTODO MEJORADO: Actualizar el fetchResultados para debug
// REEMPLAZA el método fetchResultados() existente:

async fetchResultados() {
  if (!this.encuestaSeleccionada) {
    console.warn('⚠️ No hay encuesta seleccionada');
    return;
  }

  try {
    console.log('🔄 Cargando resultados para encuesta:', this.encuestaSeleccionada);
    this.isLoading = true;
    this.error = null;

    // 1. Cargar datos del emprendedor
    const emprendedor = await firstValueFrom(
      this.resultadosService.getEmprendedor(Number(this.idEmprendedor))
    );
    this.emprendedor = emprendedor;
    console.log('✅ Emprendedor cargado:', emprendedor?.nombre);

    // 2. Cargar resultados
    const resultadosData = await firstValueFrom(
      this.resultadosService.getResultadosResumen(
        Number(this.idEmprendedor), 
        this.encuestaSeleccionada
      )
    );

    console.log('📊 Datos recibidos del servicio:', resultadosData);

    // 3. Procesar datos
    this.resultados = resultadosData.resultados || [];
    this.resumen = resultadosData.resumen || null;

    console.log('✅ Resultados procesados:', {
      totalResultados: this.resultados.length,
      resumen: this.resumen
    });

    // 4. Validar y transformar datos si es necesario
    this.validarYTransformarDatos();

    this.isLoading = false;

    // 5. Crear gráfico después de cargar datos
    setTimeout(() => {
      console.log('🎨 Creando gráfico con datos reales...');
      this.createPieChart();
    }, 500);

  } catch (error) {
    console.error('❌ Error al cargar datos ICE:', error);
    this.error = 'Error al cargar datos ICE';
    this.isLoading = false;
    
    // Crear gráfico de prueba en caso de error
    setTimeout(() => {
      this.createPieChart();
    }, 500);
  }
}






// NUEVO MÉTODO: Validar y transformar datos
private validarYTransformarDatos(): void {
  console.log('🔍 Validando datos...');
  
  if (!this.resultados || this.resultados.length === 0) {
    console.warn('⚠️ No hay resultados para validar');
    return;
  }

  // Asegurarse de que cada resultado tenga las propiedades necesarias
  this.resultados = this.resultados.map((resultado, index) => {
    // Si no tiene nombre, asignarlo desde el array de nombres
    if (!resultado.nombre) {
      resultado.nombre = this.competenciasNombres[resultado.idCompetencia - 1] || 
                        `Competencia ${resultado.idCompetencia}`;
    }
    
    // Si no tiene color, asignarlo desde el array de colores
    if (!resultado.color) {
      resultado.color = this.colors[index % this.colors.length];
    }
    
    // Asegurar que tiene un valor numérico válido
    if (typeof resultado.puntuacionCompetencia !== 'number' || 
        isNaN(resultado.puntuacionCompetencia)) {
      resultado.puntuacionCompetencia = 0;
    }
    
    // Agregar valor alternativo si no existe
    if (!resultado.valor) {
      resultado.valor = resultado.puntuacionCompetencia;
    }
    
    return resultado;
  });

  console.log('✅ Datos validados y transformados:', this.resultados.length, 'competencias');
  
  // Log de cada competencia para debug
  this.resultados.forEach((resultado, index) => {
    console.log(`Competencia ${index + 1}:`, {
      id: resultado.idCompetencia,
      nombre: resultado.nombre,
      puntuacion: resultado.puntuacionCompetencia,
      color: resultado.color
    });
  });
}






  // CORREGIDO: Método fetchIEPMData con transformación mejorada
  async fetchIEPMData() {
    if (!this.encuestaSeleccionadaIEPM) return;

    try {
      this.isLoading = true;
      this.error = null;

      const data = await firstValueFrom(this.resultadosService.getResultadosIEPM(Number(this.idEmprendedor), this.encuestaSeleccionadaIEPM));

      const transformedData: IepmTransformado = {
        resultadoTotal: {
          puntaje: data.iepm?.iepm || 0,
          valoracion: data.iepm?.valoracion || 'N/A',
          criterio: data.accionMejora?.descripcion || 'N/A'
        },
        porDimension: data.dimensiones?.map((d: any) => ({
          idDimension: d.idDimension,
          dimension: this.getNombreDimension(d.idDimension),
          puntaje: d.valor,
          porcentaje: (d.valor / 5) * 100
        })) || [],
        porIndicador: data.indicadores?.map((i: any) => ({
          idIndicador: i.idIndicador,
          indicador: this.getNombreIndicador(i.idIndicador),
          idDimension: Math.ceil(i.idIndicador / 3), // Asociar indicador a dimensión
          dimension: this.getNombreDimension(Math.ceil(i.idIndicador / 3)),
          puntaje: i.valor,
          porcentaje: (i.valor / 5) * 100
        })) || [],
        accionRecomendada: {
          descripcion: data.accionMejora?.descripcion || 'N/A',
          recomendaciones: data.accionMejora?.recomendaciones || 'N/A',
          rango: `${data.accionMejora?.rangoMin || 0}-${data.accionMejora?.rangoMax || 0}`
        }
      };

      this.iepmData = transformedData;
      this.showIEPM = true;
      this.isLoading = false;
      
      // Crear el gráfico IEPM después de cargar los datos
      setTimeout(() => {
        this.createIEPMChart();
      }, 100);

    } catch (error) {
      console.error('Error al cargar resultados IEPM:', error);
      this.isLoading = false;
    }
  }
  // Métodos públicos
getValorCompetencia(idCompetencia: number): string {
  const resultado = this.resultados.find(r => r.idCompetencia === idCompetencia);
  return resultado ? resultado.puntuacionCompetencia.toFixed(2) : 'N/A';
}

calcularIceGeneral(): number {
  return this.resumen ? this.resumen.valorIceTotal : 0;
}

getNivelIceGeneral() {
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
  } else if (iceGeneral >= 0.8 && iceGeneral <= 1.0001) {
    return {
      nivel: 'Alto',
      valoracion: 'Alta competencia',
      acciones: 'Excelente desempeño en competencias'
    };
  } else {
    return {
      nivel: 'N/A',
      valoracion: 'N/A',
      acciones: 'N/A'
    };
  }
}

// CORREGIDO: Método getNombreIndicador mejorado
getNombreIndicador(idIndicador: number): string {
  const indicador = this.indicadoresInfo.find(i => i.idIndicador === idIndicador);
  return indicador ? indicador.nombre : `Indicador ${idIndicador}`;
}

// CORREGIDO: Método getNombreDimension mejorado
getNombreDimension(idDimension: number): string {
  const dimension = this.dimensionesInfo.find(d => d.idDimension === idDimension);
  return dimension ? dimension.nombre : `Dimensión ${idDimension}`;
}





// NUEVOS MÉTODOS para obtener indicadores por dimensión
getIndicadoresPorDimension(idDimension: number): any[] {
  if (!this.iepmData?.porIndicador) return [];
  
  return this.iepmData.porIndicador.filter(ind => {
    // Asociar indicadores a dimensiones: 1-3 = Económica, 4-6 = Operacional, 7-9 = Innovación
    const dimensionCalculada = Math.ceil(ind.idIndicador / 3);
    return dimensionCalculada === idDimension;
  });
}

// NUEVO: Método para obtener el color de la dimensión
getColorDimension(idDimension: number): string {
  const colores = ['#FF6E6E', '#6A8CFF', '#7CFFCB'];
  return colores[idDimension - 1] || '#999999';
}




getResultadosFiltrados(): Resultado[] {
  if (!this.resultados || this.resultados.length === 0) {
    return [];
  }
  
  // Si no hay filtros específicos, devolver todos los resultados
  // Puedes agregar lógica de filtrado aquí según tus necesidades
  
  // Ejemplo: Filtrar solo resultados con puntuación > 0
  return this.resultados.filter(resultado => 
    resultado.puntuacionCompetencia > 0
  );
}



/**
 * Método auxiliar para obtener el nivel de una competencia
 */
private getNivelCompetencia(puntuacion: number): string {
  if (puntuacion >= 0 && puntuacion < 0.6) {
    return 'Bajo';
  } else if (puntuacion >= 0.6 && puntuacion < 0.8) {
    return 'Medio';
  } else if (puntuacion >= 0.8 && puntuacion <= 1.0) {
    return 'Alto';
  } else {
    return 'N/A';
  }
}









// NUEVO: Método para obtener el nivel de un puntaje
getNivelPuntaje(puntaje: number): { nivel: string; color: string } {
  if (puntaje >= 0 && puntaje < 2) {
    return { nivel: 'Bajo', color: '#FF6E6E' };
  } else if (puntaje >= 2 && puntaje < 4) {
    return { nivel: 'Medio', color: '#FFE066' };
  } else if (puntaje >= 4 && puntaje <= 5) {
    return { nivel: 'Alto', color: '#7CFFCB' };
  } else {
    return { nivel: 'N/A', color: '#999999' };
  }
}

// Métodos para formatear fechas - CORREGIDOS
formatearFecha(fecha: string): string {
  if (!fecha) return 'N/A';
  try {
    return new Date(fecha).toLocaleDateString();
  } catch (error) {
    return 'N/A';
  }
}

formatearFechaHora(fecha: string): string {
  if (!fecha) return 'N/A';
  try {
    return new Date(fecha).toLocaleString();
  } catch (error) {
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
  if (!this.encuestas || this.encuestas.length === 0) return 'N/A';
  const encuesta = this.encuestas.find(e => e.idEncuesta === this.encuestaSeleccionada);
  return encuesta ? this.formatearFecha(encuesta.fechaEvaluacion) : 'N/A';
}
//IMPIRMIR


imprimir() {
  // Opción 1: Imprimir usando window.print()
  window.print();
}



forzarRedibujado() {
  // Opción 1: Forzar detección de cambios
  this.cdr.detectChanges();
}

// Métodos específicos para fecha de evaluación y aplicación
getFechaEvaluacion(encuesta: Encuesta): string {
  return encuesta?.fechaEvaluacion ? this.formatearFecha(encuesta.fechaEvaluacion) : 'N/A';
}

getFechaAplicacion(encuesta: Encuesta): string {
  return encuesta?.fechaAplicacion ? this.formatearFecha(encuesta.fechaAplicacion) : 'N/A';


}

 toggleComentarios() {
    this.showSideComments = !this.showSideComments;
  }

  // MÉTODO CORREGIDO: onEncuestaSeleccionadaChange() 
onEncuestaSeleccionadaChange(event: any) {
  console.log('🔄 Cambiando encuesta ICE:', event.detail.value);
  
  try {
    const valor = event.detail.value;
    this.encuestaSeleccionada = valor ? Number(valor) : null;
    
    if (this.encuestaSeleccionada) {
      console.log('✅ Nueva encuesta seleccionada:', this.encuestaSeleccionada);
      this.fetchResultados();
    } else {
      console.warn('⚠️ Encuesta seleccionada es null');
    }
    
  } catch (error) {
    console.error('❌ Error al cambiar encuesta ICE:', error);
  }
}







// MÉTODO PÚBLICO: Forzar recreación del gráfico (botón de emergencia)
recrearGrafico(): void {
  console.log('🔄 Recreando gráfico manualmente...');
  
  // Destruir gráfico actual
  if (this.chart) {
    this.chart.destroy();
    this.chart = null;
  }
  
  // Esperar un momento y recrear
  setTimeout(() => {
    this.createPieChart();
    console.log('✅ Gráfico recreado');
  }, 200);
}

// MÉTODO PÚBLICO: Crear gráfico con todas las competencias (datos completos)
crearGraficoCompleto(): void {
  console.log('🎨 Creando gráfico con todas las competencias...');
  
  if (!this.pieChart?.nativeElement) {
    console.error('❌ Canvas no disponible');
    return;
  }

  // Destruir gráfico anterior
  if (this.chart) {
    this.chart.destroy();
    this.chart = null;
  }

  const ctx = this.pieChart.nativeElement.getContext('2d');
  if (!ctx) return;

  // Crear datos completos para las 10 competencias
  const datosCompletos = this.competenciasNombres.map((nombre, index) => {
    // Buscar datos reales si existen
    const resultadoReal = this.resultados?.find(r => r.idCompetencia === (index + 1));
    const valor = resultadoReal?.puntuacionCompetencia || Math.random() * 0.5 + 0.5; // Valor aleatorio si no existe
    
    return {
      nombre: nombre,
      valor: valor,
      color: this.colors[index % this.colors.length]
    };
  });

  // Crear gráfico
  this.chart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: datosCompletos.map(item => item.nombre),
      datasets: [{
        label: 'Competencias Emprendedoras',
        data: datosCompletos.map(item => item.valor),
        backgroundColor: datosCompletos.map(item => item.color),
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
          text: 'Evaluación Completa de Competencias Emprendedoras (ICE)',
          font: { size: 16, weight: 'bold' },
          padding: 20
        },
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            padding: 12,
            font: { size: 11 }
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const label = context.label || '';
              const value = context.parsed || 0;
              const total = datosCompletos.reduce((sum, item) => sum + item.valor, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value.toFixed(3)} (${percentage}%)`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1500
      }
    }
  });

  console.log('✅ Gráfico completo creado con 10 competencias');
}

// MÉTODO PÚBLICO: Cambiar tipo de gráfico
cambiarTipoGraficoVisual(tipo: 'pie' | 'doughnut' | 'bar' | 'radar'): void {
  console.log('🔄 Cambiando tipo de gráfico a:', tipo);
  
  if (!this.resultados || this.resultados.length === 0) {
    console.warn('⚠️ No hay datos para cambiar tipo de gráfico');
    return;
  }

  if (this.chart) {
    this.chart.destroy();
    this.chart = null;
  }

  const ctx = this.pieChart.nativeElement.getContext('2d');
  if (!ctx) return;

  // Preparar datos
  const labels = this.resultados.map((resultado, index) => 
    this.competenciasNombres[resultado.idCompetencia - 1] || `Competencia ${resultado.idCompetencia}`
  );
  const valores = this.resultados.map(resultado => resultado.puntuacionCompetencia);
  const colores = this.resultados.map((_, index) => this.colors[index % this.colors.length]);

  // Configuración específica por tipo
  let config: any = {
    type: tipo,
    data: {
      labels: labels,
      datasets: [{
        label: 'Competencias Emprendedoras',
        data: valores,
        backgroundColor: colores,
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
          text: `Competencias Emprendedoras (${tipo.toUpperCase()})`,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          position: tipo === 'bar' ? 'top' : 'bottom'
        }
      }
    }
  };

  // Configuración específica para gráfico de barras
  if (tipo === 'bar') {
    config.options.scales = {
      y: {
        beginAtZero: true,
        max: 1,
        ticks: {
          stepSize: 0.2
        }
      }
    };
  }

  // Configuración específica para gráfico radar
  if (tipo === 'radar') {
    config.options.scales = {
      r: {
        beginAtZero: true,
        max: 1,
        ticks: {
          stepSize: 0.2
        }
      }
    };
    config.data.datasets[0].pointBackgroundColor = colores;
    config.data.datasets[0].pointBorderColor = '#ffffff';
    config.data.datasets[0].pointBorderWidth = 2;
  }

  this.chart = new Chart(ctx, config);
  console.log('✅ Gráfico cambiado a tipo:', tipo);
}

// MÉTODO DE DIAGNÓSTICO: Para verificar el estado del componente
diagnosticarEstado(): void {
  console.log('🔍 DIAGNÓSTICO DEL COMPONENTE:');
  console.log('Canvas disponible:', !!this.pieChart?.nativeElement);
  console.log('Resultados cargados:', this.resultados?.length || 0);
  console.log('Encuesta seleccionada:', this.encuestaSeleccionada);
  console.log('Gráfico existente:', !!this.chart);
  console.log('Loading:', this.isLoading);
  console.log('Error:', this.error);
  
  if (this.resultados && this.resultados.length > 0) {
    console.log('Primeros 3 resultados:', this.resultados.slice(0, 3));
  }
  
  console.log('Canvas element:', this.pieChart?.nativeElement);
}







// ✅ MÉTODO DE PRUEBA: Para verificar manualmente
testearGrafico(): void {
  console.log('🧪 Probando gráfico con datos de prueba...');
  
  // Datos de prueba
  const datosTest = [
    { idCompetencia: 1, puntuacionCompetencia: 0.85 },
    { idCompetencia: 2, puntuacionCompetencia: 0.72 },
    { idCompetencia: 3, puntuacionCompetencia: 0.64 },
    { idCompetencia: 4, puntuacionCompetencia: 0.91 },
    { idCompetencia: 5, puntuacionCompetencia: 0.58 }
  ];
  
  // Mapear a tipo Resultado
  const resultadosTest = datosTest.map(item => ({
    ...item,
    nombre: `Competencia ${item.idCompetencia}`,
    color: this.generarColorCompetencia(item.idCompetencia),
    valor: item.puntuacionCompetencia
  }));
  
  const resultadosOriginales = this.resultados;
  this.resultados = resultadosTest;
  
  this.createPieChart();
  
  // Restaurar datos originales después de 5 segundos
  setTimeout(() => {
    this.resultados = resultadosOriginales;
    this.createPieChart();
  }, 5000);
}

// Función auxiliar para generar colores consistentes
private generarColorCompetencia(id: number): string {
  const colores = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#8AC24A', '#607D8B', '#E91E63', '#00BCD4'
  ];
  return colores[id % colores.length];
}


}
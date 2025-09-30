import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ResultadosService } from '../../services/resultados.service';

interface Emprendedor {
  idEmprendedor: number;
  nombre: string;
  email?: string;
}

interface ResultadoICE {
  idCompetencia: number;
  puntuacionCompetencia: number;
  nombre: string;
  descripcion: string;
  color: string;
  nivel: string;
}

interface CompetenciaInfo {
  id: number;
  nombre: string;
  descripcion: string;
}

interface IepmData {
  puntaje: number;
  valoracion: string;
  dimensiones: Array<{
    idDimension: number;
    dimension: string;
    puntaje: number;
    porcentaje: number;
    color: string;
  }>;
  indicadores: Array<{
    idIndicador: number;
    indicador: string;
    idDimension: number;
    dimension: string;
    enfoque: string;
    puntaje: number;
    porcentaje: number;
  }>;
}

interface Comentario {
  id: string;
  texto: string;
  tipo: 'predeterminado' | 'personalizado';
  fecha: Date;
  asesor: string;
}

interface ComparacionData {
  competencia: string;
  iceScore: number;
  iepmScore: number;
  diferencia: number;
  recomendacion: string;
}

@Component({
  selector: 'app-comparaciones-recomendaciones',
  templateUrl: './comparaciones-recomendaciones.page.html',
  styleUrls: ['./comparaciones-recomendaciones.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ComparacionesRecomendacionesPage implements OnInit {

  // Parámetros de ruta
  idEmprendedor: string | null = null;
  idEncuestaICE: string | null = null;
  idEncuestaIEPM: string | null = null;

  // Datos principales
  emprendedor: Emprendedor | null = null;
  resultadosICE: ResultadoICE[] = [];
  iepmData: IepmData | null = null;
  iceGeneral: number = 0;
  comparacionData: ComparacionData[] = [];

  // Estados de la interfaz
  isLoading = true;
  error: string | null = null;
  activeTab = 'comparacion';

  // Sistema de comentarios
  comentarios: Comentario[] = [];
  nuevoComentario = '';
  comentariosPredeterminados: string[] = [
    'Excelente desempeño en las competencias emprendedoras evaluadas.',
    'Se recomienda fortalecer las áreas de menor puntuación identificadas.',
    'Las habilidades de liderazgo muestran gran potencial de desarrollo.',
    'Es importante trabajar en la tolerancia a la incertidumbre.',
    'Las competencias financieras requieren mayor atención y capacitación.',
    'El trabajo en equipo es una fortaleza destacada del emprendedor.',
    'Se sugiere desarrollar más el pensamiento estratégico.',
    'Las habilidades tecnológicas están por encima del promedio.',
    'La creatividad es un punto fuerte que debe ser aprovechado.',
    'Se recomienda participar en programas de mentoría empresarial.'
  ];

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
    private alertController: AlertController,
    private resultadosService: ResultadosService
  ) {}

  async ngOnInit() {
    console.log('Inicializando ComparacionesRecomendacionesPage');
    this.extractRouteParams();

    if (!this.validateParams()) {
      this.handleError('Parámetros de navegación faltantes o inválidos');
      return;
    }

    await this.initializeData();
  }

  private extractRouteParams(): void {
    this.idEmprendedor = this.route.snapshot.paramMap.get('id');
    this.idEncuestaICE = this.route.snapshot.queryParamMap.get('encuestaICE');
    this.idEncuestaIEPM = this.route.snapshot.queryParamMap.get('encuestaIEPM');
  }

  private validateParams(): boolean {
    return !!(this.idEmprendedor && this.idEncuestaICE && this.idEncuestaIEPM);
  }

  private async initializeData(): Promise<void> {
    try {
      this.isLoading = true;
      this.error = null;

      await Promise.all([
        this.loadEmprendedor(),
        this.loadResultadosICE(),
        this.loadIEPMData()
      ]);

      this.generateComparacionData();
      this.loadComentarios();

      console.log('Datos cargados para comparación:', {
        emprendedor: this.emprendedor?.nombre,
        competenciasICE: this.resultadosICE.length,
        dimensionesIEPM: this.iepmData?.dimensiones.length || 0,
        indicadoresIEPM: this.iepmData?.indicadores.length || 0
      });

    } catch (error) {
      console.error('Error inicializando datos:', error);
      this.handleError('Error al cargar los datos del emprendedor');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadEmprendedor(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.resultadosService.getEmprendedor(Number(this.idEmprendedor))
      );

      if (!data) throw new Error('No se encontraron datos del emprendedor');
      this.emprendedor = data;
    } catch (error) {
      throw new Error('Error al cargar información del emprendedor');
    }
  }

  private async loadResultadosICE(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.resultadosService.getResultadosResumen(
          Number(this.idEmprendedor),
          Number(this.idEncuestaICE)
        )
      );

      if (!data || !data.resultados || data.resultados.length === 0) {
        throw new Error('No se encontraron resultados ICE para este emprendedor');
      }

      this.resultadosICE = this.processResultadosICE(data.resultados);
      this.iceGeneral = data.resumen?.valorIceTotal || 0;

      // VALIDACIÓN: Asegurar que hay 10 competencias
      if (this.resultadosICE.length !== 10) {
        console.warn(`⚠️ ADVERTENCIA ICE: Se esperaban 10 competencias, se encontraron ${this.resultadosICE.length}`);
      }

    } catch (error) {
      throw new Error('Error al cargar resultados ICE');
    }
  }

  private async loadIEPMData(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.resultadosService.getResultadosIEPM(
          Number(this.idEmprendedor),
          Number(this.idEncuestaIEPM)
        )
      );

      if (!data || !data.iepm) throw new Error('No se encontraron resultados IEPM para este emprendedor');
      this.iepmData = this.processIEPMData(data);

      // VALIDACIÓN: Asegurar estructura correcta
      console.log('IEPM validado:', {
        dimensiones: this.iepmData.dimensiones.length,
        indicadores: this.iepmData.indicadores.length
      });

    } catch (error) {
      throw new Error('Error al cargar resultados IEPM');
    }
  }

  // ======= PROCESAMIENTO DE RESULTADOS ICE - CORREGIDO =======
  private processResultadosICE(resultados: any[]): ResultadoICE[] {
    if (!Array.isArray(resultados)) {
      console.warn('Los resultados ICE no son un array válido');
      return [];
    }

    // Filtrar para obtener solo competencias únicas del 1 al 10
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
          // Si ya existe, promediar las puntuaciones
          const existente = competenciasMap.get(idNormalizado);
          existente.puntuacionCompetencia = 
            (Number(existente.puntuacionCompetencia) + Number(resultado.puntuacionCompetencia)) / 2;
        }
      }
    });

    // Convertir el Map a array y transformar
    return Array.from(competenciasMap.values()).map(resultado => {
      const idCompetencia = resultado.idCompetencia;
      const competenciaInfo = this.getCompetenciaInfo(idCompetencia);
      const puntuacion = Number(resultado.puntuacionCompetencia) || 0;
      
      return {
        idCompetencia,
        puntuacionCompetencia: puntuacion,
        nombre: competenciaInfo.nombre,
        descripcion: competenciaInfo.descripcion,
        color: this.colors[(idCompetencia - 1) % this.colors.length],
        nivel: this.getNivelCompetencia(puntuacion)
      };
    }).sort((a, b) => a.idCompetencia - b.idCompetencia);
  }

  private getCompetenciaInfo(idCompetencia: number): CompetenciaInfo {
    const idNormalizado = idCompetencia > 10 
      ? ((idCompetencia - 1) % 10) + 1 
      : idCompetencia;
    
    const competencia = this.competenciasInfo.find(c => c.id === idNormalizado);
    
    if (competencia) {
      return competencia;
    }

    return {
      id: idNormalizado,
      nombre: `Competencia ${idNormalizado}`,
      descripcion: 'Sin descripción'
    };
  }

  private getNivelCompetencia(puntuacion: number): string {
    if (puntuacion < 0.6) return 'Bajo';
    if (puntuacion < 0.8) return 'Medio';
    return 'Alto';
  }

  // ======= PROCESAMIENTO DE DATOS IEPM =======
  private processIEPMData(data: any): IepmData {
    const dimensionesNombres = [
      'Calidad y Eficiencia Laboral',
      'Infraestructura Laboral',
      'Tecnología e Innovación'
    ];

    const indicadoresNombres = [
      'Índice de Satisfacción del Cliente',
      'Ingresos',
      'Tiempo de Obtención de Permisos',
      'Accesibilidad de la Instalación',
      'Gastos de Transportación',
      'Comodidad del Trabajador',
      'Capacidad Tecnológica',
      'Liderazgo Creativo con Énfasis Innovador'
    ];

    return {
      puntaje: data.iepm?.iepm || 0,
      valoracion: data.iepm?.valoracion || 'Sin valoración',
      dimensiones: (data.dimensiones || []).map((d: any) => ({
        idDimension: d.idDimension,
        dimension: dimensionesNombres[d.idDimension - 1] || `Dimensión ${d.idDimension}`,
        puntaje: d.valor,
        porcentaje: Math.round((d.valor / 5) * 100),
        color: this.colors[d.idDimension + 4]
      })),
      indicadores: (data.indicadores || []).map((i: any) => {
        const idDimension = this.getIdDimensionPorIndicador(i.idIndicador);
        return {
          idIndicador: i.idIndicador,
          indicador: indicadoresNombres[i.idIndicador - 1] || `Indicador ${i.idIndicador}`,
          idDimension,
          dimension: dimensionesNombres[idDimension - 1] || `Dimensión ${idDimension}`,
          enfoque: this.getEnfoqueIndicador(i.idIndicador),
          puntaje: i.valor,
          porcentaje: Math.round((i.valor / 5) * 100)
        };
      })
    };
  }

  private getIdDimensionPorIndicador(idIndicador: number): number {
    // Dimensión 1: indicadores 1, 2, 3
    // Dimensión 2: indicadores 4, 5, 6
    // Dimensión 3: indicadores 7, 8
    if (idIndicador >= 1 && idIndicador <= 3) return 1;
    if (idIndicador >= 4 && idIndicador <= 6) return 2;
    if (idIndicador >= 7 && idIndicador <= 8) return 3;
    return 1;
  }

  private getEnfoqueIndicador(idIndicador: number): string {
    const enfoques: { [key: number]: string } = {
      1: 'Cliente', 2: 'Emprendedor', 3: 'Emprendedor',
      4: 'Cliente', 5: 'Trabajador', 6: 'Trabajador',
      7: 'Emprendedor', 8: 'Emprendedor'
    };
    return enfoques[idIndicador] || 'Emprendedor';
  }

  // ======= GENERACIÓN DE COMPARACIÓN =======
  private generateComparacionData(): void {
    if (!this.resultadosICE.length || !this.iepmData) return;

    // Mapeo lógico entre competencias ICE y dimensiones IEPM
    const mapeoCompetenciaDimension: { [key: number]: number } = {
      1: 1,  // Comportamiento Emprendedor → Calidad y Eficiencia
      2: 3,  // Creatividad → Tecnología e Innovación
      3: 1,  // Liderazgo → Calidad y Eficiencia
      4: 1,  // Personalidad Proactiva → Calidad y Eficiencia
      5: 2,  // Tolerancia a la Incertidumbre → Infraestructura
      6: 2,  // Trabajo en Equipo → Infraestructura
      7: 1,  // Pensamiento Estratégico → Calidad y Eficiencia
      8: 2,  // Proyección Social → Infraestructura
      9: 1,  // Orientación Financiera → Calidad y Eficiencia
      10: 3  // Orientación Tecnológica → Tecnología e Innovación
    };

    this.comparacionData = this.resultadosICE.map(ice => {
      const idDimensionRelacionada = mapeoCompetenciaDimension[ice.idCompetencia] || 1;
      const dimensionIEPM = this.iepmData!.dimensiones.find(d => d.idDimension === idDimensionRelacionada);
      
      const iepmScore = dimensionIEPM ? (dimensionIEPM.puntaje / 5) : 0;
      const diferencia = ice.puntuacionCompetencia - iepmScore;

      return {
        competencia: ice.nombre,
        iceScore: ice.puntuacionCompetencia,
        iepmScore,
        diferencia,
        recomendacion: this.generateRecomendacion(diferencia, ice.nombre)
      };
    });

    console.log('Comparación generada:', this.comparacionData.length, 'elementos');
  }

  private generateRecomendacion(diferencia: number, competencia: string): string {
    if (diferencia > 0.2) return `Excelente desempeño en ${competencia}. Mantener y potenciar esta fortaleza.`;
    if (diferencia < -0.2) return `Área de oportunidad en ${competencia}. Se recomienda capacitación específica.`;
    return `Desempeño balanceado en ${competencia}. Continuar con el desarrollo actual.`;
  }

  isNeutralDifference(diferencia: number): boolean {
    return Math.abs(diferencia) <= 0.05;
  }

  // ======= SISTEMA DE COMENTARIOS =======
  async agregarComentarioPredeterminado(comentario: string): Promise<void> {
    const nuevoComentario: Comentario = {
      id: Date.now().toString(),
      texto: comentario,
      tipo: 'predeterminado',
      fecha: new Date(),
      asesor: 'Sistema'
    };
    this.comentarios.push(nuevoComentario);
    await this.guardarComentarios();
    this.showToast('Comentario agregado exitosamente');
  }

  async agregarComentarioPersonalizado(): Promise<void> {
    if (!this.nuevoComentario.trim()) {
      return this.showToast('Ingrese un comentario válido', 'warning');
    }

    const comentario: Comentario = {
      id: Date.now().toString(),
      texto: this.nuevoComentario.trim(),
      tipo: 'personalizado',
      fecha: new Date(),
      asesor: 'Asesor'
    };

    this.comentarios.push(comentario);
    this.nuevoComentario = '';
    await this.guardarComentarios();
    this.showToast('Comentario personalizado agregado');
  }

  async eliminarComentario(comentarioId: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Está seguro de eliminar este comentario?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.comentarios = this.comentarios.filter(c => c.id !== comentarioId);
            this.guardarComentarios();
            this.showToast('Comentario eliminado');
          }
        }
      ]
    });
    await alert.present();
  }

  private loadComentarios(): void {
    const key = `comentarios_${this.idEmprendedor}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        this.comentarios = JSON.parse(stored);
      } catch {
        this.comentarios = [];
      }
    }
  }

  private async guardarComentarios(): Promise<void> {
    const key = `comentarios_${this.idEmprendedor}`;
    localStorage.setItem(key, JSON.stringify(this.comentarios));
  }

  // ======= MÉTODOS AUXILIARES =======
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  navigateBack(): void {
    this.router.navigate(['/informacion-resultados', this.idEmprendedor]);
  }

  private handleError(message: string): void {
    console.error('Error:', message);
    this.error = message;
    this.isLoading = false;
    this.showToast(message, 'danger');
  }

  async showToast(message: string, color: string = 'success'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      buttons: [{ text: 'Cerrar', role: 'cancel' }]
    });
    await toast.present();
  }

  async mostrarDetalleComparacion(item: ComparacionData): Promise<void> {
    const alert = await this.alertController.create({
      header: `Análisis: ${item.competencia}`,
      message: `
        <strong>Puntuación ICE:</strong> ${(item.iceScore * 100).toFixed(1)}%<br>
        <strong>Puntuación IEPM:</strong> ${(item.iepmScore * 100).toFixed(1)}%<br>
        <strong>Diferencia:</strong> ${(item.diferencia * 100).toFixed(1)}%<br><br>
        <strong>Recomendación:</strong><br>${item.recomendacion}
      `,
      buttons: ['Cerrar']
    });
    await alert.present();
  }

  // ======= GETTERS =======
  get hasResultados(): boolean {
    return this.resultadosICE.length > 0 && !!this.iepmData;
  }

  get promedioICE(): number {
    if (!this.resultadosICE.length) return 0;
    return this.resultadosICE.reduce((sum, r) => sum + r.puntuacionCompetencia, 0) / this.resultadosICE.length;
  }

  get promedioIEPM(): number {
    if (!this.iepmData?.dimensiones.length) return 0;
    return this.iepmData.dimensiones.reduce((sum, d) => sum + (d.puntaje / 5), 0) / this.iepmData.dimensiones.length;
  }

  getFortalezas(): ResultadoICE[] {
    return this.resultadosICE.filter(r => r.puntuacionCompetencia >= 0.7);
  }

  getDebilidades(): ResultadoICE[] {
    return this.resultadosICE.filter(r => r.puntuacionCompetencia < 0.5);
  }

  getOportunidades(): ResultadoICE[] {
    return this.resultadosICE.filter(r => r.puntuacionCompetencia >= 0.5 && r.puntuacionCompetencia < 0.7);
  }

  trackByCompetencia(index: number, item: ResultadoICE): number {
    return item.idCompetencia;
  }

  trackByDimension(index: number, item: any): number {
    return item.idDimension;
  }

  trackByComparacion(index: number, item: ComparacionData): string {
    return item.competencia;
  }

  trackByComentario(index: number, item: Comentario): string {
    return item.id;
  }

  // ======= DIAGNÓSTICO =======
  diagnosticarComparacion(): void {
    console.log('═══════════════════════════════════════════════');
    console.log('DIAGNÓSTICO - COMPARACIÓN ICE vs IEPM');
    console.log('═══════════════════════════════════════════════');
    console.log('PARÁMETROS:');
    console.log('  • ID Emprendedor:', this.idEmprendedor);
    console.log('  • ID Encuesta ICE:', this.idEncuestaICE);
    console.log('  • ID Encuesta IEPM:', this.idEncuestaIEPM);
    console.log('───────────────────────────────────────────────');
    console.log('DATOS ICE:');
    console.log('  • Competencias:', this.resultadosICE.length, '/ 10 esperadas');
    console.log('  • Promedio ICE:', this.promedioICE.toFixed(3));
    console.log('───────────────────────────────────────────────');
    console.log('DATOS IEPM:');
    console.log('  • Dimensiones:', this.iepmData?.dimensiones.length || 0, '/ 3 esperadas');
    console.log('  • Indicadores:', this.iepmData?.indicadores.length || 0, '/ 8 esperados');
    console.log('  • Promedio IEPM:', this.promedioIEPM.toFixed(3));
    console.log('───────────────────────────────────────────────');
    console.log('COMPARACIÓN:');
    console.log('  • Elementos comparados:', this.comparacionData.length);
    this.comparacionData.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.competencia}:`);
      console.log(`     ICE: ${(item.iceScore * 100).toFixed(1)}% | IEPM: ${(item.iepmScore * 100).toFixed(1)}% | Diff: ${(item.diferencia * 100).toFixed(1)}%`);
    });
    console.log('───────────────────────────────────────────────');
    console.log('ANÁLISIS FODA:');
    console.log('  • Fortalezas:', this.getFortalezas().length);
    console.log('  • Oportunidades:', this.getOportunidades().length);
    console.log('  • Debilidades:', this.getDebilidades().length);
    console.log('───────────────────────────────────────────────');
    console.log('COMENTARIOS:');
    console.log('  • Total comentarios:', this.comentarios.length);
    console.log('═══════════════════════════════════════════════');

    if (this.resultadosICE.length !== 10) {
      console.warn(' ADVERTENCIA: No hay exactamente 10 competencias ICE');
    }
    if (this.iepmData?.dimensiones.length !== 3) {
      console.warn(' ADVERTENCIA: No hay exactamente 3 dimensiones IEPM');
    }
    if (this.iepmData?.indicadores.length !== 8) {
      console.warn(' ADVERTENCIA: No hay exactamente 8 indicadores IEPM');
    }
  }
}
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, AlertController, ModalController } from '@ionic/angular';
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
  color: string;
}

interface IepmData {
  puntaje: number;
  valoracion: string;
  dimensiones: Array<{
    dimension: string;
    puntaje: number;
    porcentaje: number;
    color: string;
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

  // Constantes
  readonly competenciasNombres = [
    'Comportamiento Emprendedor', 'Creatividad', 'Liderazgo',
    'Personalidad Proactiva', 'Tolerancia a la incertidumbre',
    'Trabajo en Equipo', 'Pensamiento Estratégico', 'Proyección Social',
    'Orientación Financiera', 'Orientación Tecnológica'
  ];

  readonly dimensionesIEPM = [
    'Dimensión Económica', 'Dimensión Operacional', 'Dimensión de Innovación'
  ];

  readonly colors = [
    '#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#00bcd4',
    '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b'
  ];

  // Map completo de competencias - CORREGIDO
  private readonly competenciasMap = new Map<number, string>([
    // IDs originales 1-10
    [1, 'Comportamiento Emprendedor'],
    [2, 'Creatividad'],
    [3, 'Liderazgo'],
    [4, 'Personalidad Proactiva'],
    [5, 'Tolerancia a la incertidumbre'],
    [6, 'Trabajo en Equipo'],
    [7, 'Pensamiento Estratégico'],
    [8, 'Proyección Social'],
    [9, 'Orientación Financiera'],
    [10, 'Orientación Tecnológica'],
    
    // IDs 1001-1010 (posible segundo conjunto)
    [1001, 'Comportamiento Emprendedor'],
    [1002, 'Creatividad'],
    [1003, 'Liderazgo'],
    [1004, 'Personalidad Proactiva'],
    [1005, 'Tolerancia a la incertidumbre'],
    [1006, 'Trabajo en Equipo'],
    [1007, 'Pensamiento Estratégico'],
    [1008, 'Proyección Social'],
    [1009, 'Orientación Financiera'],
    [1010, 'Orientación Tecnológica'],
    
    // IDs 2001-2010 (posible tercer conjunto)
    [2001, 'Comportamiento Emprendedor'],
    [2002, 'Creatividad'],
    [2003, 'Liderazgo'],
    [2004, 'Personalidad Proactiva'],
    [2005, 'Tolerancia a la incertidumbre'],
    [2006, 'Trabajo en Equipo'],
    [2007, 'Pensamiento Estratégico'],
    [2008, 'Proyección Social'],
    [2009, 'Orientación Financiera'],
    [2010, 'Orientación Tecnológica'],
    
    // IDs 3001-3010 (posible cuarto conjunto)
    [3001, 'Comportamiento Emprendedor'],
    [3002, 'Creatividad'],
    [3003, 'Liderazgo'],
    [3004, 'Personalidad Proactiva'],
    [3005, 'Tolerancia a la incertidumbre'],
    [3006, 'Trabajo en Equipo'],
    [3007, 'Pensamiento Estratégico'],
    [3008, 'Proyección Social'],
    [3009, 'Orientación Financiera'],
    [3010, 'Orientación Tecnológica']
  ]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController,
    private resultadosService: ResultadosService
  ) {}

  async ngOnInit() {
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

    } catch (error) {
      throw new Error('Error al cargar resultados IEPM');
    }
  }

  // ======= PROCESAMIENTO DE RESULTADOS - CORREGIDO =======
  private processResultadosICE(resultados: any[]): ResultadoICE[] {
    return resultados.map((resultado, index) => {
      const nombreCompetencia = this.competenciasMap.get(resultado.idCompetencia);
      
      // Si no encuentra el nombre, intenta con un mapeo basado en posición
      let nombre: string;
      if (nombreCompetencia) {
        nombre = nombreCompetencia;
      } else {
        // Mapeo de fallback basado en el índice o ID
        const indiceCompetencia = (resultado.idCompetencia - 1) % 10;
        nombre = this.competenciasNombres[indiceCompetencia] || `Competencia ${resultado.idCompetencia}`;
        
        // Log para debug
        console.warn(`ID de competencia no mapeado: ${resultado.idCompetencia}, usando: ${nombre}`);
      }

      return {
        ...resultado,
        nombre,
        color: this.colors[index % this.colors.length]
      };
    });
  }

  private processIEPMData(data: any): IepmData {
    return {
      puntaje: data.iepm?.iepm || 0,
      valoracion: data.iepm?.valoracion || 'Sin valoración',
      dimensiones: (data.dimensiones || []).map((d: any, index: number) => ({
        dimension: this.dimensionesIEPM[index] || `Dimensión ${d.idDimension}`,
        puntaje: d.valor,
        porcentaje: Math.round((d.valor / 5) * 100),
        color: this.colors[index + 5]
      }))
    };
  }

  private generateComparacionData(): void {
    if (!this.resultadosICE.length || !this.iepmData) return;

    this.comparacionData = this.resultadosICE.map((ice, index) => {
      const iepmDimension = this.iepmData!.dimensiones[index % 3] || this.iepmData!.dimensiones[0];
      const diferencia = ice.puntuacionCompetencia - (iepmDimension.puntaje / 5);

      return {
        competencia: ice.nombre,
        iceScore: ice.puntuacionCompetencia,
        iepmScore: iepmDimension.puntaje / 5,
        diferencia,
        recomendacion: this.generateRecomendacion(diferencia, ice.nombre)
      };
    });
  }

  private generateRecomendacion(diferencia: number, competencia: string): string {
    if (diferencia > 0.2) return `Excelente desempeño en ${competencia}. Mantener y potenciar esta fortaleza.`;
    if (diferencia < -0.2) return `Área de oportunidad en ${competencia}. Se recomienda capacitación específica.`;
    return `Desempeño balanceado en ${competencia}. Continuar con el desarrollo actual.`;
  }

  // ======= MÉTODO AGREGADO PARA CORREGIR ERROR =======
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
    if (!this.nuevoComentario.trim()) return this.showToast('Ingrese un comentario válido', 'warning');

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
  setActiveTab(tab: string): void { this.activeTab = tab; }
  navigateBack(): void { this.router.navigate(['/informacion-resultados', this.idEmprendedor]); }
  private handleError(message: string): void { this.error = message; this.isLoading = false; this.showToast(message, 'danger'); }

  async showToast(message: string, color: string = 'success'): Promise<void> {
    const toast = await this.toastController.create({ message, duration: 3000, color, position: 'top', buttons: [{ text: 'Cerrar', role: 'cancel' }] });
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
  get hasResultados(): boolean { return this.resultadosICE.length > 0 && !!this.iepmData; }

  get promedioICE(): number {
    if (!this.resultadosICE.length) return 0;
    return this.resultadosICE.reduce((sum, r) => sum + r.puntuacionCompetencia, 0) / this.resultadosICE.length;
  }

  get promedioIEPM(): number {
    if (!this.iepmData?.dimensiones.length) return 0;
    return this.iepmData.dimensiones.reduce((sum, d) => sum + (d.puntaje / 5), 0) / this.iepmData.dimensiones.length;
  }

  getFortalezas(): ResultadoICE[] { return this.resultadosICE.filter(r => r.puntuacionCompetencia >= 0.7); }
  getDebilidades(): ResultadoICE[] { return this.resultadosICE.filter(r => r.puntuacionCompetencia < 0.5); }
  getOportunidades(): ResultadoICE[] { return this.resultadosICE.filter(r => r.puntuacionCompetencia >= 0.5 && r.puntuacionCompetencia < 0.7); }

  trackByCompetencia(index: number, item: ResultadoICE): number { return item.idCompetencia; }
  trackByDimension(index: number, item: any): string { return item.dimension; }
  trackByComparacion(index: number, item: ComparacionData): string { return item.competencia; }
  trackByComentario(index: number, item: Comentario): string { return item.id; }
}
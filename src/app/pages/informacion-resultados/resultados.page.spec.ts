import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InformacionResultadosPage } from './informacion-resultados.page';
import { ResultadosService } from '../../services/resultados.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController, AlertController } from '@ionic/angular';
import { of } from 'rxjs';

describe('InformacionResultadosPage', () => {
  let component: InformacionResultadosPage;
  let fixture: ComponentFixture<InformacionResultadosPage>;

  beforeEach(async () => {
    const mockService = jasmine.createSpyObj('InformacionResultadosService', [
      'getEmprendedor', 'getEncuestasICE', 'getEncuestasIEPM', 'checkApiHealth'
    ]);
    
    const mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    
    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: () => '1'
        }
      }
    };

    const mockToastController = jasmine.createSpyObj('ToastController', ['create']);
    const mockAlertController = jasmine.createSpyObj('AlertController', ['create']);

    // Configurar respuestas de los mocks
    mockService.getEmprendedor.and.returnValue(of({ idEmprendedor: 1, nombre: 'Test' }));
    mockService.getEncuestasICE.and.returnValue(of([]));
    mockService.getEncuestasIEPM.and.returnValue(of([]));
    mockService.checkApiHealth.and.returnValue(of(true));
    
    mockToastController.create.and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));
    mockAlertController.create.and.returnValue(Promise.resolve({ present: () => Promise.resolve() }));

    await TestBed.configureTestingModule({
      imports: [InformacionResultadosPage],
      providers: [
        { provide: ResultadosService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ToastController, useValue: mockToastController },
        { provide: AlertController, useValue: mockAlertController }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InformacionResultadosPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
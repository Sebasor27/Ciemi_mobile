import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VentanaEncuestasPage } from './ventana-encuestas.page';

describe('VentanaEncuestasPage', () => {
  let component: VentanaEncuestasPage;
  let fixture: ComponentFixture<VentanaEncuestasPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VentanaEncuestasPage]
    });
    fixture = TestBed.createComponent(VentanaEncuestasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
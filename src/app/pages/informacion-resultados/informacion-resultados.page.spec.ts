import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InformacionResultadosPage } from './informacion-resultados.page';

describe('InformacionResultadosPage', () => {
  let component: InformacionResultadosPage;
  let fixture: ComponentFixture<InformacionResultadosPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InformacionResultadosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

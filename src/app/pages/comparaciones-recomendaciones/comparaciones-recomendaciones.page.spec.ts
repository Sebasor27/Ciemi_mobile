import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComparacionesRecomendacionesPage } from './comparaciones-recomendaciones.page';

describe('ComparacionesRecomendacionesPage', () => {
  let component: ComparacionesRecomendacionesPage;
  let fixture: ComponentFixture<ComparacionesRecomendacionesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ComparacionesRecomendacionesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

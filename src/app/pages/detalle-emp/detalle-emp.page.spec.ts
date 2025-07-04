import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetalleEmpPage } from './detalle-emp.page';

describe('DetalleEmpPage', () => {
  let component: DetalleEmpPage;
  let fixture: ComponentFixture<DetalleEmpPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DetalleEmpPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

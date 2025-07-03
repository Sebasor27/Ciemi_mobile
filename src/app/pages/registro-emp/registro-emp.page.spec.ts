import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegistroEmpPage } from './registro-emp.page';

describe('RegistroEmpPage', () => {
  let component: RegistroEmpPage;
  let fixture: ComponentFixture<RegistroEmpPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistroEmpPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

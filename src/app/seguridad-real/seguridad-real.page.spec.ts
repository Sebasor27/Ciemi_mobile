import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SeguridadRealPage } from './seguridad-real.page';

describe('SeguridadRealPage', () => {
  let component: SeguridadRealPage;
  let fixture: ComponentFixture<SeguridadRealPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SeguridadRealPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

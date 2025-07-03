import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReporteriaPage } from './reporteria.page';

describe('ReporteriaPage', () => {
  let component: ReporteriaPage;
  let fixture: ComponentFixture<ReporteriaPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReporteriaPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

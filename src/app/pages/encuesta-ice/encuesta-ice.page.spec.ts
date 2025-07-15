import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EncuestaICEPage } from './encuesta-ice.page';

describe('EncuestaICEPage', () => {
  let component: EncuestaICEPage;
  let fixture: ComponentFixture<EncuestaICEPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EncuestaICEPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Validate2FAComponent } from './validate2-fa.component';

describe('Validate2FAComponent', () => {
  let component: Validate2FAComponent;
  let fixture: ComponentFixture<Validate2FAComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Validate2FAComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Validate2FAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageAreasComponent } from './manage-areas.component';

describe('ManageAreasComponent', () => {
  let component: ManageAreasComponent;
  let fixture: ComponentFixture<ManageAreasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManageAreasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageAreasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

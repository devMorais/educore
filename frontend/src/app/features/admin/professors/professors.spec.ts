import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Professors } from './professors';

describe('Professors', () => {
  let component: Professors;
  let fixture: ComponentFixture<Professors>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Professors]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Professors);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

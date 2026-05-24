import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pcd } from './pcd';

describe('Pcd', () => {
  let component: Pcd;
  let fixture: ComponentFixture<Pcd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pcd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Pcd);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

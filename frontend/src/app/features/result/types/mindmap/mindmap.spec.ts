import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mindmap } from './mindmap';

describe('Mindmap', () => {
  let component: Mindmap;
  let fixture: ComponentFixture<Mindmap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mindmap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mindmap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HookALeftPage } from './hook-a-left.page';

describe('HookALeftPage', () => {
  let component: HookALeftPage;
  let fixture: ComponentFixture<HookALeftPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HookALeftPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

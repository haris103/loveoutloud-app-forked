import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScopeAndSequencePage } from './scope-and-sequence.page';

describe('ScopeAndSequencePage', () => {
  let component: ScopeAndSequencePage;
  let fixture: ComponentFixture<ScopeAndSequencePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ScopeAndSequencePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

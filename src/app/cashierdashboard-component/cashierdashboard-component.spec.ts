import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CashierDashboardComponent } from './cashierdashboard-component';

describe('CashierdashboardComponent', () => {
  let component: CashierDashboardComponent;
  let fixture: ComponentFixture<CashierDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CashierDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CashierDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

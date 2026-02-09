import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';

@Component({
  standalone: true,
  selector: 'app-admindashboard-component',
  templateUrl: './admindashboard-component.html',
  styleUrls: ['./admindashboard-component.css'],
  imports: [CommonModule, FormsModule]
})
export class AdminDashboardComponent implements OnInit {

  users: any[] = [];

  mainUsers: any[] = [];          
  supportStaffList: any[] = [];   

  newUser = { email: '', password: '', role: 'Cashier', isActive: true, salary: 0 };
  supportStaff = { name: '', role: 'Helper', salary: 0 };

  userTab: 'users' | 'staff' = 'users';
  showUsersSection = false;
  activeTab: 'home' | 'users' | 'sales' | 'reports' | 'bogo' | 'lastCustomers' | '' = 'home';

  chart: any;

  totalSales = 0;
  totalOrders = 0;
  totalCustomers = 0;

  bogoProducts: any[] = [];

  weeklyChart: any;
  supplierChart: any;
  categoryChart: any;
  paymentChart: any;

  adminEmail = localStorage.getItem('email');

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
  this.goHome();              
  this.loadBogoProducts();    
  this.loadSalesDashboard();
}


  goHome() {
  this.activeTab = 'home';
  this.showUsersSection = false;
}
getDisplayName(product: any) {
  return product.isBOGO ? `${product.name} (BOGO)` : product.name;
}

setTab(
  tab: 'home' | 'sales' | 'bogo' | 'reports' | 'users' | 'lastCustomers'
) {
  this.activeTab = tab;
  this.showUsersSection = false;

  switch (tab) {
    case 'home':
      break;

    case 'sales':
      setTimeout(() => {
        this.loadSalesDashboard();
      }, 50);
      break;

    case 'lastCustomers':
      this.loadLastFiveCustomers();
      break;

    case 'bogo':
      this.loadBogoProducts();
      break;
  }
}

  // ------ Users

  showUsers() {
    this.showUsersSection = true;
    this.activeTab = '';
    this.userTab = 'users';
    this.loadUsers();
    this.userTab = 'staff';
    this.loadSupportStaff();

  }

  loadUsers() {
    this.http.get<any[]>('https://localhost:7155/api/Users')
      .subscribe(data => {
        this.users = data;

        this.mainUsers = data.filter(u =>
          u.role === 'Admin' ||
          u.role === 'Cashier' ||
          u.role === 'Inventory Manager'
        );

        // SUPPORT STAFF TAB
        this.supportStaffList = data.filter(u =>
          u.role === 'Helper' ||
          u.role === 'Watchman'
        );
      });
  }

  addUser() {
    this.http.post('https://localhost:7155/api/Users/add', this.newUser)
      .subscribe(() => {
        this.newUser = {
          email: '',
          password: '',
          role: 'Cashier',
          salary: 0,
          isActive: true
        };
        this.loadUsers();
      });
  }

  deleteUser(id: number) {
    if (!confirm('Delete this user?')) return;

    this.http
      .delete(`https://localhost:7155/api/Users/delete/${id}`)
      .subscribe(() => this.loadUsers());
  }

  /* ===== SUPPORT STAFF ===== */

  addSupportStaff() {
  this.http.post(
    'https://localhost:7155/api/Users/add-support-staff',
    this.supportStaff
  ).subscribe(() => {
    this.supportStaff = {
      name: '',
      role: 'Helper',
      salary: 0
    };
    this.loadUsers();
  });
}

loadSupportStaff() {
  this.http
    .get<any[]>('https://localhost:7155/api/Users/support-staff')
    .subscribe(data => {
      this.supportStaffList = data;
    });
}
lastFiveCustomers: any[] = [];

openLastCustomers() {
  this.activeTab = 'lastCustomers';
  this.showUsersSection = false;
  this.loadLastFiveCustomers();   
}



apiUrl = 'https://localhost:7155/api';

loadBogoProducts() {
  this.http.get<any[]>(`${this.apiUrl}/products`)
    .subscribe({
      next: (data) => {
        this.bogoProducts = data.filter(
          product => product.stockQty > 100
        );
      },
      error: (err) => {
        console.error('Failed to load BOGO products', err);
      }
    });
}

enableBOGO(id: number) {
  this.http.put(`${this.apiUrl}/products/set-bogo/${id}`, {})
    .subscribe(() => this.loadBogoProducts());
}

disableBOGO(id: number) {
  this.http.put(`${this.apiUrl}/products/remove-bogo/${id}`, {})
    .subscribe(() => this.loadBogoProducts());
}
loadLastFiveCustomers() {
  this.http
    .get<any[]>('https://localhost:7155/api/Invoices/last-five-customers')
    .subscribe(data => {
      this.lastFiveCustomers = [];           
      setTimeout(() => {
        this.lastFiveCustomers = data;
      }, 0);
    });
}
trackByIndex(index: number) {
  return index;
}


  /* ===== DASHBOARD ===== */

  loadSalesDashboard() {

  this.http.get<any>('https://localhost:7155/api/Reports/total')
    .subscribe(res => this.totalSales = res.totalSales ?? 0);

  this.http.get<any[]>('https://localhost:7155/api/Invoices')
    .subscribe(invoices => this.totalOrders = invoices.length);

  this.http.get<any[]>('https://localhost:7155/api/Customers')
    .subscribe(customers => this.totalCustomers = customers.length);

  this.loadWeeklySales();
  this.loadSupplierShare();
  this.loadCategorySales();
  this.loadPaymentSummary();
}

  loadWeeklySales() {
    this.http.get<any[]>('https://localhost:7155/api/Reports/sales/weekly-daily')
      .subscribe(data => {
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const values = [0, 0, 0, 0, 0, 0, 0];

        data.forEach(d => values[d.day - 1] = d.total);

        this.renderWeeklyChart(labels, values, 'Weekly Sales', 'weeklyChart');
      });
  }

  renderWeeklyChart(labels: string[], data: number[], label: string, chartId: string) {
    const ctx = document.getElementById(chartId) as HTMLCanvasElement;
    if (!ctx) return;

    if (this.weeklyChart) this.weeklyChart.destroy();

    this.weeklyChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label, data, fill: true, tension: 0.3 }] }
    });
  }

  loadSupplierShare() {
    this.http.get<any[]>('https://localhost:7155/api/Suppliers')
      .subscribe(data =>
        this.renderSupplierPie(
          data.map(x => x.name),
          data.map(x => x.amountPaid)
        )
      );
  }

  renderSupplierPie(labels: string[], data: number[]) {
    if (this.supplierChart) this.supplierChart.destroy();

    this.supplierChart = new Chart('supplierChart', {
      type: 'pie',
      data: { labels, datasets: [{ data }] }
    });
  }

  loadCategorySales() {
    this.http.get<any[]>('https://localhost:7155/api/Categories/sales/category')
      .subscribe(data =>
        this.renderBarChart(
          data.map(x => x.category),
          data.map(x => x.totalSales),
          'Category Sales',
          'categoryChart'
        )
      );
  }

  renderBarChart(labels: string[], data: number[], label: string, chartId: string) {
    const ctx = document.getElementById(chartId) as HTMLCanvasElement;
    if (!ctx) return;

    if (this.categoryChart) this.categoryChart.destroy();

    this.categoryChart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label, data }] }
    });
  }

  loadPaymentSummary() {
    this.http.get<any[]>('https://localhost:7155/api/Invoices/payment-summary')
      .subscribe(data =>
        this.renderPaymentPie(
          data.map(x => x.paymentType),
          data.map(x => x.totalAmount)
        )
      );
  }

  renderPaymentPie(labels: string[], data: number[]) {
    if (this.paymentChart) this.paymentChart.destroy();

    this.paymentChart = new Chart('paymentChart', {
      type: 'pie',
      data: { labels, datasets: [{ data }] }
    });
  }

  

  /* ===== REPORTS ===== */

  downloadInvoicesPdf() {
    window.open('https://localhost:7155/api/reports/invoices/pdf', '_blank');
  }

  downloadSupplierPdf() {
    window.open('https://localhost:7155/api/reports/suppliers/pdf', '_blank');
  }

  downloadLowStock() {
    window.open('https://localhost:7155/api/Reports/inventory-status/pdf', '_blank');
  }

  downloadProfitLoss() {
    window.open('https://localhost:7155/api/reports/profit-loss/pdf', '_blank');
  }

  downloadBogo() {
    window.open('https://localhost:7155/api/reports/bogo/pdf', '_blank');
  }

  downloadLabourSales() {
    window.open('https://localhost:7155/api/Reports/labour-sales/pdf', '_blank');
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}

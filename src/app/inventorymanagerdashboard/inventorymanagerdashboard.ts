import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';


@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventorymanagerdashboard.html',
  styleUrls: ['./inventorymanagerdashboard.css']
})
export class InventoryDashboardComponent implements OnInit, OnDestroy {

  apiUrl = 'https://localhost:7155/api';

  activeTab: string = 'home';
  

  categories: any[] = [];
  suppliers: any[] = [];
  products: any[] = [];

  newCategory = { name: '', description: '' };
  editingSupplier: any = null;
  editingCategory: any = null;

  newSupplier = {
    name: '',
    email: '',
    phone: '',
    address: '',
    amountPaid:0
  };

  editingProduct: any = null;
  newProduct = {
    name: '',
    categoryId: 0,
    supplierId: 0,
    unitPrice: 0,
    stockQty: 0,
    expiryDate: ''
  };
  customerTransactions: any[] = [];
  supplierTransactions: any[] = [];
  
  

  selectedProduct: any = null;
  selectedImage: File | null = null;

onImageSelected(event: any) {
  this.selectedImage = event.target.files[0];
}

selectProductForRefill(product: any) {
  this.selectedProduct = product;
}

getStockPercent(stock: number): number {
  const max = 100; // or calculate from max stock
  return Math.min((stock / max) * 100, 100);
}



  // ⏱️ Session Timeout UI
  sessionTimeout = 60;        // countdown seconds
  showTimeoutPopup = false;  // controls UI visibility

  private inactivityTimer: any;
  private countdownTimer: any;


  stockSettings: any = {}; 
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadCategories();
    this.loadSuppliers();
    this.loadProducts();
    this.loadCustomerTransactions();
    this.loadSupplierTransactions();
    this.startInactivityTimer();
  }

  ngOnDestroy() {
  this.clearTimers();
}


  startInactivityTimer() {
  this.clearTimers();

  // After 1 minute of inactivity → show popup
  this.inactivityTimer = setTimeout(() => {
    this.showTimeoutPopup = true;
    this.startCountdown();
  }, 60 * 1000);
}

startCountdown() {
  this.sessionTimeout = 60;

  this.countdownTimer = setInterval(() => {
    this.sessionTimeout--;

    if (this.sessionTimeout <= 0) {
      this.logout();
    }
  }, 1000);
}

continueSession() {
  this.showTimeoutPopup = false;
  this.startInactivityTimer();
}

clearTimers() {
  clearTimeout(this.inactivityTimer);
  clearInterval(this.countdownTimer);
}


@HostListener('document:mousemove')
@HostListener('document:keydown')
@HostListener('document:click')
@HostListener('document:touchstart')
handleUserActivity() {
  if (this.showTimeoutPopup) {
    this.showTimeoutPopup = false;
  }
  this.startInactivityTimer();
}


  get headers() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    };
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }

  loadCategories() {
    this.http.get<any[]>(`${this.apiUrl}/categories`)
      .subscribe(res => this.categories = res);
  }

  getCategoryName(categoryId: number): string {
  const category = this.categories.find(c => c.categoryId === categoryId);
  return category ? category.name : 'N/A';
  }

  addCategory() {
    if (!this.newCategory.name) return;

    this.http.post(`${this.apiUrl}/categories`, this.newCategory, this.headers)
      .subscribe(() => {
        this.newCategory = { name: '', description: '' };
        this.loadCategories();
      });
  }

  editCategory(category: any) {
  this.editingCategory = { ...category };
}

updateCategory() {
  if (!this.editingCategory) return;

  this.http.put(
    `${this.apiUrl}/categories/${this.editingCategory.categoryId}`,
    this.editingCategory,
    this.headers
  ).subscribe(() => {
    this.editingCategory = null;
    this.loadCategories();
  });
}

cancelCategoryEdit() {
  this.editingCategory = null;
}

deleteCategory(categoryId: number) {
  if (!confirm('Are you sure you want to delete this category?')) return;

  this.http.delete(
    `${this.apiUrl}/categories/${categoryId}`,
    this.headers
  ).subscribe(() => {
    this.loadCategories();
  });
}


  loadSuppliers() {
    this.http.get<any[]>(`${this.apiUrl}/suppliers`)
      .subscribe(res => this.suppliers = res);
  }

  getSupplierName(supplierId: number): string {
  const supplier = this.suppliers.find(s => s.supplierId === supplierId);
  return supplier ? supplier.name : 'N/A';
  }

  addSupplier() {
    if (!this.newSupplier.name || !this.newSupplier.phone) return;

    this.http.post(`${this.apiUrl}/suppliers`, this.newSupplier, this.headers)
      .subscribe(() => {
        this.newSupplier = { name: '', email: '', phone: '', address: '' , amountPaid:0};
        this.loadSuppliers();
      });
  }

  editSupplier(supplier: any) {
  this.editingSupplier = { ...supplier }; 
}

updateSupplier() {
  if (!this.editingSupplier) return;

  this.http.put(
    `${this.apiUrl}/suppliers/${this.editingSupplier.supplierId}`,
    this.editingSupplier,
    this.headers
  ).subscribe(() => {
    this.editingSupplier = null;
    this.loadSuppliers();
  });
}

cancelEdit() {
  this.editingSupplier = null;
}

deleteSupplier(id: number) {
  if (!confirm('Are you sure you want to delete this supplier?')) return;

  this.http.delete(`${this.apiUrl}/suppliers/${id}`, this.headers)
    .subscribe(() => {
      this.loadSuppliers();
    });
}



  loadProducts() {
    this.http.get<any[]>(`${this.apiUrl}/products`)
      .subscribe(res => {
        this.products = res;

        // init reorder levels if not present
        this.products.forEach(p => {
          if (!this.stockSettings[p.productId]) {
            this.stockSettings[p.productId] = 5; // default
          }
        });
      });
  }

loadCustomerTransactions() {
  this.http.get<any[]>(`${this.apiUrl}/invoices/customer-transaction-summary`, this.headers)
    .subscribe(res => this.customerTransactions = res);
}


loadSupplierTransactions() {
  this.http.get<any[]>(`${this.apiUrl}/suppliers/transaction-summary`, this.headers)
    .subscribe(res => this.supplierTransactions = res);
}

  getReorderLevel(productId: number): number {
    return this.stockSettings[productId] || 5;
  }

  setReorderLevel(productId: number, level: number) {
    this.stockSettings[productId] = level;
  }

  // 🔴 Exact Out-of-Stock
  get outOfStockProducts() {
    return this.products.filter(p => p.stockQty === 0);
  }

  // 🟠 Exact Low-Stock
  get lowStockProducts() {
    return this.products.filter(p =>
      p.stockQty > 0 &&
      p.stockQty <= this.getReorderLevel(p.productId)
    );
  }

  // 📊 Bar graph height (exact proportional)
  getBarHeight(stockQty: number): number {
    return stockQty * 6; // scale factor
  }

  // 🔁 Refill
  refill(product: any) {
  const refillQty = this.getReorderLevel(product.productId);

  this.http.put(
    `${this.apiUrl}/products/refill/${product.productId}?qty=${refillQty}`,
    {},
    this.headers
  ).subscribe(() => {
    product.stockQty += refillQty; // instant UI update
  });
}

  // 🔹 Status text
  getStockStatus(p: any): string {
    const rl = this.getReorderLevel(p.productId);

    if (p.stockQty === 0) return 'Out of Stock';
    if (p.stockQty <= rl) return 'Low Stock';
    return 'OK';
  }
  getStockColor(qty: number): string {
  if (qty > 50) return 'bar-green';
  if (qty > 20) return 'bar-yellow';
  return 'bar-red';
}

getStockWidth(qty: number): number {
  const max = 100; // adjust if needed
  return Math.min((qty / max) * 100, 100);
}


  logout() {
  localStorage.removeItem('token'); // remove user token
  // redirect to login page (replace '/login' with your route)
  window.location.href = '/login';
}
}

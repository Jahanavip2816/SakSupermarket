import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-cashier-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
  ],
  templateUrl: './cashierdashboard-component.html',
  styleUrls: ['./cashierdashboard-component.css']
})
export class CashierDashboardComponent implements OnInit {

  apiUrl = 'https://localhost:7155/api';

  activeTab: 'home' | 'customers' | 'products' | 'billing' | 'invoice' = 'home';

  customers: any[] = [];
  newCustomer = {
    name: '',
    email: '',
    phone: '',
    address: ''
  };
  customerSearchText='';

  products: any[] = [];
  newProduct = {
    name: '',
    categoryId: 0,
    supplierId: 0,
    unitPrice: 0,
    stockQty: 0
  };
  isEditMode = false;
  editingProductId: number | null = null;
  productSearchText = '';
  selectedCategoryFilter = 0;
  isPriceSorted = false;

  categories: any[] = [];
  suppliers: any[] = [];
  allProducts: any[] = [];       // Backup copy


  //selectedProductImage!: File;
  selectedProductImage: File | null = null;   // can be null if no file selected
  selectedProductId: number | null = null;    // tracks product being edited

  productImagePreview: string | ArrayBuffer | null = null;

  cart: any[] = [];

  selectedCustomerId: number | null = null;
  discount = 0;
  paymentType = 'Cash';

  showInvoice = false;
  invoice: any = {};
  

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
  this.http.get<any[]>(`${this.apiUrl}/categories`).subscribe(res => this.categories = res);
  this.http.get<any[]>(`${this.apiUrl}/suppliers`).subscribe(res => this.suppliers = res);

  this.loadProducts();   
  this.loadCustomers();  
}


  loadCustomers() {
    this.http.get<any[]>(`${this.apiUrl}/customers`)
      .subscribe({
        next: res => this.customers = res,
        error: err => console.error('Customer load error', err)
      });
  }

  loadProducts() {
  this.http.get<any[]>(`${this.apiUrl}/products`)
    .subscribe({
      next: res => {
        this.allProducts = res;        
        this.products = [...res];      
      },
      error: err => console.error('Product load error', err)
    });
}


  addCustomer() {
    this.http.post(`${this.apiUrl}/customers`, this.newCustomer)
      .subscribe({
        next: () => {
          this.loadCustomers();
          this.newCustomer = { name: '', email: '', phone: '', address: '' };
        },
        error: err => console.error('Add customer error', err)
      });
  }

  editCustomer(customer: any) {
  // Pre-fill form for editing
  this.newCustomer = { 
    name: customer.name, 
    email: customer.email, 
    phone: customer.phone, 
    address: customer.address 
  };
  this.selectedCustomerId = customer.customerId;
}

updateCustomer() {
  if (!this.selectedCustomerId) return;

  this.http.put(`${this.apiUrl}/customers/${this.selectedCustomerId}`, this.newCustomer)
    .subscribe({
      next: () => {
        alert('Customer updated successfully');
        this.loadCustomers();
        this.newCustomer = { name: '', email: '', phone: '', address: '' };
        this.selectedCustomerId = null;
      },
      error: err => console.error('Update customer error', err)
    });
}
get filteredCustomers() {
  return this.customers.filter(c =>
    (c.name + c.email + c.phone)
      .toLowerCase()
      .includes(this.customerSearchText.toLowerCase())
  );
}

deleteCustomer(customerId: number) {
  if (!confirm('Are you sure you want to delete this customer?')) return;

  this.http.delete(`${this.apiUrl}/customers/${customerId}`)
    .subscribe({
      next: () => {
        alert('Customer deleted');
        this.loadCustomers();
      },
      error: err => console.error('Delete customer error', err)
    });
}

  addProduct() {
  const formData = new FormData();

  formData.append('name', this.newProduct.name);
  formData.append('categoryId', this.newProduct.categoryId.toString());
  formData.append('supplierId', this.newProduct.supplierId.toString());
  formData.append('unitPrice', this.newProduct.unitPrice.toString());

  if (!this.isEditMode) {
    formData.append('stockQty', this.newProduct.stockQty.toString());
  }

  if (this.selectedProductImage) {
    formData.append('imageFile', this.selectedProductImage);
  }

  if (!this.isEditMode) {
    this.http.post(`${this.apiUrl}/products`, formData).subscribe(() => {
      this.resetProductForm();
      this.loadProducts();
    });
  }
  else {
    this.http.put(
      `${this.apiUrl}/products/${this.editingProductId}`,
      formData
    ).subscribe(() => {
      this.resetProductForm();
      this.loadProducts();
    });
  }
}

resetProductForm() {
  this.isEditMode = false;
  this.editingProductId = null;

  this.newProduct = {
    name: '',
    categoryId: 0,
    supplierId: 0,
    unitPrice: 0,
    stockQty: 0
  };

  this.productImagePreview = null;
  this.selectedProductImage = null;
}



editProduct(product: any) {
  this.isEditMode = true;
  this.editingProductId = product.productId;

  this.newProduct = {
    name: product.name,
    categoryId: product.categoryId,
    supplierId: product.supplierId,
    unitPrice: product.unitPrice,
    stockQty: product.stockQty // shown but NOT editable
  };

  this.productImagePreview = product.imageUrl
    ? 'https://localhost:7155' + product.imageUrl
    : null;
}


updateProduct() {
  if (this.selectedProductId === null) return; // ensure a product is selected

  const formData = new FormData();
  formData.append('name', this.newProduct.name);
  formData.append('categoryId', this.newProduct.categoryId.toString());
  formData.append('supplierId', this.newProduct.supplierId.toString());
  formData.append('unitPrice', this.newProduct.unitPrice.toString());
  if (this.selectedProductImage) {
    formData.append('imageFile', this.selectedProductImage);
  }

  this.http.put(`${this.apiUrl}/products/${this.selectedProductId}`, formData)
    .subscribe({
      next: () => {
        alert('Product updated successfully');
        this.loadProducts();
        this.newProduct = { name: '', categoryId: 0, supplierId: 0, unitPrice: 0, stockQty: 0 };
        this.productImagePreview = null;
        this.selectedProductImage = null;
        this.selectedProductId = null;
      },
      error: err => console.error('Update product error', err)
    });
}


deleteProduct(productId: number) {
  if (!confirm('Are you sure you want to delete this product?')) {
    return;
  }

  this.http.delete(`${this.apiUrl}/products/${productId}`)
    .subscribe({
      next: () => {
        alert('Product deleted');
        this.loadProducts();
      },
      error: err => console.error('Delete error', err)
    });
}

get filteredProducts() {
  let result = [...this.allProducts]; 

  // 🔍 Search
  if (this.productSearchText) {
    result = result.filter(p =>
      p.name?.toLowerCase().includes(this.productSearchText.toLowerCase())
    );
  }

  // 🗂 Category filter
  if (this.selectedCategoryFilter !== 0) {
  result = result.filter(
    p => p.categoryId === Number(this.selectedCategoryFilter)
  );
}

  // 🔃 Sort
  if (this.isPriceSorted) {
    result.sort((a, b) => a.unitPrice - b.unitPrice);
  }

  return result;
}
resetFilters() {
  this.productSearchText = '';
  this.selectedCategoryFilter = 0;
  this.isPriceSorted = false;
}

sortLowToHigh() {
  this.isPriceSorted = true;
}

addToCart(product: any) {

  if (product.stockQty <= 0) {
    alert(`❌ ${product.name} is out of stock`);

    this.http.post(`${this.apiUrl}/notifications`, {
      message: `${product.name} is OUT OF STOCK`,
      productId: product.productId,
      role: 'InventoryManager'
    }).subscribe();

    return;
  }

  const existing = this.cart.find(p => p.productId === product.productId);

  /* 🎁 BOGO LOGIC */
  if (product.isBOGO) {

    // Need at least 2 stock for BOGO
    if (product.stockQty < 2) {
      alert('Not enough stock for BOGO');
      return;
    }

    if (existing) {
      existing.qty += 2;
    } else {
      this.cart.push({
        productId: product.productId,
        name: product.name + ' (BOGO)',
        qty: 2,                 
        unitPrice: product.unitPrice,
        total: product.unitPrice 
      });
    }

    product.stockQty -= 2; 
  }

  else {

    if (existing) {
      if (product.stockQty < 1) {
        alert('No more stock available');
        return;
      }

      existing.qty++;
      existing.total = existing.qty * existing.unitPrice;
    } else {
      this.cart.push({
        productId: product.productId,
        name: product.name,
        qty: 1,
        unitPrice: product.unitPrice,
        total: product.unitPrice
      });
    }

    product.stockQty--;
  }
}

  removeFromCart(index: number) {
    this.cart.splice(index, 1);
  }

  get subtotal() {
    return this.cart.reduce((sum, item) => sum + item.total, 0);
  }

  get netAmount() {
    return this.subtotal - (this.discount || 0);
  }

  generateInvoice() {

  if (this.cart.length === 0) {
    alert('Cart is empty');
    return;
  }

  const customer =
    this.customers.find(c => c.customerId === this.selectedCustomerId) ||
    { customerId: null, name: 'Walk-in Customer' };

  const invoicePayload = {
    customerId: customer.customerId,
    customerName: customer.name,
    date: new Date(),
    subtotal: this.subtotal,
    discount: this.discount,
    netAmount: this.netAmount,
    paymentType: this.paymentType,
    items: this.cart.map(item => ({
      productId: item.productId,
      name: item.name,
      qty: item.qty,
      unitPrice: item.unitPrice,
      total: item.total
    }))
  };

  this.http.post<any>(`${this.apiUrl}/invoices`, invoicePayload)
    .subscribe({
      next: res => {
        this.invoice = res;         
        this.showInvoice = true;
        this.activeTab = 'invoice';

        this.cart.forEach(item => {
          this.reduceStock(item.productId, item.qty).subscribe();
        });

        this.cart = [];
        this.discount = 0;
        this.selectedCustomerId = null;

        this.loadProducts();
      },
      error: err => console.error('Invoice error', err)
    });
      this.cart.forEach(item => {
    this.http.put(`${this.apiUrl}/products/reduce-stock/${item.productId}`, {
      qty: item.qty
    }).subscribe();
  });
  }


  reduceStock(productId: number, qty: number) {
  return this.http.put(
    `${this.apiUrl}/products/reduce-stock/${productId}?quantity=${qty}`,
    {}
  );
}

  onProductImageSelected(event: any) {
  const file: File | null = event.target.files[0] ?? null;

  if (file) { // only proceed if file exists
    this.selectedProductImage = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.productImagePreview = reader.result;
    };
    reader.readAsDataURL(file); 
  } else {
    this.selectedProductImage = null;
    this.productImagePreview = null;
  }
}
  goToInvoice() {
    if (this.showInvoice) {
      this.activeTab = 'invoice';
    }
  }

  logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

  private apiUrl = 'https://localhost:5001/api/invoices';

  constructor(private http: HttpClient) {}

  generateInvoice(invoice: any) {
    return this.http.post(`${this.apiUrl}/generate`, invoice);
  }
}

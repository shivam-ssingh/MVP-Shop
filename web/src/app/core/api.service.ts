import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Category,
  CreateOrderRequest,
  OrderRequestDetail,
  OrderRequestSummary,
  Product,
  RequestStatus,
} from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  categories() {
    return this.http.get<Category[]>('/api/categories');
  }

  searchProducts(categoryId: number, q: string) {
    const params = new HttpParams().set('categoryId', categoryId).set('q', q);
    return this.http.get<Product[]>('/api/products', { params });
  }

  submitRequest(body: CreateOrderRequest) {
    return this.http.post<OrderRequestSummary>('/api/order-requests', body);
  }

  myRequests() {
    return this.http.get<OrderRequestSummary[]>('/api/order-requests/mine');
  }

  allRequests() {
    return this.http.get<OrderRequestSummary[]>('/api/order-requests');
  }

  request(id: number) {
    return this.http.get<OrderRequestDetail>(`/api/order-requests/${id}`);
  }

  setStatus(id: number, status: RequestStatus) {
    return this.http.patch<OrderRequestDetail>(`/api/order-requests/${id}/status`, { status });
  }
}

// Mirrors the DTOs in api/Dtos/Dtos.cs

export type Role = 'Staff' | 'Manager';
export type RequestStatus = 'Submitted' | 'Seen' | 'Ordered';
export type NotificationType = 'NewRequest' | 'RequestSeen' | 'RequestOrdered';

export interface User {
  id: number;
  name: string;
  username: string;
  role: Role;
}

export interface Category {
  id: number;
  name: string;
  icon: string;
  productCount: number;
}

export interface Product {
  id: number;
  name: string;
  size: string;
  categoryId: number;
}

export interface CreateOrderRequestItem {
  productId: number | null;
  freeTextName: string | null;
  qtyLeft: number;
  note: string | null;
}

export interface CreateOrderRequest {
  categoryId: number;
  note: string | null;
  items: CreateOrderRequestItem[];
}

export interface OrderRequestSummary {
  id: number;
  staffName: string;
  categoryId: number;
  categoryName: string;
  categoryIcon: string;
  status: RequestStatus;
  itemCount: number;
  createdAt: string;
  seenAt: string | null;
  orderedAt: string | null;
}

export interface OrderRequestItem {
  id: number;
  productId: number | null;
  name: string;
  size: string | null;
  isFreeText: boolean;
  qtyLeft: number;
  note: string | null;
}

export interface OrderRequestDetail extends Omit<OrderRequestSummary, 'itemCount'> {
  note: string | null;
  items: OrderRequestItem[];
}

export interface AppNotification {
  id: number;
  type: NotificationType;
  message: string;
  orderRequestId: number;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationList {
  unreadCount: number;
  items: AppNotification[];
}

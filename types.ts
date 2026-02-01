
export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  featured?: boolean;
  reviews?: Review[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone?: string;
  shippingAddress?: string;
  city?: string;
  zipCode?: string;
  items: CartItem[];
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  trackingNumber?: string;
  carrier?: string;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  zipCode: string;
  isDefault: boolean;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: UserRole;
  createdAt: string;
  addresses?: Address[];
}

export interface SalesData {
  name: string;
  sales: number;
  orders: number;
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

export interface AppState {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  users: UserAccount[];
  userRole: UserRole;
}

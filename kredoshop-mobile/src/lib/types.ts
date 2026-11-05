export type SizeDetail = { id: number; sizeName: string; quantity: number };
export type Category = { id: number; name: string };
export type Product = {
  id: number;
  name: string;
  price: number;
  costPrice?: number;
  discountAmount?: number;
  quantity?: number;
  rating?: number;
  status?: string;
  imageUrlFront?: string;
  imageUrlBack?: string;
  description?: string;
  category?: Category;
  sizeDetails?: SizeDetail[];
  soldQuantity?: number;
  updatedAt?: string;
};
export type User = { id: number; username?: string; [k: string]: unknown };
export type CartItem = {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  priceAtTime: number;
  subtotal: number;
  selected: boolean;
  sizeName?: string;
  size?: string;
};
export type Address = {
  id: number;
  delivery_address: string;
  province: string;
  city?: string;
  ward?: string;
  delivery_note?: string;
};
export type OrderDetail = {
  id: number;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
};
export type Order = {
  id: number;
  orderCode?: string;
  orderDate: string;
  statusOrder: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
  paymentMethod?: string;
  orderDetails: OrderDetail[];
  customerTrading?: {
    receiverName?: string;
    receiverPhone?: string;
    receiverAddress?: string;
    totalAmount?: number;
  };
};
export type Wishlist = { id: number; name: string; description?: string; itemCount?: number };

export type UserRole = 'admin' | 'courier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  courierId?: string; // Connected courier ID if role is 'courier'
}

export type OrderStatus =
  | 'PLACED'           // Novo pedido recebido (iFood / Manual)
  | 'CONFIRMED'        // Confirmado pelo restaurante
  | 'PREPARING'        // Em preparo na cozinha
  | 'READY_FOR_PICKUP' // Pronto para retirada
  | 'DISPATCHED'       // Atribuído e aguardando coleta
  | 'IN_TRANSIT'       // Entregador a caminho do cliente
  | 'DELIVERED'        // Entregue
  | 'CANCELLED';       // Cancelado

export type OrderOrigin = 'iFood' | 'Manual' | 'WhatsApp';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface DeliveryAddress {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  complement?: string;
  lat: number;
  lng: number;
  postalCode?: string;
}

export interface Order {
  id: string;
  displayId: string; // Ex: #iFood-8492
  customerName: string;
  customerPhone: string;
  deliveryAddress: DeliveryAddress;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  origin: OrderOrigin;
  createdAt: string;
  updatedAt: string;
  assignedCourierId?: string;
  assignedCourierName?: string;
  assignedCourierPhone?: string;
  estimatedDeliveryMinutes?: number;
  paymentMethod: 'Online iFood' | 'Cartão Entrega' | 'Dinheiro na Entrega';
  verificationCode?: string; // Código de confirmação de entrega do iFood (ex: 4 dígitos do telefone)
}

export interface Courier {
  id: string;
  name: string;
  phone: string;
  cpf?: string;
  vehicle: 'Moto' | 'Bicicleta' | 'Carro' | 'Patinete';
  plate?: string;
  isOnline: boolean;
  currentLat: number;
  currentLng: number;
  lastLocationUpdate: string;
  activeOrderId?: string;
  rating: number; // Ex: 4.9
  deliveriesTodayCount: number;
  earningsToday: number; // Ex: R$ 148,50
  batteryLevel?: number;
  avatarUrl?: string;
}

export interface StoreInfo {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  isOpen: boolean;
}

export interface IFoodConfig {
  merchantId: string;
  clientId: string;
  clientSecret: string;
  webhookUrl: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'AUTHENTICATING';
  lastPollingAt?: string;
  autoAcceptOrders: boolean;
  environment: 'SANDBOX' | 'PRODUCTION';
}

export interface IFoodWebhookPayload {
  eventId: string;
  code: 'ORDER_CREATED' | 'ORDER_PREPARING' | 'ORDER_READY' | 'ORDER_DISPATCHED' | 'ORDER_DELIVERED';
  fullCode: string;
  merchantId: string;
  orderId: string;
  createdAt: string;
  orderData?: Partial<Order>;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

// WebSocket Event Payloads
export type WSEvent =
  | { type: 'AUTH_HANDSHAKE'; data: { token: string } }
  | { type: 'AUTH_ERROR'; data: { message: string } }
  | { type: 'INIT_STATE'; data: { orders: Order[]; couriers: Courier[]; storeInfo: StoreInfo; ifoodConfig: IFoodConfig } }
  | { type: 'LOCATION_UPDATE'; data: { courierId: string; lat: number; lng: number; batteryLevel?: number }; token?: string }
  | { type: 'COURIER_STATUS_TOGGLE'; data: { courierId: string; isOnline: boolean }; token?: string }
  | { type: 'ASSIGN_ORDER'; data: { orderId: string; courierId: string }; token?: string }
  | { type: 'UPDATE_ORDER_STATUS'; data: { orderId: string; status: OrderStatus }; token?: string }
  | { type: 'NEW_ORDER'; data: Order }
  | { type: 'IFOOD_WEBHOOK_RECEIVED'; data: IFoodWebhookPayload }
  | { type: 'CREATE_COURIER'; data: Courier; token?: string }
  | { type: 'UPDATE_COURIER'; data: Courier; token?: string }
  | { type: 'DELETE_COURIER'; data: { courierId: string }; token?: string };



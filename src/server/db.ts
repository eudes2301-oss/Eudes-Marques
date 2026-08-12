import fs from "fs";
import path from "path";
import { Order, Courier, StoreInfo, IFoodConfig } from "../types.js";

export interface DBState {
  orders: Order[];
  couriers: Courier[];
  storeInfo: StoreInfo;
  ifoodConfig: IFoodConfig;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

// Initial Seed Data
const defaultStoreInfo: StoreInfo = {
  id: "store-sp-01",
  name: "iFood Hub Logistics - Pinheiros SP",
  address: "Rua Teodoro Sampaio, 1400 - Pinheiros, São Paulo - SP",
  lat: -23.561684,
  lng: -46.688123,
  phone: "(11) 98888-7766",
  isOpen: true,
};

const defaultCouriers: Courier[] = [
  {
    id: "courier-1",
    name: "João Silva",
    phone: "(11) 97123-4567",
    vehicle: "Moto",
    plate: "ABC-1D23",
    isOnline: true,
    currentLat: -23.559212,
    currentLng: -46.684532,
    lastLocationUpdate: new Date().toISOString(),
    rating: 4.9,
    deliveriesTodayCount: 12,
    batteryLevel: 88,
    earningsToday: 148.50,
    activeOrderId: "ord-103",
  },
  {
    id: "courier-2",
    name: "Carlos Oliveira",
    phone: "(11) 98234-5678",
    vehicle: "Moto",
    plate: "XYZ-9E87",
    isOnline: true,
    currentLat: -23.565401,
    currentLng: -46.691204,
    lastLocationUpdate: new Date().toISOString(),
    rating: 4.8,
    deliveriesTodayCount: 8,
    batteryLevel: 64,
    earningsToday: 98.00,
  },
  {
    id: "courier-3",
    name: "Ana Souza",
    phone: "(11) 99345-6789",
    vehicle: "Bicicleta",
    isOnline: false,
    currentLat: -23.557890,
    currentLng: -46.682100,
    lastLocationUpdate: new Date().toISOString(),
    rating: 5.0,
    deliveriesTodayCount: 5,
    batteryLevel: 95,
    earningsToday: 62.50,
  },
  {
    id: "courier-4",
    name: "Marcos Lima",
    phone: "(11) 96456-7890",
    vehicle: "Carro",
    plate: "KML-4F56",
    isOnline: true,
    currentLat: -23.568102,
    currentLng: -46.680451,
    lastLocationUpdate: new Date().toISOString(),
    rating: 4.7,
    deliveriesTodayCount: 15,
    batteryLevel: 42,
    earningsToday: 210.00,
  },
];

const defaultIfoodConfig: IFoodConfig = {
  merchantId: process.env.IFOOD_MERCHANT_ID || "merchant-sp-99812",
  clientId: process.env.IFOOD_CLIENT_ID || "ifood-developer-client-id-sample",
  clientSecret: process.env.IFOOD_CLIENT_SECRET || "ifood_secret_key_prod_sample",
  webhookUrl: `https://app.logistica.com/api/ifood/webhook`,
  status: "CONNECTED",
  lastPollingAt: new Date().toISOString(),
  autoAcceptOrders: false,
  environment: "SANDBOX",
};

const defaultOrders: Order[] = [
  {
    id: "ord-101",
    displayId: "#iFood-7821",
    customerName: "Mariana Costa",
    customerPhone: "(11) 98111-2233",
    deliveryAddress: {
      street: "Rua Fradique Coutinho",
      number: "520",
      neighborhood: "Vila Madalena",
      city: "São Paulo",
      lat: -23.555902,
      lng: -46.689211,
    },
    items: [
      { id: "item-1", name: "Hamburguer Smash Duplo Bacon", quantity: 2, unitPrice: 38.90 },
      { id: "item-2", name: "Batata Frita Rústica G", quantity: 1, unitPrice: 22.00 },
      { id: "item-3", name: "Refrigerante Coca-Cola Zero 350ml", quantity: 2, unitPrice: 7.50 },
    ],
    totalAmount: 114.80,
    status: "PLACED",
    origin: "iFood",
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    paymentMethod: "Online iFood",
    verificationCode: "4821",
  },
  {
    id: "ord-102",
    displayId: "#iFood-7822",
    customerName: "Lucas Mendes",
    customerPhone: "(11) 97222-3344",
    deliveryAddress: {
      street: "Alameda Gabriel Monteiro da Silva",
      number: "1105",
      neighborhood: "Jardim Paulistano",
      city: "São Paulo",
      lat: -23.570231,
      lng: -46.681944,
    },
    items: [
      { id: "item-4", name: "Pizza Artesanal Margherita 35cm", quantity: 1, unitPrice: 65.00 },
      { id: "item-5", name: "Suco Natural de Laranja 500ml", quantity: 2, unitPrice: 12.00 },
    ],
    totalAmount: 89.00,
    status: "READY_FOR_PICKUP",
    origin: "iFood",
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    paymentMethod: "Online iFood",
    verificationCode: "9102",
  },
  {
    id: "ord-103",
    displayId: "#iFood-7820",
    customerName: "Fernanda Lima",
    customerPhone: "(11) 96333-4455",
    deliveryAddress: {
      street: "Rua Mourato Coelho",
      number: "890",
      neighborhood: "Pinheiros",
      city: "São Paulo",
      lat: -23.559812,
      lng: -46.692340,
    },
    items: [
      { id: "item-6", name: "Poke Completo de Salmão", quantity: 1, unitPrice: 54.90 },
    ],
    totalAmount: 54.90,
    status: "IN_TRANSIT",
    origin: "iFood",
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    assignedCourierId: "courier-1",
    assignedCourierName: "João Silva",
    assignedCourierPhone: "(11) 97123-4567",
    paymentMethod: "Online iFood",
    verificationCode: "3381",
  },
];

class DB {
  private state: DBState;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.state = this.loadFromDisk();
  }

  private loadFromDisk(): DBState {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        console.log("💾 Persistent state loaded from data/store.json");
        return {
          orders: parsed.orders || defaultOrders,
          couriers: parsed.couriers || defaultCouriers,
          storeInfo: parsed.storeInfo || defaultStoreInfo,
          ifoodConfig: parsed.ifoodConfig || defaultIfoodConfig,
        };
      }
    } catch (err) {
      console.error("⚠️ Failed to load database file, initializing defaults:", err);
    }

    const initialState: DBState = {
      orders: defaultOrders,
      couriers: defaultCouriers,
      storeInfo: defaultStoreInfo,
      ifoodConfig: defaultIfoodConfig,
    };
    this.saveToDiskSync(initialState);
    return initialState;
  }

  private saveToDiskSync(data: DBState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("⚠️ Failed to write database file:", err);
    }
  }

  public save() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveToDiskSync(this.state);
    }, 100);
  }

  public getState(): DBState {
    return this.state;
  }

  public getOrders(): Order[] {
    return this.state.orders;
  }

  public getCouriers(): Courier[] {
    return this.state.couriers;
  }

  public getStoreInfo(): StoreInfo {
    return this.state.storeInfo;
  }

  public getIFoodConfig(): IFoodConfig {
    return this.state.ifoodConfig;
  }
}

export const db = new DB();

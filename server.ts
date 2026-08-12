import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import { Order, Courier, StoreInfo, IFoodConfig, WSEvent, OrderStatus, IFoodWebhookPayload } from "./src/types.js";

const app = express();
app.use(express.json());

const PORT = 3000;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Initial Store Information (Base Location: Pinheiros - São Paulo)
const storeInfo: StoreInfo = {
  id: "store-sp-01",
  name: "iFood Hub Logistics - Pinheiros SP",
  address: "Rua Teodoro Sampaio, 1400 - Pinheiros, São Paulo - SP",
  lat: -23.561684,
  lng: -46.688123,
  phone: "(11) 98888-7766",
  isOpen: true,
};

// Initial Couriers
let couriers: Courier[] = [
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
  },
];

// Initial iFood Config
const ifoodConfig: IFoodConfig = {
  merchantId: "merchant-sp-99812",
  clientId: "ifood-developer-client-id-sample",
  clientSecret: "••••••••••••••••••••••••",
  webhookUrl: `https://app.logistica.com/api/ifood/webhook`,
  status: "CONNECTED",
  lastPollingAt: new Date().toISOString(),
  autoAcceptOrders: false,
  environment: "SANDBOX",
};

// Initial Orders Queue
let orders: Order[] = [
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

// Link initial assigned order to courier
couriers[0].activeOrderId = "ord-103";

// Helper to broadcast WS messages
function broadcast(event: WSEvent) {
  const message = JSON.stringify(event);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// WebSocket Connection Logic
wss.on("connection", (ws) => {
  // Send current state to newly connected client
  const initStateMsg: WSEvent = {
    type: "INIT_STATE",
    data: { orders, couriers, storeInfo, ifoodConfig },
  };
  ws.send(JSON.stringify(initStateMsg));

  ws.on("message", (raw) => {
    try {
      const event: WSEvent = JSON.parse(raw.toString());

      if (event.type === "LOCATION_UPDATE") {
        const { courierId, lat, lng, batteryLevel } = event.data;
        const courier = couriers.find((c) => c.id === courierId);
        if (courier) {
          courier.currentLat = lat;
          courier.currentLng = lng;
          courier.lastLocationUpdate = new Date().toISOString();
          if (batteryLevel !== undefined) courier.batteryLevel = batteryLevel;
          broadcast({
            type: "LOCATION_UPDATE",
            data: { courierId, lat, lng, batteryLevel: courier.batteryLevel },
          });
        }
      } else if (event.type === "COURIER_STATUS_TOGGLE") {
        const { courierId, isOnline } = event.data;
        const courier = couriers.find((c) => c.id === courierId);
        if (courier) {
          courier.isOnline = isOnline;
          broadcast({ type: "COURIER_STATUS_TOGGLE", data: { courierId, isOnline } });
        }
      } else if (event.type === "ASSIGN_ORDER") {
        const { orderId, courierId } = event.data;
        const order = orders.find((o) => o.id === orderId);
        const courier = couriers.find((c) => c.id === courierId);

        if (order && courier) {
          order.assignedCourierId = courier.id;
          order.assignedCourierName = courier.name;
          order.assignedCourierPhone = courier.phone;
          order.status = "DISPATCHED";
          order.updatedAt = new Date().toISOString();

          courier.activeOrderId = order.id;

          broadcast({ type: "ASSIGN_ORDER", data: { orderId, courierId } });
        }
      } else if (event.type === "UPDATE_ORDER_STATUS") {
        const { orderId, status } = event.data;
        const order = orders.find((o) => o.id === orderId);
        if (order) {
          order.status = status;
          order.updatedAt = new Date().toISOString();

          // Clear courier active order if delivered or cancelled
          if (status === "DELIVERED" || status === "CANCELLED") {
            const courier = couriers.find((c) => c.id === order.assignedCourierId);
            if (courier) {
              courier.activeOrderId = undefined;
              if (status === "DELIVERED") courier.deliveriesTodayCount += 1;
            }
          }

          broadcast({ type: "UPDATE_ORDER_STATUS", data: { orderId, status } });
        }
      } else if (event.type === "CREATE_COURIER") {
        const newCourier = event.data;
        if (!newCourier.id) newCourier.id = `courier-${Date.now()}`;
        couriers.push(newCourier);
        broadcast({ type: "CREATE_COURIER", data: newCourier });
      } else if (event.type === "UPDATE_COURIER") {
        const updatedCourier = event.data;
        const index = couriers.findIndex((c) => c.id === updatedCourier.id);
        if (index !== -1) {
          couriers[index] = { ...couriers[index], ...updatedCourier };
          broadcast({ type: "UPDATE_COURIER", data: couriers[index] });
        }
      } else if (event.type === "DELETE_COURIER") {
        const { courierId } = event.data;
        couriers = couriers.filter((c) => c.id !== courierId);
        // Unassign order if active
        orders.forEach((o) => {
          if (o.assignedCourierId === courierId) {
            o.assignedCourierId = undefined;
            o.assignedCourierName = undefined;
            o.assignedCourierPhone = undefined;
            if (o.status === "DISPATCHED" || o.status === "IN_TRANSIT") {
              o.status = "READY_FOR_PICKUP";
            }
          }
        });
        broadcast({ type: "DELETE_COURIER", data: { courierId } });
      }
    } catch (err) {
      console.error("Error processing WS message:", err);
    }
  });
});

// REST APIs
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/state", (_req, res) => {
  res.json({ orders, couriers, storeInfo, ifoodConfig });
});

// Real/Simulated iFood Webhook Receiver
app.post("/api/ifood/webhook", (req, res) => {
  const payload: IFoodWebhookPayload = req.body;

  // Log incoming webhook event
  console.log("iFood Webhook received:", payload.code || "ORDER_CREATED", payload.orderId);

  let newOrder: Order;

  if (payload.orderData) {
    newOrder = {
      id: payload.orderId || `ord-${Date.now()}`,
      displayId: payload.orderData.displayId || `#iFood-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: payload.orderData.customerName || "Cliente iFood",
      customerPhone: payload.orderData.customerPhone || "(11) 99999-0000",
      deliveryAddress: payload.orderData.deliveryAddress || {
        street: "Rua Cardeal Arcoverde",
        number: "1200",
        neighborhood: "Pinheiros",
        city: "São Paulo",
        lat: -23.558100,
        lng: -46.685200,
      },
      items: payload.orderData.items || [
        { id: "item-gen-1", name: "Combo X-Tudo Smash + Refrigerante 350ml", quantity: 1, unitPrice: 42.90 },
      ],
      totalAmount: payload.orderData.totalAmount || 42.90,
      status: payload.orderData.status || "PLACED",
      origin: "iFood",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: payload.orderData.paymentMethod || "Online iFood",
      verificationCode: Math.floor(1000 + Math.random() * 9000).toString(),
    };
  } else {
    newOrder = {
      id: payload.orderId || `ord-${Date.now()}`,
      displayId: `#iFood-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: "Cliente iFood Express",
      customerPhone: "(11) 98765-4321",
      deliveryAddress: {
        street: "Rua dos Pinheiros",
        number: "450",
        neighborhood: "Pinheiros",
        city: "São Paulo",
        lat: -23.564120,
        lng: -46.687340,
      },
      items: [
        { id: "i-1", name: "2x Temaki Salmão Grelhado Cream Cheese", quantity: 1, unitPrice: 49.90 },
      ],
      totalAmount: 49.90,
      status: "PLACED",
      origin: "iFood",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: "Online iFood",
      verificationCode: "1234",
    };
  }

  // Prepend to orders array
  orders.unshift(newOrder);

  // Broadcast via WebSocket to Admin & Courier apps in real time
  broadcast({ type: "NEW_ORDER", data: newOrder });
  broadcast({ type: "IFOOD_WEBHOOK_RECEIVED", data: payload });

  res.status(200).json({ status: "SUCCESS", message: "Webhook processed and order queued", orderId: newOrder.id });
});

// iFood Order Generator Helper for Testing
app.post("/api/ifood/simulate-order", (req, res) => {
  const sampleAddresses = [
    { street: "Rua Oscar Freire", number: "920", neighborhood: "Jardins", lat: -23.562180, lng: -46.671450 },
    { street: "Rua Pedroso Alvarenga", number: "1100", neighborhood: "Itaim Bibi", lat: -23.582310, lng: -46.678910 },
    { street: "Rua Aspicuelta", number: "300", neighborhood: "Vila Madalena", lat: -23.553410, lng: -46.690800 },
    { street: "Avenida Brigadeiro Faria Lima", number: "2232", neighborhood: "Jardim Paulistano", lat: -23.578120, lng: -46.689450 },
    { street: "Rua dos Pinheiros", number: "820", neighborhood: "Pinheiros", lat: -23.567810, lng: -46.690120 },
  ];

  const sampleCustomers = [
    { name: "Beatriz Ribeiro", phone: "(11) 98711-2233" },
    { name: "Gabriel Santos", phone: "(11) 97622-3344" },
    { name: "Camila Rodrigues", phone: "(11) 99533-4455" },
    { name: "Thiago Almeida", phone: "(11) 96444-5566" },
    { name: "Patricia Martins", phone: "(11) 95355-6677" },
  ];

  const sampleCombos = [
    {
      items: [
        { id: "cb-1", name: "Hambúrguer Gourmet Angus 200g + Cheddar", quantity: 1, unitPrice: 42.00 },
        { id: "cb-2", name: "Onion Rings Crocantes", quantity: 1, unitPrice: 18.00 },
        { id: "cb-3", name: "Milkshake de Ovomaltine 400ml", quantity: 1, unitPrice: 21.00 },
      ],
      total: 81.00,
    },
    {
      items: [
        { id: "cb-4", name: "Pizza Meia Calabresa Meia 4 Queijos G", quantity: 1, unitPrice: 68.00 },
        { id: "cb-5", name: "Guaraná Antarctica 2 Litros", quantity: 1, unitPrice: 14.00 },
      ],
      total: 82.00,
    },
    {
      items: [
        { id: "cb-6", name: "Yakisoba Especial de Carne e Frango 750g", quantity: 1, unitPrice: 39.90 },
        { id: "cb-7", name: "2x Harumaki de Queijo", quantity: 1, unitPrice: 14.00 },
      ],
      total: 53.90,
    },
  ];

  const addr = sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)];
  const cust = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
  const combo = sampleCombos[Math.floor(Math.random() * sampleCombos.length)];

  const randomDisplayId = `#iFood-${Math.floor(1000 + Math.random() * 9000)}`;

  const simulatedWebhookPayload: IFoodWebhookPayload = {
    eventId: `evt-${Date.now()}`,
    code: "ORDER_CREATED",
    fullCode: "PLC",
    merchantId: ifoodConfig.merchantId,
    orderId: `ord-ifood-${Date.now()}`,
    createdAt: new Date().toISOString(),
    orderData: {
      displayId: randomDisplayId,
      customerName: cust.name,
      customerPhone: cust.phone,
      deliveryAddress: {
        ...addr,
        city: "São Paulo",
      },
      items: combo.items,
      totalAmount: combo.total,
      status: "PLACED",
      origin: "iFood",
      paymentMethod: "Online iFood",
    },
  };

  // Trigger local webhook handler
  const newOrder: Order = {
    id: simulatedWebhookPayload.orderId,
    displayId: randomDisplayId,
    customerName: cust.name,
    customerPhone: cust.phone,
    deliveryAddress: { ...addr, city: "São Paulo" },
    items: combo.items,
    totalAmount: combo.total,
    status: "PLACED",
    origin: "iFood",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paymentMethod: "Online iFood",
    verificationCode: Math.floor(1000 + Math.random() * 9000).toString(),
  };

  orders.unshift(newOrder);

  broadcast({ type: "NEW_ORDER", data: newOrder });
  broadcast({ type: "IFOOD_WEBHOOK_RECEIVED", data: simulatedWebhookPayload });

  res.status(200).json({
    success: true,
    message: "Novo pedido iFood simulado e disparado em tempo real!",
    order: newOrder,
  });
});

// Start Express + Vite
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Servidor Logística iFood rodando na porta ${PORT}`);
  });
}

start();

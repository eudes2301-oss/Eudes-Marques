import express from "express";
import { db } from "./db.js";
import { generateAuthToken, requireAuthMiddleware, AuthenticatedRequest } from "./auth.js";
import { Order, User, IFoodWebhookPayload } from "../types.js";

export const apiRouter = express.Router();

// Authentication Endpoint
apiRouter.post("/auth/login", (req, res) => {
  const { role, courierId, email, password } = req.body;

  if (role === "admin") {
    const adminUser: User = {
      id: "admin-sp-01",
      name: "Gestor de Logística iFood",
      email: email || "admin@ifood.com.br",
      role: "admin",
    };
    const token = generateAuthToken(adminUser);
    return res.json({
      success: true,
      token,
      user: adminUser,
      message: "Autenticação de Administrador realizada com sucesso.",
    });
  } else if (role === "courier") {
    const couriers = db.getCouriers();
    const targetCourier = couriers.find((c) => c.id === courierId) || couriers[0];

    if (!targetCourier) {
      return res.status(404).json({ success: false, message: "Entregador não encontrado." });
    }

    const courierUser: User = {
      id: `user-${targetCourier.id}`,
      name: targetCourier.name,
      email: `${targetCourier.id}@entregador.ifood.com.br`,
      role: "courier",
      courierId: targetCourier.id,
    };
    const token = generateAuthToken(courierUser);
    return res.json({
      success: true,
      token,
      user: courierUser,
      message: `Autenticação do entregador ${targetCourier.name} realizada.`,
    });
  }

  return res.status(400).json({ success: false, message: "Perfil de usuário inválido." });
});

// Health Check Endpoint
apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Protected State Retrieval Endpoint
apiRouter.get("/state", requireAuthMiddleware, (req: AuthenticatedRequest, res) => {
  res.json({
    orders: db.getOrders(),
    couriers: db.getCouriers(),
    storeInfo: db.getStoreInfo(),
    ifoodConfig: db.getIFoodConfig(),
    user: req.user,
  });
});

// Webhook Broadcast Helper Reference (Will be set by ws server)
let broadcastFunction: ((event: any) => void) | null = null;
export function setBroadcastHandler(fn: (event: any) => void) {
  broadcastFunction = fn;
}

// Real/Simulated iFood Webhook Receiver
apiRouter.post("/ifood/webhook", (req, res) => {
  const payload: IFoodWebhookPayload = req.body;

  console.log("iFood Webhook received:", payload.code || "ORDER_CREATED", payload.orderId);

  const orders = db.getOrders();
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

  orders.unshift(newOrder);
  db.save();

  if (broadcastFunction) {
    broadcastFunction({ type: "NEW_ORDER", data: newOrder });
    broadcastFunction({ type: "IFOOD_WEBHOOK_RECEIVED", data: payload });
  }

  res.status(200).json({ status: "SUCCESS", message: "Webhook processed and order queued", orderId: newOrder.id });
});

// iFood Order Generator Helper for Testing
apiRouter.post("/ifood/simulate-order", (req, res) => {
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

  const newOrder: Order = {
    id: `ord-ifood-${Date.now()}`,
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

  const orders = db.getOrders();
  orders.unshift(newOrder);
  db.save();

  if (broadcastFunction) {
    broadcastFunction({ type: "NEW_ORDER", data: newOrder });
  }

  res.status(200).json({
    success: true,
    message: "Novo pedido iFood simulado e disparado em tempo real!",
    order: newOrder,
  });
});

import React, { useState, useEffect, useRef } from "react";
import { Order, Courier, StoreInfo, IFoodConfig, WSEvent, OrderStatus, IFoodWebhookPayload, User } from "./types";
import { Navbar } from "./components/Navbar";
import { AdminDashboard } from "./components/AdminDashboard";
import { CourierApp } from "./components/CourierApp";
import { IFoodSimulator } from "./components/IFoodSimulator";
import { ArchitectureDoc } from "./components/ArchitectureDoc";
import { LoginModal } from "./components/LoginModal";

export default function App() {
  const [currentView, setCurrentView] = useState<"admin" | "courier" | "simulator" | "architecture">("admin");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  
  // Active User / Access Level State
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: "admin-1",
    name: "Gestor de Logística iFood",
    email: "admin@ifood.com.br",
    role: "admin",
  });
  
  // App State synced via WebSockets
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>({
    id: "store-sp-01",
    name: "iFood Hub Logistics - Pinheiros SP",
    address: "Rua Teodoro Sampaio, 1400 - Pinheiros, São Paulo - SP",
    lat: -23.561684,
    lng: -46.688123,
    phone: "(11) 98888-7766",
    isOpen: true,
  });
  const [ifoodConfig, setIfoodConfig] = useState<IFoodConfig>({
    merchantId: "merchant-sp-99812",
    clientId: "ifood-developer-client-id-sample",
    clientSecret: "••••••••••••••••••••••••",
    webhookUrl: "https://app.logistica.com/api/ifood/webhook",
    status: "CONNECTED",
    autoAcceptOrders: false,
    environment: "SANDBOX",
  });
  const [lastWebhookReceived, setLastWebhookReceived] = useState<IFoodWebhookPayload | undefined>(undefined);

  const wsRef = useRef<WebSocket | null>(null);

  // Connect WebSocket & fetch initial state
  useEffect(() => {
    fetch("/api/state")
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
        if (data.couriers) setCouriers(data.couriers);
        if (data.storeInfo) setStoreInfo(data.storeInfo);
        if (data.ifoodConfig) setIfoodConfig(data.ifoodConfig);
      })
      .catch((err) => console.error("Error fetching state:", err));

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}`;

    let socket: WebSocket;

    function connect() {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onclose = () => {
        setIsConnected(false);
        setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.warn("WebSocket error:", err);
      };

      socket.onmessage = (event) => {
        try {
          const wsEvent: WSEvent = JSON.parse(event.data);

          if (wsEvent.type === "INIT_STATE") {
            setOrders(wsEvent.data.orders);
            setCouriers(wsEvent.data.couriers);
            setStoreInfo(wsEvent.data.storeInfo);
            setIfoodConfig(wsEvent.data.ifoodConfig);
          } else if (wsEvent.type === "LOCATION_UPDATE") {
            const { courierId, lat, lng, batteryLevel } = wsEvent.data;
            setCouriers((prev) =>
              prev.map((c) =>
                c.id === courierId
                  ? {
                      ...c,
                      currentLat: lat,
                      currentLng: lng,
                      lastLocationUpdate: new Date().toISOString(),
                      batteryLevel: batteryLevel ?? c.batteryLevel,
                    }
                  : c
              )
            );
          } else if (wsEvent.type === "COURIER_STATUS_TOGGLE") {
            const { courierId, isOnline } = wsEvent.data;
            setCouriers((prev) =>
              prev.map((c) => (c.id === courierId ? { ...c, isOnline } : c))
            );
          } else if (wsEvent.type === "ASSIGN_ORDER") {
            const { orderId, courierId } = wsEvent.data;
            const courier = couriers.find((c) => c.id === courierId);

            setOrders((prev) =>
              prev.map((o) =>
                o.id === orderId
                  ? {
                      ...o,
                      assignedCourierId: courierId,
                      assignedCourierName: courier?.name,
                      assignedCourierPhone: courier?.phone,
                      status: "DISPATCHED",
                      updatedAt: new Date().toISOString(),
                    }
                  : o
              )
            );

            setCouriers((prev) =>
              prev.map((c) => (c.id === courierId ? { ...c, activeOrderId: orderId } : c))
            );
          } else if (wsEvent.type === "UPDATE_ORDER_STATUS") {
            const { orderId, status } = wsEvent.data;
            setOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
            );

            if (status === "DELIVERED" || status === "CANCELLED") {
              setCouriers((prev) =>
                prev.map((c) =>
                  c.activeOrderId === orderId
                    ? {
                        ...c,
                        activeOrderId: undefined,
                        deliveriesTodayCount: status === "DELIVERED" ? c.deliveriesTodayCount + 1 : c.deliveriesTodayCount,
                      }
                    : c
                )
              );
            }
          } else if (wsEvent.type === "NEW_ORDER") {
            const newOrd = wsEvent.data;
            setOrders((prev) => [newOrd, ...prev]);
          } else if (wsEvent.type === "IFOOD_WEBHOOK_RECEIVED") {
            setLastWebhookReceived(wsEvent.data);
          } else if (wsEvent.type === "CREATE_COURIER") {
            const newCourier = wsEvent.data;
            setCouriers((prev) => [...prev, newCourier]);
          } else if (wsEvent.type === "UPDATE_COURIER") {
            const updated = wsEvent.data;
            setCouriers((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
          } else if (wsEvent.type === "DELETE_COURIER") {
            const { courierId } = wsEvent.data;
            setCouriers((prev) => prev.filter((c) => c.id !== courierId));
          }
        } catch (e) {
          console.error("Error parsing WS event:", e);
        }
      };
    }

    connect();

    return () => {
      if (socket) socket.close();
    };
  }, []);

  // Dispatch WebSocket Event Helper
  const sendWSEvent = (event: WSEvent) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  };

  // Courier CRUD Handlers
  const handleCreateCourier = (newCourier: Courier) => {
    setCouriers((prev) => [...prev, newCourier]);
    sendWSEvent({ type: "CREATE_COURIER", data: newCourier });
  };

  const handleUpdateCourier = (updatedCourier: Courier) => {
    setCouriers((prev) => prev.map((c) => (c.id === updatedCourier.id ? updatedCourier : c)));
    sendWSEvent({ type: "UPDATE_COURIER", data: updatedCourier });
  };

  const handleDeleteCourier = (courierId: string) => {
    setCouriers((prev) => prev.filter((c) => c.id !== courierId));
    sendWSEvent({ type: "DELETE_COURIER", data: { courierId } });
  };

  // User Role Switch Handler
  const handleSelectUserRole = (user: User) => {
    setCurrentUser(user);
    if (user.role === "admin") {
      setCurrentView("admin");
    } else {
      setCurrentView("courier");
    }
    setIsLoginModalOpen(false);
  };

  // Handlers
  const handleAssignOrder = (orderId: string, courierId: string) => {
    const courier = couriers.find((c) => c.id === courierId);
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              assignedCourierId: courierId,
              assignedCourierName: courier?.name,
              assignedCourierPhone: courier?.phone,
              status: "DISPATCHED",
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
    setCouriers((prev) =>
      prev.map((c) => (c.id === courierId ? { ...c, activeOrderId: orderId } : c))
    );

    sendWSEvent({ type: "ASSIGN_ORDER", data: { orderId, courierId } });
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
    );

    if (status === "DELIVERED" || status === "CANCELLED") {
      setCouriers((prev) =>
        prev.map((c) =>
          c.activeOrderId === orderId
            ? {
                ...c,
                activeOrderId: undefined,
                deliveriesTodayCount: status === "DELIVERED" ? c.deliveriesTodayCount + 1 : c.deliveriesTodayCount,
              }
            : c
        )
      );
    }

    sendWSEvent({ type: "UPDATE_ORDER_STATUS", data: { orderId, status } });
  };

  const handleToggleCourierOnline = (courierId: string, isOnline: boolean) => {
    setCouriers((prev) =>
      prev.map((c) => (c.id === courierId ? { ...c, isOnline } : c))
    );

    sendWSEvent({ type: "COURIER_STATUS_TOGGLE", data: { courierId, isOnline } });
  };

  const handleUpdateLocation = (courierId: string, lat: number, lng: number, batteryLevel?: number) => {
    setCouriers((prev) =>
      prev.map((c) =>
        c.id === courierId
          ? {
              ...c,
              currentLat: lat,
              currentLng: lng,
              lastLocationUpdate: new Date().toISOString(),
              batteryLevel: batteryLevel ?? c.batteryLevel,
            }
          : c
      )
    );

    sendWSEvent({
      type: "LOCATION_UPDATE",
      data: { courierId, lat, lng, batteryLevel },
    });
  };

  const handleSimulateOrder = async () => {
    try {
      await fetch("/api/ifood/simulate-order", { method: "POST" });
    } catch (e) {
      console.error("Error triggering simulate order:", e);
    }
  };

  const handleCreateManualOrder = (newOrderPartial: Partial<Order>) => {
    const fullOrder: Order = {
      id: `ord-manual-${Date.now()}`,
      displayId: `#M-${Math.floor(100 + Math.random() * 900)}`,
      customerName: newOrderPartial.customerName || "Cliente Balcão",
      customerPhone: newOrderPartial.customerPhone || "(11) 99999-0000",
      deliveryAddress: newOrderPartial.deliveryAddress || {
        street: "Rua Teodoro Sampaio",
        number: "1200",
        neighborhood: "Pinheiros",
        city: "São Paulo",
        lat: -23.560000,
        lng: -46.685000,
      },
      items: newOrderPartial.items || [],
      totalAmount: newOrderPartial.totalAmount || 0,
      status: "PLACED",
      origin: "Manual",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentMethod: newOrderPartial.paymentMethod || "Dinheiro na Entrega",
      verificationCode: Math.floor(1000 + Math.random() * 9000).toString(),
    };

    setOrders((prev) => [fullOrder, ...prev]);

    sendWSEvent({ type: "NEW_ORDER", data: fullOrder });
  };

  const pendingCount = orders.filter((o) => o.status === "PLACED" || o.status === "READY_FOR_PICKUP").length;
  const onlineCount = couriers.filter((c) => c.isOnline).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Login Modal Access Control */}
      <LoginModal
        isOpen={isLoginModalOpen}
        currentUser={currentUser}
        couriers={couriers}
        onSelectRole={handleSelectUserRole}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Navbar Header */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        isConnected={isConnected}
        pendingOrdersCount={pendingCount}
        onlineCouriersCount={onlineCount}
        currentUser={currentUser}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Main Body Content based on active view tab */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentView === "admin" && (
          <AdminDashboard
            orders={orders}
            couriers={couriers}
            storeInfo={storeInfo}
            onAssignOrder={handleAssignOrder}
            onUpdateStatus={handleUpdateOrderStatus}
            onCreateManualOrder={handleCreateManualOrder}
            onToggleCourierOnline={handleToggleCourierOnline}
            onCreateCourier={handleCreateCourier}
            onUpdateCourier={handleUpdateCourier}
            onDeleteCourier={handleDeleteCourier}
          />
        )}

        {currentView === "courier" && (
          <CourierApp
            couriers={couriers}
            orders={orders}
            onUpdateLocation={handleUpdateLocation}
            onToggleOnline={handleToggleCourierOnline}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            activeCourierUser={couriers.find((c) => c.id === currentUser?.courierId)}
          />
        )}

        {currentView === "simulator" && (
          <IFoodSimulator
            ifoodConfig={ifoodConfig}
            onSimulateOrder={handleSimulateOrder}
            lastWebhookReceived={lastWebhookReceived}
          />
        )}

        {currentView === "architecture" && <ArchitectureDoc />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>iFood Entregadores & Logística Express v2.0 • PWA & Express WebSockets</span>
          <span>Design Oficial iFood • Padrão de Acesso Administrador & Entregador</span>
        </div>
      </footer>

    </div>
  );
}


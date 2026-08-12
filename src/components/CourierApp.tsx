import React, { useState, useEffect, useRef } from "react";
import { Courier, Order, OrderStatus } from "../types";
import {
  Navigation,
  MapPin,
  Phone,
  CheckCircle,
  Smartphone,
  Zap,
  Battery,
  Radio,
  ExternalLink,
  Lock,
  DollarSign,
  Bike,
  ShieldCheck,
  Award,
  ChevronRight,
  TrendingUp,
  Clock,
  Bell,
  X
} from "lucide-react";

interface CourierAppProps {
  couriers: Courier[];
  orders: Order[];
  onUpdateLocation: (courierId: string, lat: number, lng: number, batteryLevel?: number) => void;
  onToggleOnline: (courierId: string, isOnline: boolean) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  activeCourierUser?: Courier | null;
}

interface PushNotification {
  id: string;
  title: string;
  body: string;
  order?: Order;
  timestamp: string;
}

export const CourierApp: React.FC<CourierAppProps> = ({
  couriers,
  orders,
  onUpdateLocation,
  onToggleOnline,
  onUpdateOrderStatus,
  activeCourierUser,
}) => {
  // Current active courier logged into mobile app
  const [selectedCourierId, setSelectedCourierId] = useState<string>(
    activeCourierUser?.id || couriers[0]?.id || "courier-1"
  );
  const [gpsWatchId, setGpsWatchId] = useState<number | null>(null);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"deliveries" | "earnings">("deliveries");

  // Push Notification State
  const [pushNotification, setPushNotification] = useState<PushNotification | null>(null);
  const prevOrdersRef = useRef<Order[]>([]);

  const activeCourier = couriers.find((c) => c.id === selectedCourierId) || couriers[0];
  const activeOrder = orders.find(
    (o) =>
      o.id === activeCourier?.activeOrderId ||
      (o.assignedCourierId === selectedCourierId && o.status !== "DELIVERED" && o.status !== "CANCELLED")
  );

  // Play dual-tone push chime sound using Web Audio API
  const playPushChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12); // E6

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (err) {
      console.log("Audio chime skipped:", err);
    }
  };

  // Monitor newly assigned orders to trigger Push Notification
  useEffect(() => {
    const assignedNow = orders.filter(
      (o) => o.assignedCourierId === selectedCourierId && o.status !== "DELIVERED" && o.status !== "CANCELLED"
    );

    const prevAssignedIds = prevOrdersRef.current
      .filter((o) => o.assignedCourierId === selectedCourierId && o.status !== "DELIVERED" && o.status !== "CANCELLED")
      .map((o) => o.id);

    const newlyAssigned = assignedNow.find((o) => !prevAssignedIds.includes(o.id));

    if (newlyAssigned) {
      triggerPushNotification(
        "iFood Entregadores • Nova Rota",
        `🛵 Pedido ${newlyAssigned.displayId} atribuído! Cliente: ${newlyAssigned.customerName}`,
        newlyAssigned
      );
    }

    prevOrdersRef.current = orders;
  }, [orders, selectedCourierId]);

  const triggerPushNotification = (title: string, body: string, order?: Order) => {
    setPushNotification({
      id: `push-${Date.now()}`,
      title,
      body,
      order: order || activeOrder || orders[0],
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    playPushChime();
  };

  // Completed orders today by courier
  const completedOrders = orders.filter(
    (o) => o.assignedCourierId === selectedCourierId && o.status === "DELIVERED"
  );
  const totalEarningsToday = completedOrders.reduce((sum, o) => sum + Math.max(12.5, o.totalAmount * 0.18 + 7.5), 0) + (activeCourier?.earningsToday || 148.50);

  // Continuous GPS Location Tracking via HTML5 Geolocation API
  useEffect(() => {
    if (!activeCourier?.isOnline) {
      if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        setGpsWatchId(null);
      }
      return;
    }

    if ("geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          setGpsError(null);
          onUpdateLocation(
            activeCourier.id,
            position.coords.latitude,
            position.coords.longitude,
            Math.floor(Math.random() * 15) + 85
          );
        },
        (err) => {
          setGpsError(
            "Serviço de GPS físico restrito no ambiente sandbox. Use 'Simular Movimento GPS' abaixo para testar a localização em tempo real."
          );
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
      setGpsWatchId(id);
    } else {
      setGpsError("Geolocalização não suportada neste dispositivo.");
    }

    return () => {
      if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
    };
  }, [activeCourier?.isOnline, selectedCourierId]);

  // Simulate movement along route for demo
  const handleSimulateMovement = () => {
    if (!activeCourier) return;
    const targetLat = activeOrder ? activeOrder.deliveryAddress.lat : activeCourier.currentLat + 0.001;
    const targetLng = activeOrder ? activeOrder.deliveryAddress.lng : activeCourier.currentLng + 0.001;

    const newLat = activeCourier.currentLat + (targetLat - activeCourier.currentLat) * 0.25;
    const newLng = activeCourier.currentLng + (targetLng - activeCourier.currentLng) * 0.25;

    onUpdateLocation(activeCourier.id, newLat, newLng, activeCourier.batteryLevel ?? 88);
  };

  // Deep links for native GPS Navigation apps
  const openGoogleMaps = () => {
    if (!activeOrder) return;
    const { lat, lng } = activeOrder.deliveryAddress;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, "_blank");
  };

  const openWaze = () => {
    if (!activeOrder) return;
    const { lat, lng } = activeOrder.deliveryAddress;
    const url = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(url, "_blank");
  };

  const handleConfirmPinDelivery = () => {
    if (!activeOrder) return;
    if (activeOrder.verificationCode && pinInput !== activeOrder.verificationCode) {
      setPinError(true);
      return;
    }

    setPinError(false);
    setPinInput("");
    onUpdateOrderStatus(activeOrder.id, "DELIVERED");
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12">
      
      {/* Official iFood Entregadores Mobile Frame */}
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl shadow-2xl overflow-hidden font-sans relative">
        
        {/* Floating Push Notification Banner */}
        {pushNotification && (
          <div className="absolute top-3 left-3 right-3 z-50 transition-all duration-300 animate-fade-in">
            <div className="bg-slate-900/95 backdrop-blur-md border-2 border-[#EA1D2C] text-slate-100 rounded-2xl p-3.5 shadow-2xl shadow-rose-950/80 flex flex-col gap-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#EA1D2C]" />

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EA1D2C] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                    iF
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-100">
                        iFood Entregadores
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        • {pushNotification.timestamp}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-400 block">
                      🔔 Nova Corrida Atribuída!
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setPushNotification(null)}
                  className="text-slate-400 hover:text-white text-xs bg-slate-800 p-1 rounded-full shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-slate-200 font-semibold leading-tight">
                {pushNotification.body}
              </p>

              {pushNotification.order && (
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-100 block">
                      {pushNotification.order.deliveryAddress.neighborhood || "Centro"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {pushNotification.order.items.length} itens • {pushNotification.order.paymentMethod}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Taxa Estimada</span>
                    <span className="font-extrabold text-emerald-400">
                      R$ {Math.max(12.5, pushNotification.order.totalAmount * 0.18 + 7.5).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setActiveTab("deliveries");
                    setPushNotification(null);
                  }}
                  className="flex-1 bg-[#EA1D2C] hover:bg-[#c21320] text-white font-extrabold py-2 px-3 rounded-xl text-xs text-center shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Aceitar & Ver Detalhes
                </button>

                <button
                  onClick={() => setPushNotification(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-3 rounded-xl text-xs"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Top Official iFood Red App Bar */}
        <div className="bg-[#EA1D2C] text-white p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

          {/* Device System Header */}
          <div className="flex items-center justify-between text-xs text-rose-100 border-b border-white/20 pb-2">
            <div className="flex items-center gap-1.5 font-bold">
              <Smartphone className="w-3.5 h-3.5" />
              <span>iFood Entregadores App</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <Battery className="w-4 h-4 text-emerald-300" />
              <span>{activeCourier?.batteryLevel ?? 92}%</span>
            </div>
          </div>

          {/* Logo & Profile */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-[#EA1D2C] flex items-center justify-center font-black text-xl shadow-md">
                iF
              </div>
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-200 block">
                  ENTREGADOR PARCEIRO
                </span>
                <h1 className="font-extrabold text-base tracking-tight leading-tight">
                  {activeCourier?.name || "Entregador iFood"}
                </h1>
              </div>
            </div>

            {/* Earnings Quick Badge */}
            <div className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-right border border-white/10">
              <span className="text-[10px] text-rose-200 block font-medium">Ganhos de Hoje</span>
              <span className="font-extrabold text-sm text-emerald-300">
                R$ {totalEarningsToday.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Courier Selector Switcher */}
          <div className="pt-2">
            <select
              value={selectedCourierId}
              onChange={(e) => setSelectedCourierId(e.target.value)}
              className="w-full bg-black/25 text-white text-xs font-semibold rounded-xl py-2 px-3 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white"
            >
              {couriers.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                  Perfis Cadastrados: {c.name} ({c.vehicle} {c.plate ? `- ${c.plate}` : ""})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Master iFood Status Toggle Button ("FICAR ONLINE / OFFLINE") */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  activeCourier?.isOnline ? "bg-emerald-500 animate-ping" : "bg-slate-500"
                }`}
              />
              <span className="font-extrabold text-xs text-slate-200 uppercase tracking-wider">
                STATUS NO IFOOD: {activeCourier?.isOnline ? "DISPONÍVEL" : "INDISPONÍVEL"}
              </span>
            </div>

            <div className="text-xs text-amber-400 font-bold flex items-center gap-1">
              ★ {activeCourier?.rating.toFixed(1)}
            </div>
          </div>

          <button
            onClick={() => onToggleOnline(activeCourier.id, !activeCourier?.isOnline)}
            className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
              activeCourier?.isOnline
                ? "bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 shadow-slate-950"
                : "bg-[#EA1D2C] hover:bg-[#c21320] text-white shadow-rose-950/60"
            }`}
          >
            <Radio className={`w-5 h-5 ${activeCourier?.isOnline ? "text-emerald-400 animate-pulse" : ""}`} />
            {activeCourier?.isOnline ? "DESCONECTAR (FICAR OFFLINE)" : "FICAR ONLINE NO IFOOD"}
          </button>

          {activeCourier?.isOnline && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl text-[11px] text-emerald-400 text-center font-medium">
              🟢 Você está conectado ao radar do iFood. Aguardando novas rotas de entrega!
            </div>
          )}

          {/* Test Simulation Buttons */}
          {activeCourier?.isOnline && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleSimulateMovement}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl py-2 px-2.5 text-[11px] font-semibold flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Avançar GPS
              </button>

              <button
                onClick={() =>
                  triggerPushNotification(
                    "iFood Entregadores • Teste de Push",
                    `🔔 Nova rota atribuída em tempo real! Pedido #${Math.floor(1000 + Math.random() * 9000)}`
                  )
                }
                className="bg-[#EA1D2C]/10 hover:bg-[#EA1D2C]/20 text-[#EA1D2C] border border-[#EA1D2C]/30 rounded-xl py-2 px-2.5 text-[11px] font-bold flex items-center justify-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5 text-[#EA1D2C] shrink-0" />
                Testar Push Banner
              </button>
            </div>
          )}

          {gpsError && (
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-[11px]">
              {gpsError}
            </div>
          )}
        </div>

        {/* Courier App Tabs (Corridas / Ganhos) */}
        <div className="grid grid-cols-2 bg-slate-950 border-b border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab("deliveries")}
            className={`py-3 text-center transition-all ${
              activeTab === "deliveries"
                ? "border-b-2 border-[#EA1D2C] text-[#EA1D2C] bg-slate-900"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Entregas em Andamento
          </button>
          <button
            onClick={() => setActiveTab("earnings")}
            className={`py-3 text-center transition-all ${
              activeTab === "earnings"
                ? "border-b-2 border-[#EA1D2C] text-[#EA1D2C] bg-slate-900"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Extrato de Ganhos ({completedOrders.length})
          </button>
        </div>

        {/* TAB CONTENT: DELIVERIES */}
        {activeTab === "deliveries" && (
          <div className="p-4 space-y-4 min-h-[380px]">
            {!activeOrder ? (
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-8 text-center space-y-3">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-3xl">
                  🛵
                </div>
                <h3 className="font-extrabold text-slate-100 text-sm">Nenhuma corrida ativa no momento</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Quando o restaurante despachar um pedido para você, a notificação com os detalhes e rota aparecerá aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Delivery iFood Card */}
                <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-4 shadow-xl">
                  
                  {/* Step Progress bar */}
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className={activeOrder.status === "DISPATCHED" ? "text-[#EA1D2C] font-extrabold" : "text-emerald-400"}>
                      1. Ir ao Restaurante
                    </span>
                    <span>→</span>
                    <span className={activeOrder.status === "IN_TRANSIT" ? "text-[#EA1D2C] font-extrabold" : "text-slate-400"}>
                      2. A caminho do cliente
                    </span>
                    <span>→</span>
                    <span>3. Código PIN</span>
                  </div>

                  {/* Order ID & Badge */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                    <div>
                      <span className="text-[10px] font-extrabold bg-[#EA1D2C] text-white px-2 py-0.5 rounded uppercase">
                        {activeOrder.origin}
                      </span>
                      <h2 className="text-lg font-black text-slate-100 mt-1">{activeOrder.displayId}</h2>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Valor da Entrega</span>
                      <span className="text-lg font-black text-emerald-400">
                        R$ {Math.max(12.5, activeOrder.totalAmount * 0.18 + 7.5).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 text-sm">{activeOrder.customerName}</span>
                      <a
                        href={`tel:${activeOrder.customerPhone}`}
                        className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Ligar p/ Cliente
                      </a>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                      <MapPin className="w-5 h-5 text-[#EA1D2C] shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-slate-100 block">
                          {activeOrder.deliveryAddress.street}, {activeOrder.deliveryAddress.number}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {activeOrder.deliveryAddress.neighborhood} - {activeOrder.deliveryAddress.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* GPS Navigation Deep Links */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                      ABRIR NAVEGAÇÃO GPS:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={openGoogleMaps}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
                      >
                        <Navigation className="w-4 h-4" />
                        Google Maps
                      </button>

                      <button
                        onClick={openWaze}
                        className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Waze
                      </button>
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1 text-xs text-slate-300">
                    <span className="font-bold text-slate-400 block mb-1">Itens do Pedido:</span>
                    {activeOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.quantity}x {it.name}</span>
                        <span>R$ {(it.unitPrice * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t border-slate-800 pt-1.5 mt-1 flex justify-between font-bold text-slate-100">
                      <span>Pagamento ({activeOrder.paymentMethod})</span>
                      <span className="text-emerald-400">R$ {activeOrder.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Courier Delivery Actions */}
                  <div className="pt-2">
                    {activeOrder.status === "DISPATCHED" && (
                      <button
                        onClick={() => onUpdateOrderStatus(activeOrder.id, "IN_TRANSIT")}
                        className="w-full bg-sky-600 hover:bg-sky-500 text-white font-extrabold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-950/50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Cheguei ao Restaurante & Coletei o Pedido
                      </button>
                    )}

                    {activeOrder.status === "IN_TRANSIT" && (
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-xs font-extrabold text-slate-100">
                          <span className="flex items-center gap-1.5 text-[#EA1D2C]">
                            <Lock className="w-4 h-4" />
                            Confirmar Entrega com Código iFood
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            PIN Esperado: {activeOrder.verificationCode}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400">
                          Solicite ao cliente os 4 últimos dígitos do celular cadastrado no iFood para validar.
                        </p>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            maxLength={4}
                            placeholder="Ex: 4821"
                            value={pinInput}
                            onChange={(e) => {
                              setPinInput(e.target.value);
                              setPinError(false);
                            }}
                            className="bg-slate-900 border border-slate-700 text-center font-mono font-bold text-slate-100 rounded-xl text-base px-3 py-2 w-full focus:outline-none focus:border-[#EA1D2C]"
                          />
                          <button
                            onClick={handleConfirmPinDelivery}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-xl shrink-0 shadow-md"
                          >
                            Validar & Concluir
                          </button>
                        </div>

                        {pinError && (
                          <p className="text-rose-400 text-xs font-bold text-center">
                            ⚠️ Código incorreto! Verifique o telefone com o cliente.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: EARNINGS */}
        {activeTab === "earnings" && (
          <div className="p-4 space-y-4 min-h-[380px]">
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  RESUMO FINANCEIRO DE HOJE
                </span>
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>

              <div className="text-3xl font-black text-emerald-400">
                R$ {totalEarningsToday.toFixed(2)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700/60">
                <div>
                  <span className="text-slate-400 block text-[10px]">Entregas Concluídas</span>
                  <span className="font-bold text-slate-100">{completedOrders.length + (activeCourier?.deliveriesTodayCount || 0)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Taxa Média por Corrida</span>
                  <span className="font-bold text-slate-100">R$ 14.80</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
                HISTÓRICO DE CORRIDAS RECENTES
              </h4>

              {completedOrders.length === 0 ? (
                <div className="bg-slate-950 p-4 rounded-xl text-center text-xs text-slate-400 border border-slate-800">
                  Nenhuma corrida concluída nesta sessão ainda.
                </div>
              ) : (
                completedOrders.map((o) => (
                  <div
                    key={o.id}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-200 block">{o.displayId} - {o.customerName}</span>
                      <span className="text-[10px] text-slate-400">{o.deliveryAddress.neighborhood}</span>
                    </div>
                    <span className="font-bold text-emerald-400">
                      + R$ {Math.max(12.5, o.totalAmount * 0.18 + 7.5).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

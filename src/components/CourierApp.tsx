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
  X,
  Sun,
  Moon
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

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

  // Completed orders today by courier in active session
  const sessionCompletedOrders = orders.filter(
    (o) => o.assignedCourierId === selectedCourierId && o.status === "DELIVERED"
  );
  
  // Dynamic accurate total earnings calculation
  const totalEarningsToday = activeCourier?.earningsToday || sessionCompletedOrders.reduce((sum, o) => sum + Math.max(12.5, o.totalAmount * 0.18 + 7.5), 0);

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
      <div className={`border-2 rounded-3xl shadow-2xl overflow-hidden font-sans relative transition-colors duration-200 ${
        isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-gray-200 text-gray-900"
      }`}>
        
        {/* Floating Push Notification Banner */}
        {pushNotification && (
          <div className="absolute top-3 left-3 right-3 z-50 transition-all duration-300 animate-fade-in">
            <div className={`backdrop-blur-md border-2 border-[#EA1D2C] rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2 relative overflow-hidden transition-colors ${
              isDarkMode ? "bg-slate-900/95 text-slate-100 shadow-rose-950/80" : "bg-white/95 text-gray-900 shadow-gray-400/50"
            }`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#EA1D2C]" />

              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EA1D2C] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md">
                    iF
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-extrabold text-xs ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                        iFood Entregadores
                      </span>
                      <span className={`text-[10px] font-medium ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                        • {pushNotification.timestamp}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-amber-500 block">
                      🔔 Nova Corrida Atribuída!
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setPushNotification(null)}
                  className={`text-xs p-1 rounded-full shrink-0 transition-colors ${
                    isDarkMode ? "text-slate-400 hover:text-white bg-slate-800" : "text-gray-500 hover:text-gray-900 bg-gray-100"
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className={`text-xs font-semibold leading-tight ${isDarkMode ? "text-slate-200" : "text-gray-800"}`}>
                {pushNotification.body}
              </p>

              {pushNotification.order && (
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                  isDarkMode ? "bg-slate-950 border-slate-800" : "bg-gray-50 border-gray-200"
                }`}>
                  <div>
                    <span className={`font-bold block ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                      {pushNotification.order.deliveryAddress.neighborhood || "Centro"}
                    </span>
                    <span className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                      {pushNotification.order.items.length} itens • {pushNotification.order.paymentMethod}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] block ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>Taxa Estimada</span>
                    <span className={`font-extrabold ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
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
                  className={`font-bold py-2 px-3 rounded-xl text-xs transition-colors ${
                    isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                  }`}
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
            <div className="flex items-center gap-2.5 font-mono text-[11px]">
              {/* Dark / Light Theme Toggle Selector */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? "Mudar para Tema Claro" : "Mudar para Tema Escuro"}
                className="flex items-center gap-1 bg-black/20 hover:bg-black/30 text-white px-2.5 py-0.5 rounded-lg border border-white/25 transition-all text-[11px] font-sans font-bold cursor-pointer"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-300" />
                    <span>Modo Claro</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-100" />
                    <span>Modo Escuro</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1">
                <Battery className="w-4 h-4 text-emerald-300" />
                <span>{activeCourier?.batteryLevel ?? 92}%</span>
              </div>
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
                <option key={c.id} value={c.id} className={isDarkMode ? "bg-slate-900 text-slate-100" : "bg-white text-gray-900"}>
                  Perfis Cadastrados: {c.name} ({c.vehicle} {c.plate ? `- ${c.plate}` : ""})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Master iFood Status Toggle Button ("FICAR ONLINE / OFFLINE") */}
        <div className={`p-4 border-b space-y-3 transition-colors ${
          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-gray-50 border-gray-200"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-3 h-3 rounded-full ${
                  activeCourier?.isOnline ? "bg-emerald-500 animate-ping" : "bg-slate-400"
                }`}
              />
              <span className={`font-extrabold text-xs uppercase tracking-wider ${
                isDarkMode ? "text-slate-200" : "text-gray-800"
              }`}>
                STATUS NO IFOOD: {activeCourier?.isOnline ? "DISPONÍVEL" : "INDISPONÍVEL"}
              </span>
            </div>

            <div className="text-xs text-amber-500 font-extrabold flex items-center gap-1">
              ★ {activeCourier?.rating.toFixed(1)}
            </div>
          </div>

          <button
            onClick={() => onToggleOnline(activeCourier.id, !activeCourier?.isOnline)}
            className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
              activeCourier?.isOnline
                ? isDarkMode
                  ? "bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700 shadow-slate-950"
                  : "bg-white hover:bg-gray-100 text-rose-600 border border-gray-300 shadow-sm"
                : "bg-[#EA1D2C] hover:bg-[#c21320] text-white shadow-rose-950/60"
            }`}
          >
            <Radio className={`w-5 h-5 ${activeCourier?.isOnline ? "text-emerald-500 animate-pulse" : ""}`} />
            {activeCourier?.isOnline ? "DESCONECTAR (FICAR OFFLINE)" : "FICAR ONLINE NO IFOOD"}
          </button>

          {activeCourier?.isOnline && (
            <div className={`p-2.5 rounded-xl text-[11px] text-center font-semibold border ${
              isDarkMode
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}>
              🟢 Você está conectado ao radar do iFood. Aguardando novas rotas de entrega!
            </div>
          )}

          {/* Test Simulation Buttons */}
          {activeCourier?.isOnline && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleSimulateMovement}
                className={`border rounded-xl py-2 px-2.5 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isDarkMode
                    ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800"
                    : "bg-white hover:bg-gray-100 text-gray-700 border-gray-300 shadow-sm"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                Avançar GPS
              </button>

              <button
                onClick={() =>
                  triggerPushNotification(
                    "iFood Entregadores • Teste de Push",
                    `🔔 Nova rota atribuída em tempo real! Pedido #${Math.floor(1000 + Math.random() * 9000)}`
                  )
                }
                className={`border rounded-xl py-2 px-2.5 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  isDarkMode
                    ? "bg-[#EA1D2C]/10 hover:bg-[#EA1D2C]/20 text-[#EA1D2C] border-[#EA1D2C]/30"
                    : "bg-rose-50 hover:bg-rose-100 text-[#EA1D2C] border-rose-200"
                }`}
              >
                <Bell className="w-3.5 h-3.5 text-[#EA1D2C] shrink-0" />
                Testar Push Banner
              </button>
            </div>
          )}

          {gpsError && (
            <div className={`p-2.5 rounded-xl text-[11px] border ${
              isDarkMode
                ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}>
              {gpsError}
            </div>
          )}
        </div>

        {/* Courier App Tabs (Corridas / Ganhos) */}
        <div className={`grid grid-cols-2 border-b text-xs font-bold transition-colors ${
          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-gray-100 border-gray-200"
        }`}>
          <button
            onClick={() => setActiveTab("deliveries")}
            className={`py-3 text-center transition-all ${
              activeTab === "deliveries"
                ? isDarkMode
                  ? "border-b-2 border-[#EA1D2C] text-[#EA1D2C] bg-slate-900 font-extrabold"
                  : "border-b-2 border-[#EA1D2C] text-[#EA1D2C] bg-white font-extrabold"
                : isDarkMode
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Entregas em Andamento
          </button>
          <button
            onClick={() => setActiveTab("earnings")}
            className={`py-3 text-center transition-all ${
              activeTab === "earnings"
                ? isDarkMode
                  ? "border-b-2 border-[#EA1D2C] text-[#EA1D2C] bg-slate-900 font-extrabold"
                  : "border-b-2 border-[#EA1D2C] text-[#EA1D2C] bg-white font-extrabold"
                : isDarkMode
                  ? "text-slate-400 hover:text-slate-200"
                  : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Extrato de Ganhos ({sessionCompletedOrders.length})
          </button>
        </div>

        {/* TAB CONTENT: DELIVERIES */}
        {activeTab === "deliveries" && (
          <div className={`p-4 space-y-4 min-h-[380px] transition-colors ${
            isDarkMode ? "bg-slate-900" : "bg-gray-50"
          }`}>
            {!activeOrder ? (
              <div className={`border rounded-2xl p-8 text-center space-y-3 transition-colors ${
                isDarkMode ? "bg-slate-950 border-slate-800/80" : "bg-white border-gray-200 shadow-sm"
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl ${
                  isDarkMode ? "bg-slate-900" : "bg-gray-100"
                }`}>
                  🛵
                </div>
                <h3 className={`font-extrabold text-sm ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                  Nenhuma corrida ativa no momento
                </h3>
                <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
                  Quando o restaurante despachar um pedido para você, a notificação com os detalhes e rota aparecerá aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Delivery iFood Card */}
                <div className={`border rounded-2xl p-4 space-y-4 shadow-xl transition-colors ${
                  isDarkMode ? "bg-slate-800/90 border-slate-700" : "bg-white border-gray-200 shadow-gray-200/80"
                }`}>
                  
                  {/* Step Progress bar */}
                  <div className={`flex items-center justify-between text-[10px] font-bold p-2.5 rounded-xl border ${
                    isDarkMode ? "text-slate-400 bg-slate-950 border-slate-800" : "text-gray-600 bg-gray-50 border-gray-200"
                  }`}>
                    <span className={activeOrder.status === "DISPATCHED" ? "text-[#EA1D2C] font-extrabold" : isDarkMode ? "text-emerald-400" : "text-emerald-600 font-bold"}>
                      1. Ir ao Restaurante
                    </span>
                    <span>→</span>
                    <span className={activeOrder.status === "IN_TRANSIT" ? "text-[#EA1D2C] font-extrabold" : isDarkMode ? "text-slate-400" : "text-gray-500"}>
                      2. A caminho do cliente
                    </span>
                    <span>→</span>
                    <span>3. Código PIN</span>
                  </div>

                  {/* Order ID & Badge */}
                  <div className={`flex items-center justify-between pb-2 border-b ${
                    isDarkMode ? "border-slate-700/60" : "border-gray-200"
                  }`}>
                    <div>
                      <span className="text-[10px] font-extrabold bg-[#EA1D2C] text-white px-2 py-0.5 rounded uppercase">
                        {activeOrder.origin}
                      </span>
                      <h2 className={`text-lg font-black mt-1 ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                        {activeOrder.displayId}
                      </h2>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] block font-medium ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                        Valor da Entrega
                      </span>
                      <span className={`text-lg font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                        R$ {Math.max(12.5, activeOrder.totalAmount * 0.18 + 7.5).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm ${isDarkMode ? "text-slate-200" : "text-gray-800"}`}>
                        {activeOrder.customerName}
                      </span>
                      <a
                        href={`tel:${activeOrder.customerPhone}`}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Ligar p/ Cliente
                      </a>
                    </div>

                    {/* Delivery Address */}
                    <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-gray-50 border-gray-200"
                    }`}>
                      <MapPin className="w-5 h-5 text-[#EA1D2C] shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className={`font-bold block ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                          {activeOrder.deliveryAddress.street}, {activeOrder.deliveryAddress.number}
                        </span>
                        <span className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
                          {activeOrder.deliveryAddress.neighborhood} - {activeOrder.deliveryAddress.city}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* GPS Navigation Deep Links */}
                  <div className="space-y-1.5">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${
                      isDarkMode ? "text-slate-400" : "text-gray-500"
                    }`}>
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
                  <div className={`p-3 rounded-xl border space-y-1 text-xs ${
                    isDarkMode ? "bg-slate-950/80 border-slate-800 text-slate-300" : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}>
                    <span className={`font-bold block mb-1 ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                      Itens do Pedido:
                    </span>
                    {activeOrder.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.quantity}x {it.name}</span>
                        <span>R$ {(it.unitPrice * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className={`border-t pt-1.5 mt-1 flex justify-between font-bold ${
                      isDarkMode ? "border-slate-800 text-slate-100" : "border-gray-200 text-gray-900"
                    }`}>
                      <span>Pagamento ({activeOrder.paymentMethod})</span>
                      <span className={isDarkMode ? "text-emerald-400" : "text-emerald-600"}>
                        R$ {activeOrder.totalAmount.toFixed(2)}
                      </span>
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
                      <div className={`p-4 rounded-xl border space-y-3 ${
                        isDarkMode ? "bg-slate-950 border-slate-800" : "bg-gray-50 border-gray-200"
                      }`}>
                        <div className="flex items-center justify-between text-xs font-extrabold">
                          <span className="flex items-center gap-1.5 text-[#EA1D2C]">
                            <Lock className="w-4 h-4" />
                            Confirmar Entrega com Código iFood
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${
                            isDarkMode ? "text-slate-400 bg-slate-900 border-slate-800" : "text-gray-600 bg-white border-gray-300"
                          }`}>
                            PIN Esperado: {activeOrder.verificationCode}
                          </span>
                        </div>

                        <p className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-gray-600"}`}>
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
                            className={`border font-mono font-bold rounded-xl text-base px-3 py-2 w-full focus:outline-none focus:border-[#EA1D2C] text-center ${
                              isDarkMode ? "bg-slate-900 border-slate-700 text-slate-100" : "bg-white border-gray-300 text-gray-900"
                            }`}
                          />
                          <button
                            onClick={handleConfirmPinDelivery}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-xl shrink-0 shadow-md"
                          >
                            Validar & Concluir
                          </button>
                        </div>

                        {pinError && (
                          <p className="text-rose-500 text-xs font-bold text-center">
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
          <div className={`p-4 space-y-4 min-h-[380px] transition-colors ${
            isDarkMode ? "bg-slate-900" : "bg-gray-50"
          }`}>
            <div className={`border rounded-2xl p-5 space-y-3 shadow-md transition-colors ${
              isDarkMode ? "bg-slate-800/90 border-slate-700" : "bg-white border-gray-200"
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  isDarkMode ? "text-slate-400" : "text-gray-500"
                }`}>
                  RESUMO FINANCEIRO DE HOJE
                </span>
                <TrendingUp className={`w-5 h-5 ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`} />
              </div>

              <div className={`text-3xl font-black ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                R$ {totalEarningsToday.toFixed(2)}
              </div>

              <div className={`grid grid-cols-2 gap-2 text-xs pt-2 border-t ${
                isDarkMode ? "border-slate-700/60" : "border-gray-200"
              }`}>
                <div>
                  <span className={`block text-[10px] ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                    Entregas Concluídas
                  </span>
                  <span className={`font-bold ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                    {sessionCompletedOrders.length + (activeCourier?.deliveriesTodayCount || 0)}
                  </span>
                </div>
                <div>
                  <span className={`block text-[10px] ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                    Taxa Média por Corrida
                  </span>
                  <span className={`font-bold ${isDarkMode ? "text-slate-100" : "text-gray-900"}`}>
                    R$ 14.80
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className={`font-bold text-xs uppercase tracking-wider ${
                isDarkMode ? "text-slate-300" : "text-gray-700"
              }`}>
                HISTÓRICO DE CORRIDAS RECENTES
              </h4>

              {sessionCompletedOrders.length === 0 ? (
                <div className={`p-4 rounded-xl text-center text-xs border ${
                  isDarkMode ? "bg-slate-950 text-slate-400 border-slate-800" : "bg-gray-50 text-gray-500 border-gray-200"
                }`}>
                  Nenhuma corrida concluída nesta sessão ainda.
                </div>
              ) : (
                sessionCompletedOrders.map((o) => (
                  <div
                    key={o.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isDarkMode ? "bg-slate-950 border-slate-800" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div>
                      <span className={`font-bold block ${isDarkMode ? "text-slate-200" : "text-gray-800"}`}>
                        {o.displayId} - {o.customerName}
                      </span>
                      <span className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-gray-500"}`}>
                        {o.deliveryAddress.neighborhood}
                      </span>
                    </div>
                    <span className={`font-bold ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
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


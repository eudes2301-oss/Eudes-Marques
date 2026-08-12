import React, { useState } from "react";
import { Order, Courier, StoreInfo, OrderStatus } from "../types";
import { MapView } from "./MapView";
import { CourierManagement } from "./CourierManagement";
import {
  ShoppingBag,
  Bike,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  MapPin,
  Phone,
  Plus,
  Volume2,
  VolumeX,
  ChevronRight,
  Filter,
  DollarSign,
  Users
} from "lucide-react";

interface AdminDashboardProps {
  orders: Order[];
  couriers: Courier[];
  storeInfo: StoreInfo;
  onAssignOrder: (orderId: string, courierId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onCreateManualOrder: (newOrder: Partial<Order>) => void;
  onToggleCourierOnline: (courierId: string, isOnline: boolean) => void;
  onCreateCourier: (newCourier: Courier) => void;
  onUpdateCourier: (updatedCourier: Courier) => void;
  onDeleteCourier: (courierId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  couriers,
  storeInfo,
  onAssignOrder,
  onUpdateStatus,
  onCreateManualOrder,
  onToggleCourierOnline,
  onCreateCourier,
  onUpdateCourier,
  onDeleteCourier,
}) => {
  const [adminTab, setAdminTab] = useState<"dispatch" | "couriers">("dispatch");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedCourierId, setSelectedCourierId] = useState<string | undefined>(undefined);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);

  // Manual Order Form State
  const [manualCustomer, setManualCustomer] = useState({
    name: "",
    phone: "",
    street: "",
    number: "",
    neighborhood: "",
    items: "",
    total: "",
    payment: "Dinheiro na Entrega" as const,
  });

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "NEW") return order.status === "PLACED" || order.status === "CONFIRMED";
    if (statusFilter === "PREPARING") return order.status === "PREPARING" || order.status === "READY_FOR_PICKUP";
    if (statusFilter === "DISPATCHED") return order.status === "DISPATCHED" || order.status === "IN_TRANSIT";
    if (statusFilter === "DELIVERED") return order.status === "DELIVERED";
    return true;
  });

  const onlineCouriers = couriers.filter((c) => c.isOnline);
  const pendingAssignmentOrders = orders.filter((o) => o.status === "PLACED" || o.status === "READY_FOR_PICKUP");

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PLACED":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">Novo no iFood</span>;
      case "CONFIRMED":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">Confirmado</span>;
      case "PREPARING":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">Em Preparo</span>;
      case "READY_FOR_PICKUP":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">Pronto p/ Retirada</span>;
      case "DISPATCHED":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">Aguardando Coleta</span>;
      case "IN_TRANSIT":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">Em Trânsito</span>;
      case "DELIVERED":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Entregue</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Cancelado</span>;
    }
  };

  const handleCreateManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCustomer.name || !manualCustomer.street || !manualCustomer.total) return;

    onCreateManualOrder({
      customerName: manualCustomer.name,
      customerPhone: manualCustomer.phone || "(11) 99999-8888",
      deliveryAddress: {
        street: manualCustomer.street,
        number: manualCustomer.number || "100",
        neighborhood: manualCustomer.neighborhood || "Centro",
        city: "São Paulo",
        lat: -23.560000 + (Math.random() - 0.5) * 0.02,
        lng: -46.685000 + (Math.random() - 0.5) * 0.02,
      },
      items: [
        {
          id: `manual-item-${Date.now()}`,
          name: manualCustomer.items || "Pedido Balcão/Telefone",
          quantity: 1,
          unitPrice: parseFloat(manualCustomer.total),
        },
      ],
      totalAmount: parseFloat(manualCustomer.total),
      paymentMethod: manualCustomer.payment,
      origin: "Manual",
    });

    setIsManualModalOpen(false);
    setManualCustomer({
      name: "",
      phone: "",
      street: "",
      number: "",
      neighborhood: "",
      items: "",
      total: "",
      payment: "Dinheiro na Entrega",
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Admin Sub-Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setAdminTab("dispatch")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              adminTab === "dispatch"
                ? "bg-[#EA1D2C] text-white shadow-md shadow-rose-950/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Painel de Despacho & Rastreamento
          </button>

          <button
            onClick={() => setAdminTab("couriers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              adminTab === "couriers"
                ? "bg-[#EA1D2C] text-white shadow-md shadow-rose-950/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            Gestão de Entregadores (CRUD)
            <span className="bg-slate-900 border border-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded-full text-[10px]">
              {couriers.length}
            </span>
          </button>
        </div>
      </div>

      {adminTab === "couriers" ? (
        <CourierManagement
          couriers={couriers}
          onCreateCourier={onCreateCourier}
          onUpdateCourier={onUpdateCourier}
          onDeleteCourier={onDeleteCourier}
          onToggleCourierOnline={onToggleCourierOnline}
        />
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Fila de Pedidos</span>
            <ShoppingBag className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-100">{orders.length}</span>
            <span className="text-xs text-amber-400 font-semibold">{pendingAssignmentOrders.length} aguardando</span>
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Entregadores Online</span>
            <Bike className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">{onlineCouriers.length} / {couriers.length}</span>
            <span className="text-xs text-emerald-500 font-medium">GPS Ativo</span>
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Em Trânsito Agora</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-sky-400">
              {orders.filter((o) => o.status === "IN_TRANSIT" || o.status === "DISPATCHED").length}
            </span>
            <span className="text-xs text-slate-400">Rotas ativas</span>
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Entregues Hoje</span>
            <CheckCircle2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-purple-300">
              {orders.filter((o) => o.status === "DELIVERED").length}
            </span>
            <span className="text-xs text-purple-400 font-medium">Finalizados</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Real-time Orders Queue */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Header & Filters */}
          <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-rose-500" />
                  Painel de Despacho em Tempo Real
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
                    soundEnabled
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      : "bg-slate-700/50 border-slate-600 text-slate-400"
                  }`}
                  title="Alerta sonoro ao chegar novo pedido do iFood"
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsManualModalOpen(true)}
                  className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-rose-950/40"
                >
                  <Plus className="w-4 h-4" />
                  Novo Pedido
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
              {[
                { id: "ALL", label: "Todos" },
                { id: "NEW", label: "Novos iFood" },
                { id: "PREPARING", label: "Preparo / Prontos" },
                { id: "DISPATCHED", label: "Em Rota" },
                { id: "DELIVERED", label: "Entregues" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1 rounded-md font-medium transition-all whitespace-nowrap ${
                    statusFilter === f.id
                      ? "bg-slate-100 text-slate-900 font-bold"
                      : "text-slate-400 hover:bg-slate-700/60 hover:text-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Orders List */}
          <div className="space-y-3 max-h-[720px] overflow-y-auto pr-1">
            {filteredOrders.length === 0 ? (
              <div className="bg-slate-800/40 rounded-xl p-8 text-center border border-slate-800">
                <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Nenhum pedido encontrado neste filtro.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrderId === order.id;

                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`bg-slate-800/90 rounded-xl p-4 border transition-all cursor-pointer relative ${
                      isSelected
                        ? "border-rose-500 ring-2 ring-rose-500/20 bg-slate-800"
                        : "border-slate-700/70 hover:border-slate-600"
                    }`}
                  >
                    {/* Header line */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            order.origin === "iFood"
                              ? "bg-rose-500 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {order.origin}
                        </span>
                        <span className="font-bold text-sm text-slate-100">{order.displayId}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>

                      <div>{getStatusBadge(order.status)}</div>
                    </div>

                    {/* Customer & Address */}
                    <div className="py-3 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-200">{order.customerName}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {order.customerPhone}
                        </span>
                      </div>

                      <div className="flex items-start gap-1.5 text-xs text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>
                          {order.deliveryAddress.street}, {order.deliveryAddress.number} - {order.deliveryAddress.neighborhood}
                        </span>
                      </div>
                    </div>

                    {/* Items snippet */}
                    <div className="bg-slate-900/60 rounded-lg p-2 text-xs space-y-1 text-slate-300">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-slate-400">R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-800 pt-1 flex justify-between font-bold text-slate-100">
                        <span>Total ({order.paymentMethod})</span>
                        <span className="text-emerald-400">R$ {order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Dispatcher Actions */}
                    <div className="pt-3 mt-3 border-t border-slate-700/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      
                      {/* Courier Assignment Selector */}
                      <div className="flex-1">
                        {order.status === "DELIVERED" ? (
                          <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Entregue por {order.assignedCourierName || "Entregador"}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                            <select
                              value={order.assignedCourierId || ""}
                              onChange={(e) => {
                                if (e.target.value) {
                                  onAssignOrder(order.id, e.target.value);
                                }
                              }}
                              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 w-full focus:outline-none focus:border-rose-500"
                            >
                              <option value="">Atribuir Entregador...</option>
                              {onlineCouriers.map((c) => (
                                <option key={c.id} value={c.id}>
                                  🟢 {c.name} ({c.vehicle}) {c.activeOrderId ? " - Em Rota" : " - Livre"}
                                </option>
                              ))}
                              {couriers.filter((c) => !c.isOnline).map((c) => (
                                <option key={c.id} value={c.id} disabled>
                                  🔴 {c.name} (Offline)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Status Flow Buttons */}
                      {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {order.status === "PLACED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStatus(order.id, "PREPARING");
                              }}
                              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                            >
                              Iniciar Preparo
                            </button>
                          )}

                          {order.status === "PREPARING" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStatus(order.id, "READY_FOR_PICKUP");
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                            >
                              Marcar Pronto
                            </button>
                          )}

                          {order.assignedCourierId && order.status === "DISPATCHED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStatus(order.id, "IN_TRANSIT");
                              }}
                              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                            >
                              Coletado / Em Trânsito
                            </button>
                          )}

                          {order.status === "IN_TRANSIT" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStatus(order.id, "DELIVERED");
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                            >
                              Concluir Entrega
                            </button>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Live Map & Couriers Radar */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Map Card */}
          <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                Mapa de Geolocalização das Entregas
              </h2>
              <span className="text-xs text-slate-400">Atualizado via WebSockets</span>
            </div>

            <div className="h-[380px]">
              <MapView
                storeInfo={storeInfo}
                couriers={couriers}
                orders={orders}
                selectedCourierId={selectedCourierId}
                selectedOrderId={selectedOrderId}
              />
            </div>
          </div>

          {/* Couriers Radar List */}
          <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <Bike className="w-4 h-4 text-emerald-400" />
                Radar de Entregadores ({onlineCouriers.length} Online)
              </h3>
              <span className="text-xs text-slate-400">GPS Continuo</span>
            </div>

            <div className="space-y-2">
              {couriers.map((courier) => {
                const isSelected = selectedCourierId === courier.id;

                return (
                  <div
                    key={courier.id}
                    onClick={() => setSelectedCourierId(courier.id)}
                    className={`p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-slate-700 border-sky-500 ring-1 ring-sky-500/30"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200">
                          {courier.vehicle === "Moto" ? "🛵" : courier.vehicle === "Carro" ? "🚗" : "🚲"}
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                            courier.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-600"
                          }`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-100">{courier.name}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {courier.vehicle} {courier.plate ? `(${courier.plate})` : ""}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>★ {courier.rating.toFixed(1)}</span>
                          <span>•</span>
                          <span>{courier.deliveriesTodayCount} entregas hoje</span>
                          {courier.batteryLevel && (
                            <>
                              <span>•</span>
                              <span>🔋 {courier.batteryLevel}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {courier.activeOrderId ? (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-semibold">
                          Em Pedido
                        </span>
                      ) : courier.isOnline ? (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
                          Livre
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded">
                          Offline
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCourierOnline(courier.id, !courier.isOnline);
                        }}
                        className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-all ${
                          courier.isOnline
                            ? "bg-slate-800 hover:bg-slate-700 text-rose-400 border border-slate-700"
                            : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                      >
                        {courier.isOnline ? "Desconectar" : "Conectar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Manual Order Modal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-base">Lançar Pedido Manual (Telefone / WhatsApp)</h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nome do Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Roberto Alves"
                  value={manualCustomer.name}
                  onChange={(e) => setManualCustomer({ ...manualCustomer, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Telefone WhatsApp</label>
                <input
                  type="text"
                  placeholder="(11) 99999-0000"
                  value={manualCustomer.phone}
                  onChange={(e) => setManualCustomer({ ...manualCustomer, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Rua / Endereço</label>
                  <input
                    type="text"
                    required
                    placeholder="Rua Teodoro Sampaio"
                    value={manualCustomer.street}
                    onChange={(e) => setManualCustomer({ ...manualCustomer, street: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Número</label>
                  <input
                    type="text"
                    required
                    placeholder="120"
                    value={manualCustomer.number}
                    onChange={(e) => setManualCustomer({ ...manualCustomer, number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Bairro</label>
                <input
                  type="text"
                  placeholder="Pinheiros"
                  value={manualCustomer.neighborhood}
                  onChange={(e) => setManualCustomer({ ...manualCustomer, neighborhood: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Itens do Pedido</label>
                <input
                  type="text"
                  placeholder="Ex: 1x Marmita Comercial + 1x Coca-Cola"
                  value={manualCustomer.items}
                  onChange={(e) => setManualCustomer({ ...manualCustomer, items: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="45.00"
                    value={manualCustomer.total}
                    onChange={(e) => setManualCustomer({ ...manualCustomer, total: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Forma de Pagamento</label>
                  <select
                    value={manualCustomer.payment}
                    onChange={(e: any) => setManualCustomer({ ...manualCustomer, payment: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="Dinheiro na Entrega">Dinheiro na Entrega</option>
                    <option value="Cartão Entrega">Cartão na Entrega</option>
                    <option value="Online iFood">Pago Online</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-500"
                >
                  Criar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

import React, { useState } from "react";
import { Order, Courier, StoreInfo, IFoodConfig, OrderStatus, IFoodWebhookPayload, User } from "../types";
import { AdminDashboard } from "../components/AdminDashboard";
import { IFoodSimulator } from "../components/IFoodSimulator";
import { ArchitectureDoc } from "../components/ArchitectureDoc";
import { ShieldCheck, Zap, BookOpen, LogOut, Radio, UserCheck } from "lucide-react";

interface AdminPageProps {
  orders: Order[];
  couriers: Courier[];
  storeInfo: StoreInfo;
  ifoodConfig: IFoodConfig;
  lastWebhookReceived?: IFoodWebhookPayload;
  currentUser: User | null;
  isConnected: boolean;
  onAssignOrder: (orderId: string, courierId: string) => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onCreateManualOrder: (newOrderPartial: Partial<Order>) => void;
  onToggleCourierOnline: (courierId: string, isOnline: boolean) => void;
  onCreateCourier: (newCourier: Courier) => void;
  onUpdateCourier: (updatedCourier: Courier) => void;
  onDeleteCourier: (courierId: string) => void;
  onSimulateOrder: () => void;
  onNavigateToLogin: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  orders,
  couriers,
  storeInfo,
  ifoodConfig,
  lastWebhookReceived,
  currentUser,
  isConnected,
  onAssignOrder,
  onUpdateStatus,
  onCreateManualOrder,
  onToggleCourierOnline,
  onCreateCourier,
  onUpdateCourier,
  onDeleteCourier,
  onSimulateOrder,
  onNavigateToLogin,
}) => {
  const [adminTab, setAdminTab] = useState<"dashboard" | "simulator" | "architecture">("dashboard");

  const pendingCount = orders.filter((o) => o.status === "PLACED" || o.status === "READY_FOR_PICKUP").length;
  const onlineCount = couriers.filter((c) => c.isOnline).length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner Header for Admin Page */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EA1D2C] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-rose-950/60 shrink-0">
            iF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-white tracking-tight">
                Página do Administrador
              </h1>
              <span className="bg-[#EA1D2C]/10 text-[#EA1D2C] border border-[#EA1D2C]/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                Painel de Gestão
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gestor: <strong className="text-slate-200">{currentUser?.name || "Administrador"}</strong> • Hub: {storeInfo.name}
            </p>
          </div>
        </div>

        {/* Navigation Tabs within Admin Page */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setAdminTab("dashboard")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              adminTab === "dashboard"
                ? "bg-[#EA1D2C] text-white shadow-md shadow-rose-950/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Despacho & Frota
            {pendingCount > 0 && (
              <span className="ml-1 bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setAdminTab("simulator")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              adminTab === "simulator"
                ? "bg-amber-600 text-white shadow-md shadow-amber-900/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-4 h-4" />
            Simulador iFood
          </button>

          <button
            onClick={() => setAdminTab("architecture")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              adminTab === "architecture"
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Arquitetura
          </button>
        </div>

        {/* Action Button to switch account / go to Login */}
        <button
          onClick={onNavigateToLogin}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Sair / Trocar Acesso</span>
        </button>

      </div>

      {/* Main Admin Tab Content */}
      {adminTab === "dashboard" && (
        <AdminDashboard
          orders={orders}
          couriers={couriers}
          storeInfo={storeInfo}
          onAssignOrder={onAssignOrder}
          onUpdateStatus={onUpdateStatus}
          onCreateManualOrder={onCreateManualOrder}
          onToggleCourierOnline={onToggleCourierOnline}
          onCreateCourier={onCreateCourier}
          onUpdateCourier={onUpdateCourier}
          onDeleteCourier={onDeleteCourier}
        />
      )}

      {adminTab === "simulator" && (
        <IFoodSimulator
          ifoodConfig={ifoodConfig}
          onSimulateOrder={onSimulateOrder}
          lastWebhookReceived={lastWebhookReceived}
        />
      )}

      {adminTab === "architecture" && <ArchitectureDoc />}

    </div>
  );
};

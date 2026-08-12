import React from "react";
import { Courier, Order, OrderStatus, User } from "../types";
import { CourierApp } from "../components/CourierApp";
import { Smartphone, LogOut, Radio, Bike, CheckCircle2 } from "lucide-react";

interface CourierPageProps {
  couriers: Courier[];
  orders: Order[];
  currentUser: User | null;
  onUpdateLocation: (courierId: string, lat: number, lng: number, batteryLevel?: number) => void;
  onToggleOnline: (courierId: string, isOnline: boolean) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onNavigateToLogin: () => void;
}

export const CourierPage: React.FC<CourierPageProps> = ({
  couriers,
  orders,
  currentUser,
  onUpdateLocation,
  onToggleOnline,
  onUpdateOrderStatus,
  onNavigateToLogin,
}) => {
  const activeCourier = couriers.find((c) => c.id === currentUser?.courierId) || couriers[0];

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header Banner for Courier Page */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#EA1D2C] text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-rose-950/60 shrink-0">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-white tracking-tight">
                Página do Entregador
              </h1>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                App iFood Entregadores
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Entregador Ativo: <strong className="text-slate-100">{activeCourier?.name || currentUser?.name}</strong> • Veículo: {activeCourier?.vehicle} {activeCourier?.plate ? `(${activeCourier?.plate})` : ""}
            </p>
          </div>
        </div>

        {/* Action Button to exit / switch account */}
        <button
          onClick={onNavigateToLogin}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <LogOut className="w-4 h-4 text-slate-400" />
          <span>Sair / Trocar Entregador</span>
        </button>
      </div>

      {/* Mobile App Container */}
      <CourierApp
        couriers={couriers}
        orders={orders}
        onUpdateLocation={onUpdateLocation}
        onToggleOnline={onToggleOnline}
        onUpdateOrderStatus={onUpdateOrderStatus}
        activeCourierUser={activeCourier}
      />

    </div>
  );
};

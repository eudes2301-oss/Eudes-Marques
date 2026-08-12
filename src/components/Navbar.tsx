import React from "react";
import { User } from "../types";
import { Truck, ShieldCheck, Smartphone, Zap, BookOpen, Wifi, WifiOff, LogOut, UserCheck } from "lucide-react";

interface NavbarProps {
  currentView: "admin" | "courier" | "simulator" | "architecture";
  onViewChange: (view: "admin" | "courier" | "simulator" | "architecture") => void;
  isConnected: boolean;
  pendingOrdersCount: number;
  onlineCouriersCount: number;
  currentUser: User | null;
  onOpenLoginModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  isConnected,
  pendingOrdersCount,
  onlineCouriersCount,
  currentUser,
  onOpenLoginModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3 gap-3 md:gap-0">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EA1D2C] flex items-center justify-center text-white shadow-lg shadow-rose-950/60 font-black text-xl tracking-tighter">
              iF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-slate-100 tracking-tight leading-none">
                  iFood Logística & Entregadores
                </h1>
                <span className="bg-[#EA1D2C]/10 text-[#EA1D2C] border border-[#EA1D2C]/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  OFICIAL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Painel de Gestão & App de Entregas
              </p>
            </div>
          </div>

          {/* Navigation View Selector Tabs */}
          <nav className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner overflow-x-auto max-w-full">
            <button
              onClick={() => onViewChange("admin")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                currentView === "admin"
                  ? "bg-[#EA1D2C] text-white shadow-md shadow-rose-950/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Painel Admin
              {pendingOrdersCount > 0 && (
                <span className="ml-1 bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black text-[10px]">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onViewChange("courier")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                currentView === "courier"
                  ? "bg-[#EA1D2C] text-white shadow-md shadow-rose-950/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              App Entregador
              {onlineCouriersCount > 0 && (
                <span className="ml-1 bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-bold text-[10px]">
                  {onlineCouriersCount} online
                </span>
              )}
            </button>

            <button
              onClick={() => onViewChange("simulator")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                currentView === "simulator"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-900/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <Zap className="w-4 h-4" />
              Simulador
            </button>

            <button
              onClick={() => onViewChange("architecture")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                currentView === "architecture"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Arquitetura
            </button>
          </nav>

          {/* User Profile & Login Modal Switcher */}
          <div className="flex items-center gap-3">
            
            {/* WS Connection Status */}
            <div className="hidden xl:flex items-center text-xs">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                  isConnected
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                }`}
              >
                {isConnected ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                    <span className="font-semibold text-[11px]">WS On</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold text-[11px]">Reconectando</span>
                  </>
                )}
              </div>
            </div>

            {/* User Access Button */}
            <button
              onClick={onOpenLoginModal}
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              <div className="w-2 h-2 rounded-full bg-[#EA1D2C]" />
              {currentUser ? (
                <span>
                  {currentUser.role === "admin" ? "Admin" : "Entregador"}: <span className="text-white font-extrabold">{currentUser.name}</span>
                </span>
              ) : (
                <span>Painel de Acesso</span>
              )}
              <LogOut className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};


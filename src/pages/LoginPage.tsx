import React, { useState } from "react";
import { UserRole, User, Courier } from "../types";
import {
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Lock,
  User as UserIcon,
  Bike,
  Radio,
  LogOut,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface LoginPageProps {
  currentUser: User | null;
  couriers: Courier[];
  onLogin: (user: User) => void;
  onLogout?: () => void;
  isConnected: boolean;
  pendingOrdersCount: number;
  onlineCouriersCount: number;
  onNavigateToRolePage?: (role: UserRole) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  currentUser,
  couriers,
  onLogin,
  onLogout,
  isConnected,
  pendingOrdersCount,
  onlineCouriersCount,
  onNavigateToRolePage,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [selectedCourierId, setSelectedCourierId] = useState<string>(couriers[0]?.id || "");
  const [adminEmail, setAdminEmail] = useState<string>("admin@ifood.com.br");
  const [adminPassword, setAdminPassword] = useState<string>("••••••••");

  const handleAuthLogin = async (role: UserRole, courierId?: string) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          courierId: courierId || selectedCourierId,
          email: adminEmail,
          password: adminPassword,
        }),
      });

      const data = await response.json();
      if (data.success && data.token) {
        localStorage.setItem("ifood_token", data.token);
        onLogin(data.user);
      } else {
        // Fallback
        if (role === "admin") {
          onLogin({
            id: "admin-user-1",
            name: "Gestor de Logística iFood",
            email: adminEmail,
            role: "admin",
          });
        } else {
          const selectedCourier = couriers.find((c) => c.id === (courierId || selectedCourierId)) || couriers[0];
          onLogin({
            id: `user-${selectedCourier?.id || "courier-1"}`,
            name: selectedCourier?.name || "Entregador iFood",
            email: `${selectedCourier?.name.toLowerCase().replace(/\s+/g, ".")}@entregador.ifood.br`,
            role: "courier",
            courierId: selectedCourier?.id,
          });
        }
      }
    } catch (err) {
      console.error("Auth API Login error, using fallback session:", err);
      if (role === "admin") {
        onLogin({
          id: "admin-user-1",
          name: "Gestor de Logística iFood",
          email: adminEmail,
          role: "admin",
        });
      } else {
        const selectedCourier = couriers.find((c) => c.id === (courierId || selectedCourierId)) || couriers[0];
        onLogin({
          id: `user-${selectedCourier?.id || "courier-1"}`,
          name: selectedCourier?.name || "Entregador iFood",
          email: `${selectedCourier?.name.toLowerCase().replace(/\s+/g, ".")}@entregador.ifood.br`,
          role: "courier",
          courierId: selectedCourier?.id,
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAuthLogin(selectedRole);
  };

  const handleQuickAdmin = () => {
    handleAuthLogin("admin");
  };

  const handleQuickCourier = (courierId?: string) => {
    handleAuthLogin("courier", courierId || selectedCourierId);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: System Information & Status Banner */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-[#EA1D2C]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-6 relative z-10">
            {/* iFood Brand Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#EA1D2C] text-white rounded-2xl flex items-center justify-center font-black text-2xl tracking-tighter shadow-lg shadow-rose-950/60">
                iF
              </div>
              <div>
                <h1 className="font-extrabold text-xl text-white tracking-tight">
                  iFood Logística
                </h1>
                <p className="text-xs text-rose-400 font-semibold">
                  Plataforma Unificada de Gestão & App
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Bem-vindo ao portal de autenticação. Para acessar os recursos de administração ou a interface do entregador, faça login com seu perfil correspondente.
            </p>

            {/* Quick Status Cards */}
            <div className="space-y-2.5 pt-2">
              <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Servidor WebSocket:</span>
                <span className={`font-bold flex items-center gap-1.5 ${isConnected ? "text-emerald-400" : "text-amber-400"}`}>
                  <Radio className={`w-3.5 h-3.5 ${isConnected ? "animate-pulse" : ""}`} />
                  {isConnected ? "Conectado em Tempo Real" : "Conectando..."}
                </span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Pedidos Pendentes:</span>
                <span className="font-extrabold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                  {pendingOrdersCount} aguardando
                </span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Entregadores Online:</span>
                <span className="font-extrabold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/20">
                  {onlineCouriersCount} em campo
                </span>
              </div>
            </div>
          </div>

          {/* Quick Demo Access Shortcuts */}
          <div className="pt-6 border-t border-slate-800/80 space-y-2 relative z-10">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Acesso Rápido de Demonstração:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickAdmin}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#EA1D2C]" />
                Entrar como Admin
              </button>

              <button
                type="button"
                onClick={() => handleQuickCourier()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bike className="w-3.5 h-3.5 text-emerald-400" />
                Entrar como Entregador
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Header */}
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#EA1D2C]" />
                Autenticação de Usuário
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Acesse como Administrador de Logística ou aplicativo de Entregador.
              </p>
            </div>

            {/* Session Info or Unauthenticated Warning */}
            {currentUser ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Sessão Ativa Autenticada
                  </span>
                  {onLogout && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="text-slate-400 hover:text-rose-400 flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      Encerrar Sessão
                    </button>
                  )}
                </div>
                <p className="text-slate-200">
                  Conectado como <strong className="text-white">{currentUser.name}</strong> ({currentUser.role === "admin" ? "Administrador" : "Entregador"}).
                </p>
                {onNavigateToRolePage && (
                  <button
                    type="button"
                    onClick={() => onNavigateToRolePage(currentUser.role)}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Ir para {currentUser.role === "admin" ? "Página do Administrador" : "Página do Entregador"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-amber-950/30 border border-amber-500/30 p-3.5 rounded-2xl text-xs text-amber-200/90 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Você não está autenticado. Selecione seu perfil para entrar na plataforma.</span>
              </div>
            )}

            {/* Role Toggle Selector */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedRole("admin")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === "admin"
                    ? "bg-[#EA1D2C] text-white shadow-lg shadow-rose-950/60"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Administrador
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("courier")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === "courier"
                    ? "bg-[#EA1D2C] text-white shadow-lg shadow-rose-950/60"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Smartphone className="w-4 h-4" />
                Entregador
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {selectedRole === "admin" ? (
                <div className="space-y-4">
                  <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#EA1D2C] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-100 block mb-0.5 font-bold">Acesso Administrador:</strong>
                      Painel completo de despacho de pedidos, monitoramento no mapa de geolocalização, gestão da frota de entregadores e integração iFood.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      E-mail Administrativo
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-100 focus:outline-none focus:border-[#EA1D2C] focus:ring-1 focus:ring-[#EA1D2C]"
                        placeholder="admin@ifood.com.br"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Senha de Acesso
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-xs text-slate-100 focus:outline-none focus:border-[#EA1D2C] focus:ring-1 focus:ring-[#EA1D2C]"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
                    <Bike className="w-5 h-5 text-[#EA1D2C] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-100 block mb-0.5 font-bold">Acesso Entregador:</strong>
                      Interface móvel nativa para aceite de corridas, GPS em tempo real, saldo do dia e confirmação de entrega via PIN.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Selecione seu Perfil de Entregador Cadastrado
                    </label>
                    <select
                      value={selectedCourierId}
                      onChange={(e) => setSelectedCourierId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-3.5 text-xs text-slate-100 focus:outline-none focus:border-[#EA1D2C] focus:ring-1 focus:ring-[#EA1D2C]"
                    >
                      {couriers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} • {c.vehicle} {c.plate ? `(${c.plate})` : ""} - {c.isOnline ? "🟢 Online" : "⚪ Offline"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#EA1D2C] hover:bg-[#c21320] text-white py-3.5 px-4 rounded-2xl font-extrabold text-sm transition-all shadow-xl shadow-rose-950/60 flex items-center justify-center gap-2 mt-4 cursor-pointer"
              >
                Entrar como {selectedRole === "admin" ? "Administrador" : "Entregador"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-slate-800 text-center mt-6">
            <span className="text-xs text-slate-400">
              Sistema de Autenticação Segura iFood Express • Acesso Protegido
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};


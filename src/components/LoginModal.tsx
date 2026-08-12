import React, { useState } from "react";
import { UserRole, User, Courier } from "../types";
import { ShieldCheck, Smartphone, CheckCircle, ArrowRight, Lock, User as UserIcon, Bike } from "lucide-react";

interface LoginModalProps {
  currentUser: User | null;
  couriers: Courier[];
  onSelectRole: (user: User) => void;
  onClose?: () => void;
  isOpen: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  currentUser,
  couriers,
  onSelectRole,
  onClose,
  isOpen,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [selectedCourierId, setSelectedCourierId] = useState<string>(couriers[0]?.id || "");
  const [adminEmail, setAdminEmail] = useState<string>("admin@ifood.com.br");
  const [adminPassword, setAdminPassword] = useState<string>("••••••••");

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole === "admin") {
      onSelectRole({
        id: "admin-user-1",
        name: "Gestor de Logística iFood",
        email: adminEmail,
        role: "admin",
      });
    } else {
      const selectedCourier = couriers.find((c) => c.id === selectedCourierId) || couriers[0];
      onSelectRole({
        id: `user-${selectedCourier?.id || "courier-1"}`,
        name: selectedCourier?.name || "Entregador iFood",
        email: `${selectedCourier?.name.toLowerCase().replace(/\s+/g, ".")}@entregador.ifood.br`,
        role: "courier",
        courierId: selectedCourier?.id,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative">
        
        {/* iFood Red Brand Header */}
        <div className="bg-[#EA1D2C] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="w-14 h-14 bg-white text-[#EA1D2C] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg font-black text-2xl tracking-tighter">
            iF
          </div>

          <h2 className="text-xl font-extrabold tracking-tight">
            Painel de Acesso iFood
          </h2>
          <p className="text-xs text-rose-100/90 mt-1 font-medium">
            Selecione seu nível de acesso para acessar o sistema
          </p>

          {onClose && currentUser && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 rounded-full p-1.5 transition-all text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Role Selector Tabs */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedRole("admin")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                selectedRole === "admin"
                  ? "bg-[#EA1D2C] text-white shadow-md shadow-rose-950/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Administrador
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("courier")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                selectedRole === "courier"
                  ? "bg-[#EA1D2C] text-white shadow-md shadow-rose-950/50"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Entregador
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {selectedRole === "admin" ? (
              <div className="space-y-3">
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#EA1D2C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100 block mb-0.5">Nível Administrador:</strong>
                    Acesso completo ao Painel de Despacho, Mapa de Geolocalização, Simulador iFood e **Gestão completa de Entregadores (Cadastro, Edição e Exclusão)**.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail de Administrador
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-100 focus:outline-none focus:border-[#EA1D2C]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Senha de Segurança
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-xs text-slate-100 focus:outline-none focus:border-[#EA1D2C]"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2">
                  <Bike className="w-4 h-4 text-[#EA1D2C] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-100 block mb-0.5">Nível Entregador:</strong>
                    Acesso direto ao aplicativo **iFood Entregadores**, aceite de corridas, saldo de ganhos do dia e GPS em tempo real.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Selecione seu Perfil de Entregador Cadastrado
                  </label>
                  <select
                    value={selectedCourierId}
                    onChange={(e) => setSelectedCourierId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-100 focus:outline-none focus:border-[#EA1D2C]"
                  >
                    {couriers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} • {c.vehicle} {c.plate ? `(${c.plate})` : ""} - {c.isOnline ? "Online" : "Offline"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#EA1D2C] hover:bg-[#c21320] text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2"
            >
              Entrar como {selectedRole === "admin" ? "Administrador" : "Entregador"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {currentUser && (
            <div className="border-t border-slate-800 pt-3 text-center">
              <span className="text-xs text-slate-400">
                Conectado atualmente como <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.role === "admin" ? "Administrador" : "Entregador"})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

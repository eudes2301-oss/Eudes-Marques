import React, { useState } from "react";
import { Courier } from "../types";
import {
  UserPlus,
  Edit2,
  Trash2,
  Bike,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Phone,
  Star,
  ShieldAlert,
  X,
  CreditCard,
  BatteryCharging
} from "lucide-react";

interface CourierManagementProps {
  couriers: Courier[];
  onCreateCourier: (newCourier: Courier) => void;
  onUpdateCourier: (updatedCourier: Courier) => void;
  onDeleteCourier: (courierId: string) => void;
  onToggleCourierOnline: (courierId: string, isOnline: boolean) => void;
}

export const CourierManagement: React.FC<CourierManagementProps> = ({
  couriers,
  onCreateCourier,
  onUpdateCourier,
  onDeleteCourier,
  onToggleCourierOnline,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [deletingCourier, setDeletingCourier] = useState<Courier | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    cpf: string;
    vehicle: "Moto" | "Bicicleta" | "Carro" | "Patinete";
    plate: string;
    rating: number;
  }>({
    name: "",
    phone: "",
    cpf: "",
    vehicle: "Moto",
    plate: "",
    rating: 4.9,
  });

  const handleOpenCreate = () => {
    setFormData({
      name: "",
      phone: "(11) 9",
      cpf: "",
      vehicle: "Moto",
      plate: "",
      rating: 5.0,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (courier: Courier) => {
    setEditingCourier(courier);
    setFormData({
      name: courier.name,
      phone: courier.phone,
      cpf: courier.cpf || "",
      vehicle: courier.vehicle,
      plate: courier.plate || "",
      rating: courier.rating,
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    const newCourier: Courier = {
      id: `courier-${Date.now()}`,
      name: formData.name,
      phone: formData.phone,
      cpf: formData.cpf,
      vehicle: formData.vehicle,
      plate: formData.plate,
      isOnline: true,
      currentLat: -23.561684 + (Math.random() - 0.5) * 0.015,
      currentLng: -46.688123 + (Math.random() - 0.5) * 0.015,
      lastLocationUpdate: new Date().toISOString(),
      rating: formData.rating,
      deliveriesTodayCount: 0,
      earningsToday: 0,
      batteryLevel: 100,
    };

    onCreateCourier(newCourier);
    setIsCreateModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourier) return;

    const updatedCourier: Courier = {
      ...editingCourier,
      name: formData.name,
      phone: formData.phone,
      cpf: formData.cpf,
      vehicle: formData.vehicle,
      plate: formData.plate,
      rating: formData.rating,
    };

    onUpdateCourier(updatedCourier);
    setEditingCourier(null);
  };

  const ConfirmDeleteSubmit = () => {
    if (!deletingCourier) return;
    onDeleteCourier(deletingCourier.id);
    setDeletingCourier(null);
  };

  // Filtering
  const filteredCouriers = couriers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.plate && c.plate.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesVehicle = vehicleFilter === "ALL" || c.vehicle === vehicleFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ONLINE" && c.isOnline) ||
      (statusFilter === "OFFLINE" && !c.isOnline);

    return matchesSearch && matchesVehicle && matchesStatus;
  });

  const onlineCount = couriers.filter((c) => c.isOnline).length;
  const offlineCount = couriers.length - onlineCount;

  return (
    <div className="space-y-6">
      
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bike className="w-6 h-6 text-[#EA1D2C]" />
            Gestão de Entregadores iFood
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastro, edição e exclusão de entregadores em tempo real no banco de dados.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-[#EA1D2C] hover:bg-[#c21320] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-rose-950/40"
        >
          <UserPlus className="w-4 h-4" />
          Cadastrar Novo Entregador
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-md">
          <span className="text-xs text-slate-400 font-medium">Total de Entregadores</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-100">{couriers.length}</div>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-md">
          <span className="text-xs text-slate-400 font-medium">Online (Disponíveis)</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-400 flex items-center gap-2">
            {onlineCount}
            <span className="text-xs text-emerald-500 font-normal">
              ({((onlineCount / (couriers.length || 1)) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-md">
          <span className="text-xs text-slate-400 font-medium">Offline</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-400">{offlineCount}</div>
        </div>

        <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 shadow-md">
          <span className="text-xs text-slate-400 font-medium">Média de Avaliações</span>
          <div className="mt-2 text-2xl font-extrabold text-amber-400 flex items-center gap-1">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            {(
              couriers.reduce((acc, c) => acc + c.rating, 0) / (couriers.length || 1)
            ).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou placa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-100 focus:outline-none focus:border-[#EA1D2C]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Veículo:
          </span>
          {["ALL", "Moto", "Bicicleta", "Carro", "Patinete"].map((v) => (
            <button
              key={v}
              onClick={() => setVehicleFilter(v)}
              className={`px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                vehicleFilter === v
                  ? "bg-[#EA1D2C] text-white font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              {v === "ALL" ? "Todos" : v}
            </button>
          ))}

          <span className="text-slate-400 font-medium ml-2 shrink-0">Status:</span>
          {["ALL", "ONLINE", "OFFLINE"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-lg font-medium transition-all whitespace-nowrap ${
                statusFilter === s
                  ? "bg-slate-100 text-slate-900 font-bold"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              {s === "ALL" ? "Todos" : s === "ONLINE" ? "Online" : "Offline"}
            </button>
          ))}
        </div>
      </div>

      {/* Courier Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCouriers.length === 0 ? (
          <div className="col-span-full bg-slate-800/40 rounded-xl p-12 text-center border border-slate-800">
            <ShieldAlert className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 font-semibold text-sm">Nenhum entregador encontrado com os filtros aplicados.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setVehicleFilter("ALL");
                setStatusFilter("ALL");
              }}
              className="mt-3 text-xs text-[#EA1D2C] underline hover:text-rose-400"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          filteredCouriers.map((courier) => (
            <div
              key={courier.id}
              className="bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 shadow-md relative flex flex-col justify-between hover:border-slate-600 transition-all"
            >
              {/* Top Row */}
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl shadow-inner">
                        {courier.vehicle === "Moto"
                          ? "🛵"
                          : courier.vehicle === "Carro"
                          ? "🚗"
                          : courier.vehicle === "Bicicleta"
                          ? "🚲"
                          : "🛴"}
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${
                          courier.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-500"
                        }`}
                      />
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-100 flex items-center gap-1.5">
                        {courier.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {courier.phone}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Vehicle Tag */}
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-700/80">
                    {courier.vehicle} {courier.plate ? `(${courier.plate})` : ""}
                  </span>
                </div>

                {/* Info Pills */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Avaliação iFood</span>
                    <span className="font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {courier.rating.toFixed(1)} / 5.0
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Entregas Hoje</span>
                    <span className="font-bold text-slate-100 mt-0.5 block">
                      {courier.deliveriesTodayCount} entregas
                    </span>
                  </div>

                  {courier.cpf && (
                    <div className="col-span-2 border-t border-slate-800/80 pt-1.5 mt-1">
                      <span className="text-slate-400 block text-[10px]">CPF do Entregador</span>
                      <span className="font-semibold text-slate-300">{courier.cpf}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons (Online Toggle, Edit, Delete) */}
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between gap-2">
                <button
                  onClick={() => onToggleCourierOnline(courier.id, !courier.isOnline)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    courier.isOnline
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                      : "bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {courier.isOnline ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Online
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5 text-slate-500" />
                      Offline
                    </>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(courier)}
                    className="p-2 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white transition-all text-xs flex items-center gap-1"
                    title="Editar dados do entregador"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                    Editar
                  </button>

                  <button
                    onClick={() => setDeletingCourier(courier)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all text-xs flex items-center gap-1"
                    title="Excluir entregador"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {(isCreateModalOpen || editingCourier) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-100 text-base flex items-center gap-2">
                <Bike className="w-5 h-5 text-[#EA1D2C]" />
                {editingCourier ? "Editar Cadastro de Entregador" : "Cadastrar Novo Entregador iFood"}
              </h3>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingCourier(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={editingCourier ? handleEditSubmit : handleCreateSubmit}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mateus Ferreira"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-[#EA1D2C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Telefone celular
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98888-7777"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-[#EA1D2C]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    CPF (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-[#EA1D2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Tipo de Veículo
                  </label>
                  <select
                    value={formData.vehicle}
                    onChange={(e: any) => setFormData({ ...formData, vehicle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-[#EA1D2C]"
                  >
                    <option value="Moto">🛵 Moto</option>
                    <option value="Bicicleta">🚲 Bicicleta</option>
                    <option value="Carro">🚗 Carro</option>
                    <option value="Patinete">🛴 Patinete Elétrico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Placa do Veículo
                  </label>
                  <input
                    type="text"
                    placeholder="ABC-1234 (Se houver)"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-[#EA1D2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nota de Avaliação Inicial
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 5.0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-[#EA1D2C]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingCourier(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#EA1D2C] hover:bg-[#c21320] text-white font-bold transition-all shadow-lg shadow-rose-950/40"
                >
                  {editingCourier ? "Salvar Alterações" : "Concluir Cadastro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deletingCourier && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-[#EA1D2C] flex items-center justify-center mx-auto border border-rose-500/20">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-slate-100 text-base">
              Excluir Entregador?
            </h3>

            <p className="text-xs text-slate-300">
              Tem certeza que deseja remover <strong className="text-slate-100">{deletingCourier.name}</strong> da base de entregadores do iFood? Esta ação é irreversível.
            </p>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingCourier(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={ConfirmDeleteSubmit}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 shadow-md shadow-rose-950/40"
              >
                Sim, Excluir Entregador
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

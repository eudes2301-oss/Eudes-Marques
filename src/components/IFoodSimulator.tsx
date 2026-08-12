import React, { useState } from "react";
import { IFoodConfig, IFoodWebhookPayload } from "../types";
import { Zap, Key, RefreshCw, CheckCircle, Copy, Terminal, ShieldAlert, Send } from "lucide-react";

interface IFoodSimulatorProps {
  ifoodConfig: IFoodConfig;
  onSimulateOrder: () => void;
  lastWebhookReceived?: IFoodWebhookPayload;
}

export const IFoodSimulator: React.FC<IFoodSimulatorProps> = ({
  ifoodConfig,
  onSimulateOrder,
  lastWebhookReceived,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const handleTriggerSimulate = async () => {
    setIsSimulating(true);
    await onSimulateOrder();
    setTimeout(() => {
      setIsSimulating(false);
    }, 400);
  };

  const sampleJsonWebhook = lastWebhookReceived || {
    eventId: "evt-98214-ifood-sp",
    code: "ORDER_CREATED",
    fullCode: "PLC",
    merchantId: ifoodConfig.merchantId,
    orderId: "ord-ifood-sp-8842",
    createdAt: new Date().toISOString(),
    orderData: {
      displayId: "#iFood-9210",
      customerName: "Mariana Costa",
      customerPhone: "(11) 98111-2233",
      deliveryAddress: {
        street: "Rua Fradique Coutinho",
        number: "520",
        neighborhood: "Vila Madalena",
        city: "São Paulo",
        lat: -23.555902,
        lng: -46.689211,
      },
      items: [
        { id: "i-10", name: "Hamburguer Smash Duplo Bacon", quantity: 2, unitPrice: 38.90 },
      ],
      totalAmount: 77.80,
      paymentMethod: "Online iFood",
    },
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(sampleJsonWebhook, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Title & Banner */}
      <div className="bg-gradient-to-r from-rose-900/60 via-slate-900 to-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-950/50">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100">Simulador de Webhooks & Integração API iFood</h2>
            <p className="text-xs text-slate-300">
              Ambiente Sandbox para teste em tempo real de disparo de pedidos e recepção no Painel Admin.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Webhook Trigger & Live Tester */}
        <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700/80 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Send className="w-5 h-5 text-rose-500" />
              Disparador de Pedidos em Tempo Real
            </h3>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
              Webhook Ativo
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Ao clicar no botão abaixo, nosso backend simulará um evento de novo pedido criado no iFood (`ORDER_CREATED`) e disparará o payload diretamente no webhook `/api/ifood/webhook`.
          </p>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <button
              onClick={handleTriggerSimulate}
              disabled={isSimulating}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:bg-slate-700 text-white font-extrabold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-950/50 cursor-pointer"
            >
              <RefreshCw className={`w-5 h-5 ${isSimulating ? "animate-spin" : ""}`} />
              {isSimulating ? "Gerando Pedido iFood..." : "⚡ Disparar Novo Pedido iFood Agora"}
            </button>

            <p className="text-[11px] text-slate-400 text-center">
              O novo pedido surgirá instantaneamente na fila do Painel Admin via WebSockets!
            </p>
          </div>

          {/* Payload Inspector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-amber-400" />
                Payload do Webhook (JSON Schema iFood)
              </span>

              <button
                onClick={handleCopyJson}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copiado!" : "Copiar JSON"}</span>
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-[300px] leading-relaxed">
              {JSON.stringify(sampleJsonWebhook, null, 2)}
            </pre>
          </div>
        </div>

        {/* Right Card: iFood Developer Portal Credentials & Config */}
        <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700/80 space-y-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              Configuração do Portal do Desenvolvedor
            </h3>
            <span className="text-xs text-slate-400">OAuth 2.0 Client Credentials</span>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Merchant ID (ID do Restaurante)</label>
              <input
                type="text"
                readOnly
                value={ifoodConfig.merchantId}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Client ID</label>
              <input
                type="text"
                readOnly
                value={ifoodConfig.clientId}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Client Secret</label>
              <input
                type="password"
                readOnly
                value={ifoodConfig.clientSecret}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">URL Endpoint do Webhook do Sistema</label>
              <input
                type="text"
                readOnly
                value={ifoodConfig.webhookUrl}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono"
              />
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 space-y-1.5">
              <span className="font-bold block flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-blue-400" />
                Como funciona na API oficial do iFood:
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                <li><strong>Autenticação OAuth2:</strong> O sistema realiza chamadas para `/authentication/v1.0/oauth/token` com Client ID e Client Secret.</li>
                <li><strong>Event Polling Fallback:</strong> Caso webhooks falhem, o sistema consulta `/order/v1.0/events:polling` a cada 30s.</li>
                <li><strong>Acknowledgment:</strong> Após processar o pedido, envia `POST /order/v1.0/events/acknowledgment` informando que o evento foi consumido.</li>
              </ul>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

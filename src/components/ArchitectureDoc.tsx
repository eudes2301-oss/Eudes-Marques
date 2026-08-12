import React from "react";
import { Server, Database, Smartphone, Zap, MapPin, ShieldCheck, Code, ArrowRight, CheckCircle } from "lucide-react";

export const ArchitectureDoc: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16 text-slate-200">
      
      {/* Title Header */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-950/50">
            <Code className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              Arquitetura de Software & Guia do Desenvolvedor
            </span>
            <h2 className="text-2xl font-extrabold text-slate-100">
              Plataforma de Logística, Rastreamento GPS & iFood
            </h2>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">
          Relatório técnico completo estruturado por nosso Arquitetor de Software Sênior para orientação na construção de aplicações de logística de alta performance e escala.
        </p>
      </div>

      {/* 1. Stack Tecnológica Recomendada */}
      <section className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-700 pb-3">
          <Server className="w-5 h-5 text-blue-400" />
          1. Stack Tecnológica Recomendada (Front-end, Back-end & Banco de Dados)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Frontend */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-sm text-sky-400 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4" />
              Front-end & PWA Mobile
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>• <strong>React 19 + TypeScript + Vite:</strong> Performance máxima de renderização do mapa e listas.</li>
              <li>• <strong>Tailwind CSS v4:</strong> Estilização responsiva mobile-first com transições fluidas.</li>
              <li>• <strong>PWA (Progressive Web App):</strong> Instalação nativa na tela inicial do celular sem lojas de aplicativos.</li>
              <li>• <strong>Leaflet / OpenStreetMap:</strong> Renderização interativa e leve do mapa com marcadores customizados.</li>
              <li>• <strong>HTML5 Geolocation API:</strong> Uilização de <code className="text-emerald-400">navigator.geolocation.watchPosition</code> com <code className="text-emerald-400">enableHighAccuracy: true</code>.</li>
            </ul>
          </div>

          {/* Backend */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-sm text-rose-400 flex items-center gap-1.5">
              <Server className="w-4 h-4" />
              Back-end & Tempo Real
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>• <strong>Node.js + Express:</strong> API REST veloz para recebimento de webhooks do iFood.</li>
              <li>• <strong>WebSockets Nativo (ws):</strong> Conexão contínua em tempo real para broadcast de coordenadas GPS e novos pedidos.</li>
              <li>• <strong>Servidor Único na Porta 3000:</strong> Express e WebSocket Server compartilhando a mesma porta HTTP.</li>
              <li>• <strong>Gerenciamento de Presença:</strong> Heartbeat ping/pong para identificar desconexões de entregadores.</li>
            </ul>
          </div>

          {/* Database */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
              <Database className="w-4 h-4" />
              Banco de Dados Geoespacial
            </div>
            <ul className="space-y-1.5 text-slate-300">
              <li>• <strong>PostgreSQL + PostGIS:</strong> Suporte nativo a cálculos de distância (<code className="text-emerald-400">ST_DistanceSphere</code>) e buscas de entregadores mais próximos.</li>
              <li>• <strong>Alternativa Cloud (Firebase Firestore):</strong> Excelente para sincronização direta em tempo real e regras de segurança sem servidor.</li>
              <li>• <strong>Redis:</strong> Cache em memória para armazenar a última posição GPS dos entregadores com tempo de expiração rápido.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 2. Arquitetura do Banco de Dados (DDL SQL) */}
      <section className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-700 pb-3">
          <Database className="w-5 h-5 text-emerald-400" />
          2. Modelagem do Banco de Dados (PostgreSQL + PostGIS)
        </h3>

        <p className="text-xs text-slate-300">
          Abaixo está o esquema SQL completo recomendado para gerenciar Pedidos, Entregadores, Histórico de Posições GPS e Eventos do iFood:
        </p>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`-- Ativar extensão espacial PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Tabela de Entregadores (Couriers)
CREATE TABLE couriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('Moto', 'Bicicleta', 'Carro')),
    vehicle_plate VARCHAR(10),
    is_online BOOLEAN DEFAULT FALSE,
    current_location GEOMETRY(Point, 4326), -- PostGIS WGS84 Coordenadas
    battery_level INT CHECK (battery_level BETWEEN 0 AND 100),
    last_gps_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Pedidos (Orders)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ifood_order_id VARCHAR(100) UNIQUE,
    display_id VARCHAR(20) NOT NULL, -- Ex: #iFood-4821
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20),
    delivery_address JSONB NOT NULL, -- Rua, Número, Bairro, CEP
    delivery_location GEOMETRY(Point, 4326), -- PostGIS Point para mapa
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    verification_code VARCHAR(10), -- Código PIN 4 dígitos do iFood
    status VARCHAR(30) NOT NULL DEFAULT 'PLACED',
    assigned_courier_id UUID REFERENCES couriers(id) ON DELETE SET NULL,
    origin VARCHAR(20) DEFAULT 'iFood',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Histórico de Posições GPS dos Entregadores
CREATE TABLE courier_location_logs (
    id BIGSERIAL PRIMARY KEY,
    courier_id UUID NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
    location GEOMETRY(Point, 4326) NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices Espaciais para Consultas Ultra Rápida
CREATE INDEX idx_couriers_location ON couriers USING GIST(current_location);
CREATE INDEX idx_orders_location ON orders USING GIST(delivery_location);
CREATE INDEX idx_orders_status ON orders(status);`}
        </pre>
      </section>

      {/* 3. Plano de Ação Passo a Passo para MVP */}
      <section className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-700 pb-3">
          <Zap className="w-5 h-5 text-amber-400" />
          3. Plano de Ação Passo a Passo para o MVP
        </h3>

        <div className="space-y-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-rose-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Sprint 1: Servidor Node.js, Webhook iFood & WebSockets</h4>
              <p className="text-slate-300 mt-0.5">
                Criar o endpoint <code className="text-rose-400">POST /api/ifood/webhook</code> para receber requisições do iFood e configurar o servidor WebSocket no Node.js para transmitir os eventos em tempo real.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Sprint 2: Painel de Despacho Admin & Mapa de Entregas</h4>
              <p className="text-slate-300 mt-0.5">
                Construir o Dashboard Admin em React com Leaflet para exibir a lista de novos pedidos recebidos do iFood, status dos entregadores e opção de atribuição manual.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Sprint 3: App PWA do Entregador & Captura de GPS</h4>
              <p className="text-slate-300 mt-0.5">
                Desenvolver a interface mobile do entregador com o botão "Ficar Online" e inicialização do <code className="text-emerald-400">watchPosition</code> para transmissão contínua das coordenadas GPS ao servidor.
              </p>
            </div>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3">
            <span className="w-6 h-6 rounded-lg bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">4</span>
            <div>
              <h4 className="font-bold text-slate-100 text-sm">Sprint 4: Deep Links (Google Maps/Waze) & Código PIN iFood</h4>
              <p className="text-slate-300 mt-0.5">
                Adicionar botões de navegação no app do entregador para abrir links universais (<code className="text-sky-400">geo:lat,lng</code>, Google Maps e Waze) e tela de validação do código de confirmação de entrega do iFood.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Dicas de Integração Oficial iFood */}
      <section className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-700 pb-3">
          <ShieldCheck className="w-5 h-5 text-rose-500" />
          4. Integração Técnica com a API do iFood Developer Portal
        </h3>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Para integrar o sistema à loja real no iFood, você deve criar um aplicativo no <strong>Portal do Desenvolvedor iFood (developer.ifood.com.br)</strong> do tipo <em>Merchant App</em> e obter suas credenciais de produção ou sandbox.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <strong className="text-slate-100 block mb-1">1. Recebimento por Webhooks (Recomendado)</strong>
              <span>
                O iFood envia uma requisição HTTP POST para sua URL cadastrada contendo o evento <code className="text-rose-400">ORDER_CREATED</code> com os dados do cliente e itens.
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <strong className="text-slate-100 block mb-1">2. Polling de Contingência & Acknowledgment</strong>
              <span>
                Caso seu webhook fique fora do ar, faça chamadas de fallback em <code className="text-amber-400">GET /order/v1.0/events:polling</code> e confirme o consumo enviando <code className="text-amber-400">POST /events/acknowledgment</code>.
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

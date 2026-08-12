import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Order, Courier, StoreInfo } from "../types";

interface MapViewProps {
  storeInfo: StoreInfo;
  couriers: Courier[];
  orders: Order[];
  selectedCourierId?: string;
  selectedOrderId?: string;
}

// Custom Leaflet Markers using inline SVG Data URIs for reliability
const createCustomIcon = (type: "store" | "courier_online" | "courier_offline" | "order", label?: string) => {
  let color = "#3b82f6";
  let symbol = "🛵";

  if (type === "store") {
    color = "#e11d48"; // Rose/Red for iFood Store
    symbol = "🏬";
  } else if (type === "courier_online") {
    color = "#10b981"; // Emerald Green
    symbol = "🛵";
  } else if (type === "courier_offline") {
    color = "#64748b"; // Slate Gray
    symbol = "💤";
  } else if (type === "order") {
    color = "#f59e0b"; // Amber/Orange
    symbol = "📍";
  }

  const svgHtml = `
    <div style="
      background-color: ${color};
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.35);
      border: 3px solid #ffffff;
      position: relative;
    ">
      ${symbol}
      ${
        label
          ? `<span style="
              position: absolute;
              bottom: -20px;
              white-space: nowrap;
              background: #0f172a;
              color: #f8fafc;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
              border: 1px solid #334155;
            ">${label}</span>`
          : ""
      }
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: "custom-leaflet-marker",
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
};

export const MapView: React.FC<MapViewProps> = ({
  storeInfo,
  couriers,
  orders,
  selectedCourierId,
  selectedOrderId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not existing
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
      }).setView([storeInfo.lat, storeInfo.lng], 14);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    if (!map || !markersGroup) return;

    // Clear previous markers
    markersGroup.clearLayers();

    const bounds: L.LatLngBounds = L.latLngBounds([]);

    // 1. Add Store Marker
    const storeLatLng: L.LatLngExpression = [storeInfo.lat, storeInfo.lng];
    const storeMarker = L.marker(storeLatLng, {
      icon: createCustomIcon("store", storeInfo.name.split("-")[0]),
    }).bindPopup(`
      <div style="color: #0f172a; font-family: sans-serif;">
        <strong style="font-size: 14px; color: #e11d48;">🏬 ${storeInfo.name}</strong><br/>
        <span style="font-size: 12px; color: #475569;">${storeInfo.address}</span>
      </div>
    `);
    markersGroup.addLayer(storeMarker);
    bounds.extend(storeLatLng);

    // 2. Add Courier Markers
    couriers.forEach((courier) => {
      const courierLatLng: L.LatLngExpression = [courier.currentLat, courier.currentLng];
      const isSelected = courier.id === selectedCourierId;
      const markerType = courier.isOnline ? "courier_online" : "courier_offline";

      const courierMarker = L.marker(courierLatLng, {
        icon: createCustomIcon(markerType, courier.name.split(" ")[0]),
      }).bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif;">
          <strong style="font-size: 14px; color: #0284c7;">🛵 ${courier.name} (${courier.vehicle})</strong><br/>
          <span style="font-size: 12px; color: #16a34a;">Status: ${courier.isOnline ? "Online (GPS Ativo)" : "Offline"}</span><br/>
          <span style="font-size: 11px; color: #64748b;">Entregas Hoje: ${courier.deliveriesTodayCount} | Bateria: ${courier.batteryLevel ?? 100}%</span>
        </div>
      `);

      markersGroup.addLayer(courierMarker);
      bounds.extend(courierLatLng);

      if (isSelected) {
        map.panTo(courierLatLng);
      }
    });

    // 3. Add Active Delivery Location Markers
    orders
      .filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED")
      .forEach((order) => {
        const orderLatLng: L.LatLngExpression = [
          order.deliveryAddress.lat,
          order.deliveryAddress.lng,
        ];
        const isSelected = order.id === selectedOrderId;

        const orderMarker = L.marker(orderLatLng, {
          icon: createCustomIcon("order", order.displayId),
        }).bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif;">
            <strong style="font-size: 14px; color: #d97706;">📍 Pedido ${order.displayId}</strong><br/>
            <span style="font-size: 12px; color: #0f172a;">Cliente: ${order.customerName}</span><br/>
            <span style="font-size: 11px; color: #475569;">${order.deliveryAddress.street}, ${order.deliveryAddress.number}</span><br/>
            <strong style="font-size: 12px; color: #2563eb;">Total: R$ ${order.totalAmount.toFixed(2)}</strong>
          </div>
        `);

        markersGroup.addLayer(orderMarker);
        bounds.extend(orderLatLng);

        if (isSelected) {
          map.panTo(orderLatLng);
        }
      });

    // Adjust zoom if multiple markers exist and none specifically selected
    if (!selectedCourierId && !selectedOrderId && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [storeInfo, couriers, orders, selectedCourierId, selectedOrderId]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-slate-800 shadow-xl">
      <div ref={mapContainerRef} className="w-full h-full z-0 min-h-[380px]" />
      <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs text-slate-300 font-medium z-10 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        Radar GPS ao Vivo
      </div>
    </div>
  );
};

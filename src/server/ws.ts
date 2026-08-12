import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import URL from "url";
import { db } from "./db.js";
import { verifyAuthToken, DecodedToken } from "./auth.js";
import { WSEvent, Courier, Order } from "../types.js";

export function setupWebSocketServer(server: http.Server) {
  const wss = new WebSocketServer({ server });

  // Map to store authenticated clients
  const clientAuth = new Map<WebSocket, DecodedToken | null>();

  function broadcast(event: WSEvent) {
    const message = JSON.stringify(event);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  wss.on("connection", (ws, req) => {
    // Check URL query string for ?token=...
    let userToken: DecodedToken | null = null;
    if (req.url) {
      const parsedUrl = URL.parse(req.url, true);
      const tokenQuery = parsedUrl.query.token as string;
      if (tokenQuery) {
        userToken = verifyAuthToken(tokenQuery);
      }
    }

    clientAuth.set(ws, userToken);

    // Send initial state to client
    const initStateMsg: WSEvent = {
      type: "INIT_STATE",
      data: {
        orders: db.getOrders(),
        couriers: db.getCouriers(),
        storeInfo: db.getStoreInfo(),
        ifoodConfig: db.getIFoodConfig(),
      },
    };
    ws.send(JSON.stringify(initStateMsg));

    ws.on("message", (raw) => {
      try {
        const event: WSEvent = JSON.parse(raw.toString());

        // Handle Handshake Authentication Message
        if (event.type === "AUTH_HANDSHAKE") {
          const decoded = verifyAuthToken(event.data.token);
          if (decoded) {
            clientAuth.set(ws, decoded);
            ws.send(
              JSON.stringify({
                type: "INIT_STATE",
                data: {
                  orders: db.getOrders(),
                  couriers: db.getCouriers(),
                  storeInfo: db.getStoreInfo(),
                  ifoodConfig: db.getIFoodConfig(),
                },
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: "AUTH_ERROR",
                data: { message: "Token de autenticação inválido ou expirado." },
              })
            );
          }
          return;
        }

        // Validate token if provided inside event envelope
        let activeUser = clientAuth.get(ws);
        const eventToken = (event as any).token;
        if (!activeUser && eventToken) {
          activeUser = verifyAuthToken(eventToken);
          if (activeUser) clientAuth.set(ws, activeUser);
        }

        const orders = db.getOrders();
        let couriers = db.getCouriers();

        if (event.type === "LOCATION_UPDATE") {
          const { courierId, lat, lng, batteryLevel } = event.data;
          const courier = couriers.find((c) => c.id === courierId);
          if (courier) {
            courier.currentLat = lat;
            courier.currentLng = lng;
            courier.lastLocationUpdate = new Date().toISOString();
            if (batteryLevel !== undefined) courier.batteryLevel = batteryLevel;
            db.save();

            broadcast({
              type: "LOCATION_UPDATE",
              data: { courierId, lat, lng, batteryLevel: courier.batteryLevel },
            });
          }
        } else if (event.type === "COURIER_STATUS_TOGGLE") {
          const { courierId, isOnline } = event.data;
          const courier = couriers.find((c) => c.id === courierId);
          if (courier) {
            courier.isOnline = isOnline;
            db.save();
            broadcast({ type: "COURIER_STATUS_TOGGLE", data: { courierId, isOnline } });
          }
        } else if (event.type === "ASSIGN_ORDER") {
          const { orderId, courierId } = event.data;
          const order = orders.find((o) => o.id === orderId);
          const courier = couriers.find((c) => c.id === courierId);

          if (order && courier) {
            order.assignedCourierId = courier.id;
            order.assignedCourierName = courier.name;
            order.assignedCourierPhone = courier.phone;
            order.status = "DISPATCHED";
            order.updatedAt = new Date().toISOString();

            courier.activeOrderId = order.id;
            db.save();

            broadcast({ type: "ASSIGN_ORDER", data: { orderId, courierId } });
          }
        } else if (event.type === "UPDATE_ORDER_STATUS") {
          const { orderId, status } = event.data;
          const order = orders.find((o) => o.id === orderId);
          if (order) {
            const previousStatus = order.status;
            order.status = status;
            order.updatedAt = new Date().toISOString();

            // Clear courier active order if delivered or cancelled & update financial earnings
            if (status === "DELIVERED" || status === "CANCELLED") {
              const courier = couriers.find((c) => c.id === order.assignedCourierId);
              if (courier) {
                courier.activeOrderId = undefined;

                if (status === "DELIVERED" && previousStatus !== "DELIVERED") {
                  courier.deliveriesTodayCount += 1;
                  // Calculate delivery fee earnings (min R$ 12.50 or 18% of order total + R$ 7.50 base)
                  const feeEarned = Math.max(12.50, order.totalAmount * 0.18 + 7.50);
                  courier.earningsToday = Number((courier.earningsToday + feeEarned).toFixed(2));
                  
                  // Broadcast courier update so client UI updates earnings immediately
                  broadcast({ type: "UPDATE_COURIER", data: courier });
                }
              }
            }

            db.save();
            broadcast({ type: "UPDATE_ORDER_STATUS", data: { orderId, status } });
          }
        } else if (event.type === "CREATE_COURIER") {
          const newCourier = event.data;
          if (!newCourier.id) newCourier.id = `courier-${Date.now()}`;
          if (!newCourier.earningsToday) newCourier.earningsToday = 0;
          if (!newCourier.deliveriesTodayCount) newCourier.deliveriesTodayCount = 0;
          couriers.push(newCourier);
          db.save();

          broadcast({ type: "CREATE_COURIER", data: newCourier });
        } else if (event.type === "UPDATE_COURIER") {
          const updatedCourier = event.data;
          const index = couriers.findIndex((c) => c.id === updatedCourier.id);
          if (index !== -1) {
            couriers[index] = { ...couriers[index], ...updatedCourier };
            db.save();
            broadcast({ type: "UPDATE_COURIER", data: couriers[index] });
          }
        } else if (event.type === "DELETE_COURIER") {
          const { courierId } = event.data;
          const filtered = couriers.filter((c) => c.id !== courierId);
          // Mutate in place
          couriers.length = 0;
          couriers.push(...filtered);

          // Unassign active order if assigned
          orders.forEach((o) => {
            if (o.assignedCourierId === courierId) {
              o.assignedCourierId = undefined;
              o.assignedCourierName = undefined;
              o.assignedCourierPhone = undefined;
              if (o.status === "DISPATCHED" || o.status === "IN_TRANSIT") {
                o.status = "READY_FOR_PICKUP";
              }
            }
          });

          db.save();
          broadcast({ type: "DELETE_COURIER", data: { courierId } });
        }
      } catch (err) {
        console.error("⚠️ Error processing WS message:", err);
      }
    });

    ws.on("close", () => {
      clientAuth.delete(ws);
    });
  });

  return { wss, broadcast };
}

# Nudge Scalable Chat App

A scalable real-time chat application built with **Next.js**, **Socket.IO**, and **Redis Pub/Sub**. This project demonstrates how to scale WebSocket-based applications horizontally across multiple servers using Redis as a message broker.

---

## 🚀 Features

- Real-time chat with Socket.IO
- Scalable architecture using Redis Pub/Sub
- Multiple server support (horizontal scaling)
- Modern React/Next.js frontend

<img width="1364" height="898" alt="Screenshot 2025-08-24 120411" src="https://github.com/user-attachments/assets/065d35ef-3648-427b-8b88-a7f7b07f5878" />

---

## 🏗️ Architecture Overview

### Why Redis Pub/Sub?

WebSocket servers (like Socket.IO) store client connections in memory. If you run multiple server instances (for load balancing or high availability), messages sent to one server won't reach clients connected to another server.

**Redis Pub/Sub** solves this by acting as a central message broker:

- **Publish**: When a client sends a message, the server publishes it to a Redis channel.
- **Subscribe**: All server instances subscribe to the same Redis channel.
- **Broadcast**: When a message is published, Redis notifies all subscribers (servers), which then broadcast the message to their connected clients.

This ensures all clients receive messages, no matter which server instance they're connected to.

---

## 🛠️ How It Works

### 1. Server Side (`apps/server/src/services/socket.ts`)

- Each server instance creates a Redis **publisher** and **subscriber**.
- On receiving a message from a client, the server **publishes** it to the `MESSAGES` channel.
- All servers **subscribe** to `MESSAGES`. When a message is published, each server **emits** it to its connected clients.

```typescript
// ...existing code...
const pub = new Redis.default(redis_url);
const sub = new Redis.default(redis_url);

sub.subscribe("MESSAGES")

io.on("connect", (socket) => {
    socket.on("event:message", async ({ message }) => {
        await pub.publish('MESSAGES', JSON.stringify({ message }))
    });
});

sub.on('message', (channel, message) => {
    if(channel === "MESSAGES"){
        io.emit("message", message);
    }
})
// ...existing code...
```

### 2. Client Side (`apps/web/context/SocketProvider.tsx`)

- The React app connects to the server via Socket.IO.
- Messages are sent and received in real-time.

---

## 🏃‍♂️ Running Multiple Servers

To scale horizontally, simply start multiple server instances (on different ports or machines), all pointing to the same Redis instance:

```bash
PORT=8000 node apps/server/src/index.js
PORT=8001 node apps/server/src/index.js
# ...and so on
```

All servers will share messages via Redis, ensuring all clients stay in sync.

---

## 📦 Getting Started

1. **Install dependencies**  
   ```bash
   yarn install
   ```

2. **Set up Redis**  
   - Use a local Redis instance or a cloud provider.
   - Set `REDIS_URL` in your environment variables.

3. **Start the server**  
   ```bash
   yarn workspace server dev
   ```

4. **Start the frontend**  
   ```bash
   yarn workspace web dev
   ```

---

## 📝 Summary

- **Redis Pub/Sub** enables real-time message broadcasting across multiple server instances.
- This architecture is essential for scaling WebSocket apps beyond a single server.
- The app is ready for production scaling—just add more servers!

---

## 📚 References

- [Socket.IO Scaling with Redis](https://socket.io/docs/v4/using-multiple-nodes/)
- [Redis Pub/Sub Documentation](https://redis.io/docs/interact/pubsub/)

---

## 💡 Contributing

PRs and suggestions welcome!

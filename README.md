# Nudge Scalable WS App

A **production-ready, scalable real-time chat application** built with **Next.js**, **Socket.IO**, **Redis Pub/Sub**, **Kafka**, and **Prisma**.  
This project demonstrates how to architect a modern WebSocket-based chat app that can scale horizontally across multiple servers, reliably persist messages, and prevent database overload using a robust message broker pipeline.

---

<img width="1364" height="898" alt="Screenshot 2025-08-24 120411" src="https://github.com/user-attachments/assets/065d35ef-3648-427b-8b88-a7f7b07f5878" />

---

## 🏗️ Architecture Overview

### Monorepo Structure

This project uses **Turborepo** for monorepo management, with two main workspaces:

- `apps/web`: Next.js frontend (React)
- `apps/server`: Node.js backend (Socket.IO, Redis, Kafka, Prisma)

### How Does It Scale?

#### 1. **WebSocket Scaling with Redis Pub/Sub**

- **Problem:** WebSocket servers (like Socket.IO) store client connections in memory. If you run multiple server instances (for load balancing or high availability), messages sent to one server won't reach clients connected to another server.
- **Solution:** **Redis Pub/Sub** acts as a central message broker. All server instances subscribe to the same Redis channel. When a message is published, Redis notifies all servers, which then broadcast the message to their connected clients. This ensures all clients receive messages, no matter which server instance they're connected to.

#### 2. **Reliable Message Persistence with Kafka**

- **Problem:** Writing every chat message directly to the database from the WebSocket server can overload the DB under high load, risking crashes or data loss.
- **Solution:** Each message is published to a **Kafka** topic. A Kafka consumer service reads messages from the topic and inserts them into the database using Prisma. This decouples message ingestion from database writes, providing buffering, retry, and backpressure handling.

---

## ⚙️ Detailed Flow

1. **Client** sends a chat message via Socket.IO.
2. **Server** receives the message and publishes it to the Redis `MESSAGES` channel.
3. **All server instances** (across all machines) subscribed to `MESSAGES` receive the message and broadcast it to their connected clients.
4. **Each server** also produces the message to a Kafka topic.
5. **Kafka consumer service** reads messages from the topic and inserts them into the database using Prisma.
6. **If the database is slow or down**, Kafka buffers messages, preventing data loss and DB overload.

---

## 📦 Installation & Setup

### 1. **Clone the Repository**

```bash
git clone https://github.com/your-username/nudge-scalable-chatapp.git
cd nudge-scalable-chatapp
```

### 2. **Install Dependencies (Yarn + Turborepo)**

```bash
yarn install
```

### 3. **Environment Variables**

Create a `.env` file in the root and in `apps/server` with the following variables:

```env
# .env
REDIS_URL=redis://localhost:6379
KAFKA_URL=localhost:9092
SASL_PASSWORD=your_kafka_password
DATABASE_URL=postgresql://user:password@localhost:5432/nudge
```

### 4. **Set Up the Database**

- Make sure you have a PostgreSQL (or compatible) database running.
- Run Prisma migrations (from the root):

```bash
yarn workspace server prisma migrate deploy
```

### 5. **Start Redis and Kafka**

- **Redis:**  
  ```bash
  redis-server
  ```
- **Kafka:**  
  Follow [Kafka quickstart](https://kafka.apache.org/quickstart) to start Zookeeper and Kafka broker locally, or use a managed service.

### 6. **Start the Server and Frontend**

- **Server:**  
  ```bash
  yarn workspace server dev
  ```
- **Frontend:**  
  ```bash
  yarn workspace web dev
  ```

### 7. **Scaling the Server**

To scale horizontally, start multiple server instances (on different ports or machines), all pointing to the same Redis and Kafka:

```bash
PORT=8000 yarn workspace server dev
PORT=8001 yarn workspace server dev
# ...and so on
```

---

## 🛠️ How It Works (Code Overview)

### Server Side (`apps/server/src/services/socket.ts`)

```typescript
const pub = new Redis.default(redis_url);
const sub = new Redis.default(redis_url);

sub.subscribe("MESSAGES");

io.on("connect", (socket) => {
    socket.on("event:message", async ({ message }) => {
        await pub.publish('MESSAGES', JSON.stringify({ message }));
    });
});

sub.on('message', async (channel, message) => {
    if(channel === "MESSAGES"){
        io.emit("message", message);
        await produceMessage(message); // Send to Kafka for DB persistence
    }
});
```

### Kafka Consumer (`apps/server/src/services/kafka.ts`)

```typescript
export async function startMessageConsumer() {
    const consumer = kafka.consumer({ groupId: "default"});
    await consumer.connect();
    await consumer.subscribe({ topic: "MESSAGES", fromBeginning: true });

    await consumer.run({
        autoCommit: true,
        eachMessage: async ({ message, pause }) => {
            if(!message.value) return;
            try {
                await prismaClient.message.create({
                    data: { text: message.value?.toString() }
                });
            } catch (error) {
                pause();
                setTimeout(() => {
                    consumer.resume([{ topic: 'MESSAGES' }]);
                }, 60 * 1000);
            }
        }
    });
}
```

---

## 📝 Summary

- **Redis Pub/Sub** enables real-time message broadcasting across multiple server instances.
- **Kafka** provides a reliable, scalable buffer between the chat servers and the database, preventing DB overload and ensuring no message is lost.
- **Turborepo** and **Yarn workspaces** make development and deployment easy in a monorepo setup.
- The app is ready for production scaling—just add more servers!

---

## 📚 References

- [Socket.IO Scaling with Redis](https://socket.io/docs/v4/using-multiple-nodes/)
- [Redis Pub/Sub Documentation](https://redis.io/docs/interact/pubsub/)
- [Kafka Documentation](https://kafka.apache.org/documentation/)
- [Turborepo](https://turbo.build/repo/docs)
- [Prisma ORM](https://www.prisma.io/docs/)

---

## 💡 Contributing

PRs and suggestions welcome!

---

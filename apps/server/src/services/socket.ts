import { Server } from "socket.io";
import Redis from "ioredis";
import dotenv from 'dotenv'

dotenv.config();

const redis_url = process.env.REDIS_URL ?? "";

const pub = new Redis.default(redis_url);
const sub = new Redis.default(redis_url);

class SocketService {
    private _io: Server;

    constructor() {
        console.log("Init Socket Service...");
        this._io = new Server({
            cors: {
                allowedHeaders: ['*'],
                origin: '*'
            }
        });
        sub.subscribe("MESSAGES")
    }

    public initListeners() {
        const io = this.io;
        console.log(`init socket listeners....`)
        io.on("connect",(socket) => {
            console.log(`New Socket Connected`, socket.id);

            socket.on("event:message", async ({ message }:{ message: string }) => {
                console.log("New message Rec.", message);

                await pub.publish('MESSAGES', JSON.stringify({ message }))
            });
        });

        sub.on('message', (channel, message) => {
            if(channel === "MESSAGES"){
                io.emit("message", message);
            }
        })
    }

    get io() {
        return this._io
    }
}

export default SocketService;
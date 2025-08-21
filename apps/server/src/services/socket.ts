import { Server } from "socket.io";
import Redis from "ioredis";


const pub = new Redis.default("rediss://default:AVhUAAIncDEwMzI4MmJiMGVhYWQ0M2RlYWE2MzQ0YjRhMTEyYTJiY3AxMjI2MTI@secure-whale-22612.upstash.io:6379");
const sub = new Redis.default("rediss://default:AVhUAAIncDEwMzI4MmJiMGVhYWQ0M2RlYWE2MzQ0YjRhMTEyYTJiY3AxMjI2MTI@secure-whale-22612.upstash.io:6379");

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
import { Server } from "socket.io";
import Redis from "ioredis";
import dotenv from 'dotenv'
import prismaClient from "./prisma.js";
import { createProducer, produceMessage } from "./kafka.js";

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
        sub.subscribe("MESSAGES");
    }

    public initListeners() {
        const io = this.io; //get io() { return this._io }
        console.log(`init socket listeners....`)
        io.on("connect",(socket) => {
            console.log(`New Socket Connected`, socket.id);

            socket.on("event:message", async ({ message }:{ message: string }) => {
                console.log("New message Rec.", message);

                await pub.publish('MESSAGES', JSON.stringify({ message }))
            });
        });

        sub.on('message', async(channel, message) => {
            if(channel === "MESSAGES"){
                io.emit("message", message);
                await produceMessage(message);
                console.log(`message produced to kafka broker`);
            }
        })
    }

    get io() {
        return this._io
    }
}

export default SocketService;


//very simple keep this in mind 
// pubsub -> the server and redis cluster interacts so pubsub will be initialised and used in server files
// socket -> the server and client interacts so it will .on and .emit on client and server files
// so server subscribed to MESSAGES channel will be broadcasted the message and server and client are 
// connected where io.emit in server will send it to every socket connected
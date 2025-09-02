import { Kafka, type Producer } from "kafkajs";
import dotenv from 'dotenv';
import fs from 'fs';
import prismaClient from "./prisma.js";
dotenv.config();

const kafkaUrl =  process.env.KAFKA_URL ?? "";
const sasl_password = process.env.SASL_PASSWORD ?? "";

const kafka = new Kafka({
    brokers: [kafkaUrl],
    ssl: {
        ca: [fs.readFileSync('./ca.pem', "utf-8")],
    },
    sasl:{
        username: "avnadmin",
        password: sasl_password,
        mechanism: "plain"
    }
})

let producer: Producer | null = null;

export async function createProducer() {
    if(producer) {
        return producer;
    }
    const _producer = kafka.producer();
    await _producer.connect();
    producer = _producer;
    return producer;
}

export async function produceMessage(message: string) {
    const producer = await createProducer();
    await producer.send({
        messages: [{ key: `message-${Date.now()}`, value: message }],
        topic: "MESSAGES",
    });
    return true;
}

export async function startMessageConsumer() {
    const consumer = kafka.consumer({ groupId: "default"});
    await consumer.connect();
    await consumer.subscribe({ topic: "MESSAGES", fromBeginning: true });

    await consumer.run({
        autoCommit: true,
        eachMessage: async ({ message, pause }) => {
            if(!message.value) return;
            console.log(`new message recieved...`);
            try {
                await prismaClient.message.create({
                data: {
                    text: message.value?.toString(),
                }
            })
            } catch (error) {
                pause();
                setTimeout(() => {
                    consumer.resume([{ topic: 'MESSAGES' }]);
                }, 60 * 1000);
            }
        }
    })
}

export default kafka;
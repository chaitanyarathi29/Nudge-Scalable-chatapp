'use client'
import React, { createContext, FC, ReactNode, useCallback, useEffect, useContext, useState } from 'react'
import { io, Socket } from 'socket.io-client';

interface SocketProviderProps {
    children ?: ReactNode
}

interface ISocketContext {
    sendMessage: (msg: string) => any;
    messages: string[];
}

const SocketContext = createContext<ISocketContext | null>(null);

export const useSocket = () => {
    const state = useContext(SocketContext);
    if (!state){ 
        throw new Error(`state is undefined`)
    };

    return state;
}

export const SocketProvider: FC<SocketProviderProps> = ({children}) => {


    const [socket, setSocket] = useState<Socket>()
    const [messages, setMessages] = useState<string[]>([])

    const sendMessage: ISocketContext["sendMessage"] = useCallback((msg) => {
        console.log("Send Message", msg)
        if(socket) {
            socket.emit('event:message', { message: msg })
        }
    }, [socket]);

    const onMessageRec = useCallback((msg: string) => {
        const {message} = JSON.parse(msg) as {message: string};
        setMessages((prev) => [...prev, message])
        console.log('From server msg Rec', msg)
    },[])

    useEffect(() => {
        const _socket = io("http://localhost:8000");
        _socket.on('message', onMessageRec);

        setSocket(_socket);

        return () => {
            _socket.disconnect();
            _socket.off('message', onMessageRec);
            setSocket(undefined);
        }
    },[])

    return (
        <SocketContext.Provider value={{ sendMessage, messages }}>
            {children}
        </SocketContext.Provider>
    )
}

export default SocketProvider; 


// Server listens with io.on("connection") (one per client connection) 
// and then uses socket.on("something") for messages from that client.
// Client uses socket.on("connect") to detect initial connection 
// and socket.on("something") for messages from the server.
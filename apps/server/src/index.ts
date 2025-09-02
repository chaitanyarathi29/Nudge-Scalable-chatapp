import http from 'http';
import SocketService from './services/socket.js';
import { startMessageConsumer } from './services/kafka.js';

async function init() {

    startMessageConsumer();
    const httpServer = http.createServer();
    const PORT = process.env.PORT ? process.env.PORT : 8000;

    const socketService = new SocketService();

    socketService.io.attach(httpServer);
    
    socketService.initListeners();

    httpServer.listen(PORT, () => {
        console.log(`HTTP server started at PORT: ${PORT}`);
    });
}

init();
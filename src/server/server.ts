import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { config } from './config';
import { setSocketIO } from './services/notificationService';
import { startSlaMonitoringWorker } from './workers/slaWorker';

const server = http.createServer(app);

// Initialize WebSockets
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

setSocketIO(io);

io.on('connection', (socket) => {
  // Join user room for targeted notifications
  socket.on('join_user', (userId: string) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  // Join ticket room for live thread updates
  socket.on('join_ticket', (ticketId: string) => {
    if (ticketId) {
      socket.join(`ticket_${ticketId}`);
    }
  });

  socket.on('leave_ticket', (ticketId: string) => {
    if (ticketId) {
      socket.leave(`ticket_${ticketId}`);
    }
  });
});

// Start Background SLA Worker
startSlaMonitoringWorker();

// Start Server
const PORT = config.port;
server.listen(PORT, () => {
  console.log('================================================================');
  console.log(`🚀 Customer & Telecaller Ticket Management API Server`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log('================================================================');
});

export { server, io };

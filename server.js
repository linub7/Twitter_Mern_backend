const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

process.on('uncaughtException', (err) => {
  console.log('UnCaught REJECTION! Shutting Down ...');
  console.log(err);
  process.exit(1);
});

dotenv.config({
  path: './config/config.env',
});

connectDB();

const app = require('./app');
const SocketServer = require('./SocketServer');

const port = process.env.PORT || 8000;
const server = app.listen(port, () =>
  console.log(`Server is running on port ${port}`)
);

// socket.io
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: process.env.CORS_ORIGIN,
  },
});

io.on('connection', (socket) => {
  SocketServer(socket, io);
});

// Handle unhandled promise rejection
// eslint-disable-next-line no-unused-vars
process.on('unhandledRejection', (err, promise) => {
  console.log('UnHandled REJECTION! Shutting Down ...');
  console.log(`Error: ${err.name} ${err.message}`);
  // close sever and exit process
  server.close(() => {
    process.exit(1);
  });
});

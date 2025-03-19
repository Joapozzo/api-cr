const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");

dotenv.config();

const allowedOrigins = [
    'https://coparelampago.com', // Dominio de tu frontend en producción
    'https://www.coparelampago.com', // Si usas www
    'http://localhost:5173', // Para desarrollo
];

const app = express();
const port = process.env.PORT || 3001;

const server = http.createServer(app);
const io = new Server(server, {
    connectionStateRecovery: {},
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true
    }
});

// Middlewares
app.use(helmet({
    crossOriginResourcePolicy: false
}));
app.use(cookieParser());
app.use(express.json());

app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));

app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Socket-Id');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(204);
});

// Middleware para adjuntar io al objeto req
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/admin', require('./routes/adminRoutes'));
app.use('/user', require('./routes/userRoutes'));
app.use('/planilla', require('./routes/planillaRoutes'));
app.use("/upload", require("./routes/uploadRoutes"));
app.use("/auth", require("./routes/authRoutes"));

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("newAction", (actionData) => {
        io.emit("actionUpdate", actionData);
    });

    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

process.on("uncaughtException", (err) => {
    console.error("Unhandled Exception", err);
});

process.on("unhandledRejection", (reason, promise) => {
    console.error("Unhandled Rejection", reason);
});

server.listen(port, "0.0.0.0", () => {
    console.log(`Corriendo en http://localhost:${port}`);
});

import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import http from "http"; // Required for socket.io
import mongoose from 'mongoose';

import { Server } from 'socket.io';
import { dbConnection } from './database/dbConnection.js';
import { errorMiddleware } from './middlewares/error.js';

import testAreaRouter from './routers/zoneArea/testAreaRoutes.js';

import userKifRouter from './routers/userKifs/userKifsRoutes.js';
import acharyaKifRouter from './routers/userKifs/acharyaKifRoutes.js';

import anchalAreaNew from './routers/areaAllocation/anchalArea/anchalAreaNewRoutes.js';
import sanchAreaNew from './routers/areaAllocation/sanchArea/sanchAreaNewRoutes.js';
import upsanchAreaNew from './routers/areaAllocation/upsanchArea/upsanchAreaNewRoutes.js';
import sankulAreaNew from './routers/areaAllocation/sankulArea/sankulAreaNewRoutes.js';
import FieldRoutes from './routers/educationDegrees/fieldRouter.js';
import ChatRoutes from './routers/chat/chatRouter.js';
import LocationTrackingRoutes from './routers/locationTracking/meetingTravelRoutes.js';
import VargRoutes from './routers/vargSchedule/vargRoutes.js';
import notificationRoutes from './routers/notifications/notificationRouter.js';
import gramSurveyRoutes from './routers/gramSurvey/gramSurveyRoutes.js';
import gramSvavlambanRoutes from './routers/gramSurvey/gramsvavlambanRouter.js';
import gramSamarastaRoutes from './routers/gramSurvey/gramsamrastaRouter.js';
import vjpstudentsormRouter from './routers/vjp/vidyarthiJankariPatrakRoutes.js';
import initSocket from './Socket/socket.js';
import {removeUniqueIndex} from './utils/dbutils.js'; // Import the function to remove the unique index

import path from 'path';
import compression from 'compression';
// import admin from 'firebase-admin';

import userRouter from './routers/userRoles/userRouter.js';
import gramSamitiRouter from './routers/gramSamiti/gramSamitiRoutes.js';
import { scheduleGramSamitiStatusNotifications } from './utils/Notifications/notificationsmiddleware.js';
import fs from 'fs';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
dotenv.config({ path: './config/config.env' });

// import serviceAccount from './rnnotofocationfirebasekey.json' assert { type: 'json' };
// const serviceAccount = JSON.parse(
//   fs.readFileSync('./rnnotofocationfirebasekey.json', 'utf8')
// );


// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL1,
      process.env.REACT_URL,
      process.env.REACT_URL1,
    ].filter(Boolean),
    methods: ['GET', 'PUT', 'DELETE', 'POST'],
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'authorization',
      'x-requested-with',
      'Accept',
      'x-access-token',
    ],
  })
);

app.use((req, res, next) => {
  const extractToken = () => {
    if (req.cookies.token) {
      return req.cookies.token;
    }

    const authHeader =
      req.headers['authorization'] ||
      req.headers['Authorization'] ||
      req.headers['x-access-token'];

    if (authHeader) {
      return authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : authHeader;
    }

    return null;
  };

  const token = extractToken();

  if (token && !req.cookies.token) {
    res.cookie('token', token, {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }

  next();
});

// Create an HTTP server and pass it to socket.io
const server = http.createServer(app);

// Initialize Socket.io and pass the server
const io = initSocket(server);

// const io = new Server(server, {
//   cors: {
//     origin: [process.env.FRONTEND_URL, process.env.REACT_URL],
//     methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   },
// });

app.use((req, res, next) => {
  req.io = io;
  next();
});

// io.on('connection', (socket) => {
//   console.log('New client connected', socket.id);

//   socket.on('disconnect', () => {
//     console.log('Client disconnected', socket.id);
//   });
// });

app.use('/api/v1/userRole', userRouter);

app.use('/api/v1/userKif', userKifRouter);
app.use('/api/v1/acharyaKif', acharyaKifRouter);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/v1/zoneArea/testAreaRouter', testAreaRouter);

app.use('/api/v1/areaAllocation/anchalArea', anchalAreaNew);
app.use('/api/v1/areaAllocation/sankulArea', sankulAreaNew);
app.use('/api/v1/areaAllocation/sanchArea', sanchAreaNew);
app.use('/api/v1/areaAllocation/upSanchArea', upsanchAreaNew);
app.use('/api/v1/gramSamiti/gramSamitiMembers', gramSamitiRouter);

app.use('/api/v1/fields', FieldRoutes);
app.use('/api/v1/Chat', ChatRoutes);
app.use('/api/v1/meeting-travel', LocationTrackingRoutes);
app.use('/api/v1/varg-schedule', VargRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/gram-survey', gramSurveyRoutes);
app.use('/api/v1/gram-svavlamban', gramSvavlambanRoutes);
app.use('/api/v1/gram-samrasta', gramSamarastaRoutes);
app.use('/api/v1/vjpform', vjpstudentsormRouter);


app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use(compression());

app.post('/send-notification', async (req, res) => {
  const { token, title, body } = req.body;

  if (!token || !title || !body) {
    return res.status(400).send('Missing token, title, or body in the request');
  }

  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);

    res.status(200).send('Notification sent successfully');
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send('Error sending notification');
  }
});

dbConnection();
// mongoose.connection.once('open', async () => {
//   console.log('Connected to MongoDB');
  
  
//   await removeUniqueIndex('acharyakifdteails', 'svpId'); // Call the function to remove the unique index
// });
scheduleGramSamitiStatusNotifications();
app.use(errorMiddleware);

export { server };
export default app;

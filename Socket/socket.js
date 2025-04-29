import { Server } from 'socket.io';
import Message from "../models/chat/message.js";

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL,
        process.env.FRONTEND_URL1,
        process.env.REACT_URL,
        process.env.REACT_URL1,
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    transports: ['websocket', 'polling'],
  });

  io.on("connection", (socket) => {
    // console.log("New client connected");

    // Enhanced joinRoom event to handle both user and group rooms
    socket.on("joinRoom", (userId, groupIds = []) => {
      // Join user's personal room
      socket.join(userId);
      // console.log(`User ${userId} joined their personal room`);

      // Join all group rooms
      groupIds.forEach((groupId) => {
        socket.join(groupId);
        // console.log(`User ${userId} joined group ${groupId}`);
      });
    });

    // Handle sending messages (both direct and group)
    socket.on("sendMessage", (message) => {
      try {
        if (message.groupId) {
          // Group message - broadcast to group room
          io.to(message.groupId).emit("newGroupMessage", message);
        } else {
          // Direct message - send to recipient's room
          io.to(message.recepientId).emit("newMessage", message);
        }
      } catch (error) {
        console.error("Error in sendMessage:", error);
      }
    });

    // Handle message status updates
    socket.on("messageRead", (data) => {
      // Broadcast message read status to relevant rooms
      if (data.groupId) {
        io.to(data.groupId).emit("messageRead", data);
      } else {
        io.to(data.senderId).to(data.recepientId).emit("messageRead", data);
      }
    });

    socket.on("markAsSeen", async ({ messageId, userId, groupId, seenAt }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) {
          console.log("Message not found:", messageId);
          return;
        }

        // Check if the user hasn't seen the message yet
        const hasSeen = message.seenBy.some(seen =>
          seen.userId.toString() === userId.toString()
        );

        if (!hasSeen) {
          // Add user and seenAt timestamp
          message.seenBy.push({ userId, seenAt });
          await message.save();

          const seenData = {
            messageId,
            userId,
            seenBy: message.seenBy,
            seenAt
          };

          // Emit to all relevant parties
          if (groupId) {
            // For group messages, broadcast to the entire group
            io.to(groupId).emit("messageSeen", seenData);
          } else {
            // For direct messages, emit to both sender and recipient
            io.to(message.senderId.toString()).emit("messageSeen", seenData);
            io.to(message.recepientId.toString()).emit("messageSeen", seenData);
          }

          // Also emit messageRead event for backwards compatibility
          if (groupId) {
            io.to(groupId).emit("messageRead", seenData);
          } else {
            io.to(message.senderId.toString()).emit("messageRead", seenData);
          }
        }
      } catch (error) {
        console.error("Error marking message as seen:", error);
      }
    });

    // Join a travel tracking room
    socket.on('joinTravel', (travelId) => {
      socket.join(`travel_${travelId}`);
      console.log(`Socket ${socket.id} joined travel_${travelId}`);
    });


    // Handle location updates
    socket.on('locationUpdate', (data) => {
      // Broadcast location to everyone in this travel's room except sender
      socket.to(`travel_${data.travelId}`).emit('locationUpdated', {
        travelId: data.travelId,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: new Date()
      });
    });

     // New notification handler
     socket.on("fetchNotifications", async (userId) => {
      try {
        // Fetch user's notifications from database (implement this method)
        const notifications = await getUserNotifications(userId);
        
        // Send notifications back to the client
        socket.emit("notificationsList", notifications);
      } catch (error) {
        logger.error(`Error fetching notifications: ${error.message}`);
      }
    });


    // Mark notification as read
    socket.on("markNotificationRead", async (notificationId, userId) => {
      try {
        // Implement method to mark notification as read in database
        await markNotificationAsRead(notificationId, userId);
        
        // Optionally, emit updated notifications list
        const updatedNotifications = await getUserNotifications(userId);
        socket.emit("notificationsList", updatedNotifications);
      } catch (error) {
        logger.error(`Error marking notification read: ${error.message}`);
      }
    });

    // Handle client disconnecting
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};

// Helper functions (these would need to be implemented with your database schema)
const getUserNotifications = async (userId) => {
 
  return [];
};

const markNotificationAsRead = async (notificationId, userId) => {
  
};

export { io };
export default initSocket;
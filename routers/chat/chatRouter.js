import express from 'express';
import multer from 'multer';
import {
  getUsers,
  sendMessage,
  forwardMessage,
  getUserDetails,
  getMessages,
  deleteMessages,
  getSeenMessages,
  getUnseenMessagesCount,
  createGroup,
  addGroupMembers,
  getGroupMessages,
  getUserGroups,
  getGroupMembers,
  removeGroupMember,
  leaveGroup,
  getAvailableUsers,
  uploadGroupImage,
  markMessagesAsRead,
} from '../../controllers/chat/chatController.js';

const router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "files/"); // Specify the destination folder
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  });
  
  const upload = multer({ storage: storage });



router.get('/users/:userId', getUsers);
router.post('/messages', upload.single('file'), sendMessage);
router.post('/forwardMessage', forwardMessage);
router.get('/user/:userId', getUserDetails);
router.get('/messages/:senderId/:recepientId', getMessages);
router.post('/deleteMessages', deleteMessages);
router.get('/message/seen/:messageId', getSeenMessages);
router.get('/messagesunseen/unseen/:userId', getUnseenMessagesCount);
router.get('/messagesmark/mark-read', markMessagesAsRead);
router.post('/group/create', createGroup);
router.post('/group/add-members', addGroupMembers);
router.get('/group/messages/:groupId', getGroupMessages);
router.get('/user/:userId/groups', getUserGroups);
router.get('/group/members/:groupId', getGroupMembers);
router.post('/group/remove-member', removeGroupMember);
router.post('/group/leave', leaveGroup);
router.get('/availableUsers/:userId', getAvailableUsers);
router.post('/group/upload-image',upload.single('file'), uploadGroupImage);

export default router;
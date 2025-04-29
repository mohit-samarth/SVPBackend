import { User } from '../../models/userRoles/userSchema.js';
import { AnchalAreaNew } from '../../models/areaAllocation/anchalArea/anchalAreaNewSchema.js';
import { SankulAreaNew } from '../../models/areaAllocation/sankulArea/sankulAreaNewSchema.js';
import { UpSanchAreaNew } from '../../models/areaAllocation/upsanchArea/upsanchAreaNewSchema.js';
import { SanchAreaNew } from '../../models/areaAllocation/sanchArea/sanchAreaNewSchema.js';

import mongoose from "mongoose";
import Message from "../../models/chat/message.js"
import Group from "../../models/chat/group.js"
import { io } from "../../Socket/socket.js"




export const getUsers = async (req, res) => {
    const loggedInUserId = req.params.userId;

    try {
        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(loggedInUserId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        // Find the logged-in user
        const loggedInUser = await User.findById(loggedInUserId);
        if (!loggedInUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        let hierarchicalData = {};
        let summary = {};

        // Handle Anchal Pramukh
        if (loggedInUser.role === 'anchalPramukh') {
            const anchalArea = await AnchalAreaNew.findById(loggedInUser.anchalAreaId);
            if (!anchalArea) {
                return res.status(404).json({ message: "Anchal area not found" });
            }

            // Get all users under this anchal hierarchy
            const anchalPramukh = await User.findOne({
                anchalAreaId: anchalArea._id,
                role: 'anchalPramukh'
            }).select('userName svpEmail role');

            // Get all sankul areas under this anchal
            const sankulAreas = await SankulAreaNew.find({
                anchalName: anchalArea._id
            });

            // Get all sankul pramukhs
            const sankulPramukhs = await User.find({
                sankulAreaId: { $in: sankulAreas.map(sankul => sankul._id) },
                role: 'sankulPramukh'
            }).select('userName svpEmail role sankulAreaId');

            // Get all sanch areas
            const sanchAreas = await SanchAreaNew.find({
                sankulName: { $in: sankulAreas.map(sankul => sankul._id) }
            });

            // Get all sanch pramukhs
            const sanchPramukhs = await User.find({
                sanchAreaId: { $in: sanchAreas.map(sanch => sanch._id) },
                role: 'sanchPramukh'
            }).select('userName svpEmail role sanchAreaId');

            // Get all up-sanch areas and pramukhs
            const upSanchAreas = await UpSanchAreaNew.find({
                sanchName: { $in: sanchAreas.map(sanch => sanch._id) }
            });

            const upSanchPramukhs = await User.find({
                upSanchAreaId: { $in: upSanchAreas.map(upSanch => upSanch._id) },
                role: 'upSanchPramukh'
            }).select('userName svpEmail role upSanchAreaId');

            hierarchicalData = {
                anchal: {
                    name: anchalArea.anchalName,
                    _id: anchalArea._id,

                    pramukh: anchalPramukh ? {
                        id: anchalPramukh._id,
                        name: anchalPramukh.userName,
                        role: anchalPramukh.role
                    } : null,
                    sankuls: await Promise.all(sankulAreas.map(async sankul => {
                        const sankulPramukh = sankulPramukhs.find(
                            user => user.sankulAreaId?.toString() === sankul._id.toString()
                        );

                        const relatedSanchs = sanchAreas.filter(
                            sanch => sanch.sankulName.toString() === sankul._id.toString()
                        );

                        return {
                            name: sankul.sankulName,
                            _id: sankul._id,

                            pramukh: sankulPramukh ? {
                                id: sankulPramukh._id,
                                name: sankulPramukh.userName,
                                role: sankulPramukh.role
                            } : null,
                            sanchs: relatedSanchs.map(sanch => {
                                const sanchPramukh = sanchPramukhs.find(
                                    user => user.sanchAreaId?.toString() === sanch._id.toString()
                                );

                                const relatedUpSanchs = upSanchAreas.filter(
                                    upSanch => upSanch.sanchName.toString() === sanch._id.toString()
                                );
                                return {
                                    name: sanch.sanchName,
                                    _id: sanch._id,

                                    pramukh: sanchPramukh ? {
                                        id: sanchPramukh._id,
                                        name: sanchPramukh.userName,
                                        role: sanchPramukh.role
                                    } : null,
                                    upSanchs: relatedUpSanchs.map(upSanch => {
                                        const upSanchPramukh = upSanchPramukhs.find(
                                            user => user.upSanchAreaId?.toString() === upSanch._id.toString()
                                        );

                                        return {
                                            name: upSanch.upSanchName,
                                            _id: upSanch._id,

                                            pramukh: upSanchPramukh ? {
                                                id: upSanchPramukh._id,
                                                name: upSanchPramukh.userName,
                                                role: upSanchPramukh.role
                                            } : null
                                        };
                                    })
                                };
                            })
                        };
                    }))
                }
            };

            summary = {
                totalSankuls: sankulAreas.length,
                totalSanchs: sanchAreas.length,
                totalUpSanchs: upSanchAreas.length,
                totalSankulPramukhs: sankulPramukhs.length,
                totalSanchPramukhs: sanchPramukhs.length,
                totalUpSanchPramukhs: upSanchPramukhs.length
            };
        }
        // Handle Sankul Pramukh
        else if (loggedInUser.role === 'sankulPramukh') {
            const sankulArea = await SankulAreaNew.findById(loggedInUser.sankulAreaId);
            if (!sankulArea) {
                return res.status(404).json({ message: "Sankul area not found" });
            }

            const anchalArea = await AnchalAreaNew.findById(sankulArea.anchalName);
            const anchalPramukh = await User.findOne({
                anchalAreaId: anchalArea._id,
                role: 'anchalPramukh'
            }).select('userName svpEmail role');
            const sankulPramukh = await User.findOne({
                sankulAreaId: sankulArea._id,
                role: 'sankulPramukh'
            }).select('userName svpEmail role');

            const sanchAreas = await SanchAreaNew.find({
                sankulName: sankulArea._id
            });

            const sanchPramukhs = await User.find({
                sanchAreaId: { $in: sanchAreas.map(sanch => sanch._id) },
                role: 'sanchPramukh'
            }).select('userName svpEmail role sanchAreaId');

            hierarchicalData = {
                sankul: {
                    anchal: anchalArea ? {
                        name: anchalArea.anchalName,
                        _id: anchalArea._id,
                        pramukh: anchalPramukh ? {
                            id: anchalPramukh._id,
                            name: anchalPramukh.userName,
                            email: anchalPramukh.svpEmail,
                            role: anchalPramukh.role
                        } : null
                    } : null,
                    pramukh: sankulPramukh ? {
                        id: sankulPramukh._id,
                        name: sankulPramukh.userName,
                        email: sankulPramukh.svpEmail,
                        role: sankulPramukh.role
                    } : null,
                    sanchs: sanchAreas.map(sanch => {
                        const sanchPramukh = sanchPramukhs.find(
                            user => user.sanchAreaId?.toString() === sanch._id.toString()
                        );

                        return {
                            name: sanch.sanchName,

                            pramukh: sanchPramukh ? {
                                id: sanchPramukh._id,
                                name: sanchPramukh.userName,
                                email: sanchPramukh.svpEmail,
                                role: sanchPramukh.role
                            } : null
                        };
                    })
                }
            };

            summary = {
                totalSanchs: sanchAreas.length,
                totalSanchPramukhs: sanchPramukhs.length
            };
        }

        // Handle Sanch Pramukh
        else if (loggedInUser.role === 'sanchPramukh') {
            const sanchArea = await SanchAreaNew.findById(loggedInUser.sanchAreaId);
            if (!sanchArea) {
                return res.status(404).json({ message: "Sanch area not found" });
            }

            // Get parent Sankul and Anchal
            const sankulArea = await SankulAreaNew.findById(sanchArea.sankulName);
            const anchalArea = sankulArea ? await AnchalAreaNew.findById(sankulArea.anchalName) : null;


            const anchalPramukh = anchalArea ? await User.findOne({
                anchalAreaId: anchalArea._id,
                role: 'anchalPramukh'
            }).select('userName svpEmail role') : null;

            const sankulPramukh = await User.findOne({
                sankulAreaId: sankulArea._id,
                role: 'sankulPramukh'
            }).select('userName svpEmail role');

            const sanchPramukh = await User.findOne({
                sanchAreaId: sanchArea._id,
                role: 'sanchPramukh'
            }).select('userName svpEmail role');

            // Get all up-sanch areas under this Sanch
            const upSanchAreas = await UpSanchAreaNew.find({
                sanchName: sanchArea._id
            });

            // Get all up-sanch pramukhs
            const upSanchPramukhs = await User.find({
                upSanchAreaId: { $in: upSanchAreas.map(upSanch => upSanch._id) },
                role: 'upSanchPramukh'
            }).select('userName svpEmail role upSanchAreaId');

            hierarchicalData = {
                sanch: {
                    name: sanchArea.sanchName,
                    _id: sanchArea._id,

                    anchal: anchalArea ? {
                        name: anchalArea.anchalName,
                        _id: anchalArea._id,
                        pramukh: anchalPramukh ? {
                            id: anchalPramukh._id,
                            name: anchalPramukh.userName,
                            email: anchalPramukh.svpEmail,
                            role: anchalPramukh.role
                        } : null
                    } : null,

                    sankul: sankulArea ? {
                        name: sankulArea.sankulName,
                        _id: sankulArea._id,
                        pramukh: sankulPramukh ? {
                            id: sankulPramukh._id,
                            name: sankulPramukh.userName,
                            email: sankulPramukh.svpEmail,
                            role: sankulPramukh.role
                        } : null
                    } : null,

                    pramukh: sanchPramukh ? {
                        id: sanchPramukh._id,
                        name: sanchPramukh.userName,
                        email: sanchPramukh.svpEmail,
                        role: sanchPramukh.role
                    } : null,

                    upSanchs: upSanchAreas.map(upSanch => {
                        const upSanchPramukh = upSanchPramukhs.find(
                            user => user.upSanchAreaId?.toString() === upSanch._id.toString()
                        );

                        return {
                            name: upSanch.upSanchName,
                            _id: upSanch._id,
                            pramukh: upSanchPramukh ? {
                                id: upSanchPramukh._id,
                                name: upSanchPramukh.userName,
                                email: upSanchPramukh.svpEmail,
                                role: upSanchPramukh.role
                            } : null
                        };
                    })
                }
            };

            summary = {
                totalUpSanchs: upSanchAreas.length,
                totalUpSanchPramukhs: upSanchPramukhs.length
            };
        }
        // Handle Up-Sanch Pramukh
        else if (loggedInUser.role === 'upSanchPramukh') {
            const upSanchArea = await UpSanchAreaNew.findById(loggedInUser.upSanchAreaId);
            if (!upSanchArea) {
                return res.status(404).json({ message: "Up-Sanch area not found" });
            }

            // Get parent Sanch, Sankul and Anchal
            const sanchArea = await SanchAreaNew.findById(upSanchArea.sanchName);
            const sankulArea = sanchArea ? await SankulAreaNew.findById(sanchArea.sankulName) : null;
            const anchalArea = sankulArea ? await AnchalAreaNew.findById(sankulArea.anchalName) : null;

            // Get all Pramukhs
            const anchalPramukh = anchalArea ? await User.findOne({
                anchalAreaId: anchalArea._id,
                role: 'anchalPramukh'
            }).select('userName svpEmail role') : null;

            const sankulPramukh = sankulArea ? await User.findOne({
                sankulAreaId: sankulArea._id,
                role: 'sankulPramukh'
            }).select('userName svpEmail role') : null;

            const sanchPramukh = sanchArea ? await User.findOne({
                sanchAreaId: sanchArea._id,
                role: 'sanchPramukh'
            }).select('userName svpEmail role') : null;

            const upSanchPramukh = await User.findOne({
                upSanchAreaId: upSanchArea._id,
                role: 'upSanchPramukh'
            }).select('userName svpEmail role');

            // Get all Aacharyas under this upSanch
            const aacharyas = await User.find({
                upSanchAreaId: upSanchArea._id,
                role: 'aacharya'
            }).select('_id userName svpEmail role');

            // Get all GramSamiti members under this upSanch
            const gramSamitiMembers = await User.find({
                upSanchAreaId: upSanchArea._id,
                role: { $in: ['pradhan', 'uppradhan', 'sachiv', 'upsachiv', 'sadasya1', 'sadasya2', 'sadasya3'] }
            }).select('_id userName svpEmail role');

            hierarchicalData = {
                upSanch: {
                    name: upSanchArea.upSanchName,
                    _id: upSanchArea._id,

                    anchal: anchalArea ? {
                        name: anchalArea.anchalName,
                        _id: anchalArea._id,
                        pramukh: anchalPramukh ? {
                            id: anchalPramukh._id,
                            name: anchalPramukh.userName,
                            email: anchalPramukh.svpEmail,
                            role: anchalPramukh.role
                        } : null
                    } : null,

                    sankul: sankulArea ? {
                        name: sankulArea.sankulName,
                        _id: sankulArea._id,
                        pramukh: sankulPramukh ? {
                            id: sankulPramukh._id,
                            name: sankulPramukh.userName,
                            email: sankulPramukh.svpEmail,
                            role: sankulPramukh.role
                        } : null
                    } : null,

                    sanch: sanchArea ? {
                        name: sanchArea.sanchName,
                        _id: sanchArea._id,
                        pramukh: sanchPramukh ? {
                            id: sanchPramukh._id,
                            name: sanchPramukh.userName,
                            email: sanchPramukh.svpEmail,
                            role: sanchPramukh.role
                        } : null
                    } : null,

                    pramukh: upSanchPramukh ? {
                        id: upSanchPramukh._id,
                        name: upSanchPramukh.userName,
                        email: upSanchPramukh.svpEmail,
                        role: upSanchPramukh.role
                    } : null,

                    // Add Aacharyas under this upSanch
                    aacharyas: aacharyas.map(aacharya => ({
                        id: aacharya._id,
                        name: aacharya.userName,
                        email: aacharya.svpEmail,
                        role: aacharya.role
                    })),
                     // Add GramSamiti members under this upSanch
                     gramSamitiMembers: gramSamitiMembers.map(member => ({
                        id: member._id,
                        name: member.userName,
                        email: member.svpEmail,
                        role: member.role
                    }))
                }
            };
        }
        else if (loggedInUser.role === 'aacharya') {
            const upSanchArea = await UpSanchAreaNew.findById(loggedInUser.upSanchAreaId);
            if (!upSanchArea) {
                return res.status(404).json({ message: "Up-Sanch area not found" });
            }

            // Get parent Sanch, Sankul and Anchal
            const sanchArea = await SanchAreaNew.findById(upSanchArea.sanchName);
            const sankulArea = sanchArea ? await SankulAreaNew.findById(sanchArea.sankulName) : null;
            const anchalArea = sankulArea ? await AnchalAreaNew.findById(sankulArea.anchalName) : null;

            // Get all Pramukhs
            const anchalPramukh = anchalArea ? await User.findOne({
                anchalAreaId: anchalArea._id,
                role: 'anchalPramukh'
            }).select('userName svpEmail role') : null;

            const sankulPramukh = sankulArea ? await User.findOne({
                sankulAreaId: sankulArea._id,
                role: 'sankulPramukh'
            }).select('userName svpEmail role') : null;

            const sanchPramukh = sanchArea ? await User.findOne({
                sanchAreaId: sanchArea._id,
                role: 'sanchPramukh'
            }).select('userName svpEmail role') : null;

            const upSanchPramukh = await User.findOne({
                upSanchAreaId: upSanchArea._id,
                role: 'upSanchPramukh'
            }).select('userName svpEmail role');

            hierarchicalData = {
                aacharya: {
                    id: loggedInUser._id,
                    name: loggedInUser.userName,
                    email: loggedInUser.svpEmail,
                    role: loggedInUser.role,

                    upSanch: {
                        name: upSanchArea.upSanchName,
                        _id: upSanchArea._id,
                        pramukh: upSanchPramukh ? {
                            id: upSanchPramukh._id,
                            name: upSanchPramukh.userName,
                            email: upSanchPramukh.svpEmail,
                            role: upSanchPramukh.role
                        } : null
                    },

                    sanch: sanchArea ? {
                        name: sanchArea.sanchName,
                        _id: sanchArea._id,
                        pramukh: sanchPramukh ? {
                            id: sanchPramukh._id,
                            name: sanchPramukh.userName,
                            email: sanchPramukh.svpEmail,
                            role: sanchPramukh.role
                        } : null
                    } : null,

                    sankul: sankulArea ? {
                        name: sankulArea.sankulName,
                        _id: sankulArea._id,
                        pramukh: sankulPramukh ? {
                            id: sankulPramukh._id,
                            name: sankulPramukh.userName,
                            email: sankulPramukh.svpEmail,
                            role: sankulPramukh.role
                        } : null
                    } : null,

                    anchal: anchalArea ? {
                        name: anchalArea.anchalName,
                        _id: anchalArea._id,
                        pramukh: anchalPramukh ? {
                            id: anchalPramukh._id,
                            name: anchalPramukh.userName,
                            email: anchalPramukh.svpEmail,
                            role: anchalPramukh.role
                        } : null
                    } : null
                }
            };
        }
        // Handle GramSamiti members (Pradhan, UpPradhan, etc.)
        else if (['pradhan', 'uppradhan', 'sachiv', 'upsachiv', 'sadasya1', 'sadasya2', 'sadasya3'].includes(loggedInUser.role)) {
            const upSanchArea = await UpSanchAreaNew.findById(loggedInUser.upSanchAreaId);
            if (!upSanchArea) {
                return res.status(404).json({ message: "Up-Sanch area not found" });
            }

            // Get parent Sanch, Sankul and Anchal
            const sanchArea = await SanchAreaNew.findById(upSanchArea.sanchName);
            const sankulArea = sanchArea ? await SankulAreaNew.findById(sanchArea.sankulName) : null;
            const anchalArea = sankulArea ? await AnchalAreaNew.findById(sankulArea.anchalName) : null;

            // Get UpSanch Pramukh
            const upSanchPramukh = await User.findOne({
                upSanchAreaId: upSanchArea._id,
                role: 'upSanchPramukh'
            }).select('userName svpEmail role');

            // Get all other GramSamiti members in this UpSanch
            const gramSamitiMembers = await User.find({
                upSanchAreaId: upSanchArea._id,
                role: { $in: ['pradhan', 'uppradhan', 'sachiv', 'upsachiv', 'sadasya1', 'sadasya2', 'sadasya3'] },
                _id: { $ne: loggedInUserId } // Exclude the logged-in user
            }).select('_id userName svpEmail role');

            hierarchicalData = {
                gramSamiti: {
                    member: {
                        id: loggedInUser._id,
                        name: loggedInUser.userName,
                        email: loggedInUser.svpEmail,
                        role: loggedInUser.role
                    },
                    
                    upSanch: {
                        name: upSanchArea.upSanchName,
                        _id: upSanchArea._id,
                        pramukh: upSanchPramukh ? {
                            id: upSanchPramukh._id,
                            name: upSanchPramukh.userName,
                            email: upSanchPramukh.svpEmail,
                            role: upSanchPramukh.role
                        } : null
                    },
                    
                    otherMembers: gramSamitiMembers.map(member => ({
                        id: member._id,
                        name: member.userName,
                        email: member.svpEmail,
                        role: member.role
                    })),
                    
                    sanch: sanchArea ? {
                        name: sanchArea.sanchName,
                        _id: sanchArea._id
                    } : null
                }
            };
            
            summary = {
                totalGramSamitiMembers: gramSamitiMembers.length + 1 // Include the logged-in user
            };
        }

        else {
            return res.status(403).json({
                success: false,
                message: "Access restricted to Anchal Pramukh, Sankul Pramukh, Sanch Pramukh, UpSanch Pramukh and Aacharya"
            });
        }


        return res.status(200).json({
            success: true,
            message: "Hierarchy retrieved successfully",
            data: hierarchicalData,
            summary
        });

    } catch (error) {
        console.error("Error retrieving hierarchy:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
export const sendMessage = async (req, res) => {
    try {
        const { senderId, recepientId, groupId, messageType, messageText } = req.body;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(senderId)) {
            return res.status(400).json({ error: "Invalid senderId" });
        }
        if (recepientId && !mongoose.Types.ObjectId.isValid(recepientId)) {
            return res.status(400).json({ error: "Invalid recepientId" });
        }
        if (groupId && !mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ error: "Invalid groupId" });
        }

        // Create the new message with an initial status of "sent"
        const newMessage = new Message({
            senderId,
            recepientId: recepientId || null,
            groupId: groupId || null,
            messageType,
            message: messageText,
            timestamp: new Date(),
            fileUrl: req.file ? req.file.path : null, // Store the file path if file exists
            fileType: req.file ? req.file.mimetype : null, // Store the file type (e.g., image/png)
            status: "sent", // Initial status is "sent"
        });

        // Save message to the database
        await newMessage.save();

        // Populate senderId with user details
        await newMessage.populate("senderId");

        // Emit the message in real-time to the appropriate room (group or direct)
        if (groupId) {
            io.to(groupId).emit("newGroupMessage", newMessage);
        } else {
            io.to(recepientId).emit("newMessage", newMessage);
        }

        // This simulates message delivery by emitting the 'messageDelivered' event
        if (groupId) {
            io.to(senderId).emit("messageDelivered", { messageId: newMessage._id, status: "delivered" });
        } else {
            io.to(senderId).emit("messageDelivered", { messageId: newMessage._id, status: "delivered" });
            io.to(recepientId).emit("messageDelivered", { messageId: newMessage._id, status: "delivered" });
        }

        res.status(200).json({ message: "Message sent successfully", data: newMessage });
    } catch (error) {
        console.log("Error saving message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const forwardMessage = async (req, res) => {
    const { messageId, newRecipientId, isGroup } = req.body;

    try {
        const originalMessage = await Message.findById(messageId);
        if (!originalMessage) {
            return res.status(404).json({ error: "Message not found" });
        }

        const forwardedMessage = new Message({
            senderId: originalMessage.senderId,
            recepientId: isGroup ? null : newRecipientId, // If forwarding to group, recipientId is null
            groupId: isGroup ? newRecipientId : originalMessage.groupId, // Use groupId if forwarding to group
            messageType: originalMessage.messageType,
            message: originalMessage.message,
            timestamp: new Date(),
            fileUrl: originalMessage.fileUrl || null,
            fileType: originalMessage.fileType || null,
            seenBy: [],
            isForwarded: true,
            forwardedFrom: originalMessage.senderId,
        });

        await forwardedMessage.save();

        if (isGroup) {
            io.to(newRecipientId).emit("newGroupMessage", forwardedMessage); // Emit to the group
        } else {
            io.to(newRecipientId).emit("newMessage", forwardedMessage); // Emit to the individual
        }

        res.status(200).json({ message: "Message forwarded successfully", data: forwardedMessage });
    } catch (error) {
        console.log("Error forwarding message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        //fetch the user data from the user ID
        const recepientId = await User.findById(userId);

        res.json(recepientId);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { senderId, recepientId } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(recepientId)) {
            return res.status(400).json({ error: "Invalid senderId or recepientId" });
        }

        // Find messages between sender and recipient
        const messages = await Message.find({
            $or: [
                { senderId: senderId, recepientId: recepientId },
                { senderId: recepientId, recepientId: senderId },
            ],
        }).populate("senderId", "_id userName");

        res.json(messages);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const deleteMessages = async (req, res) => {
    try {
        const { messages } = req.body;

        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ message: "invalid req body!" });
        }

        await Message.deleteMany({ _id: { $in: messages } });

        res.json({ message: "Message deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server" });
    }
};

export const getSeenMessages = async (req, res) => {
    try {
        const { messageId } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ error: "Invalid messageId" });
        }

        const message = await Message.findById(messageId).populate("seenBy.userId", "userName");
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        const seenBy = message.seenBy.map((seen) => ({
            name: seen.userId.userName,
            seenAt: seen.seenAt,
        }));

        res.json(seenBy);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Mark Messages as Read & Reset Counter
export const markMessagesAsRead = async (req, res) => {
    try {
        const { userId } = req.body;
        const { senderId, groupId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId) ||
            (senderId && !mongoose.Types.ObjectId.isValid(senderId)) ||
            (groupId && !mongoose.Types.ObjectId.isValid(groupId))) {
            return res.status(400).json({ error: 'Invalid IDs provided' });
        }

        let updateCondition = {
            recipientId: new mongoose.Types.ObjectId(userId),
            'seenBy.userId': {
                $ne: new mongoose.Types.ObjectId(userId)
            }
        };

        if (groupId) {
            updateCondition.groupId = new mongoose.Types.ObjectId(groupId);
        } else if (senderId) {
            updateCondition.senderId = new mongoose.Types.ObjectId(senderId);
        }

        await Message.updateMany(
            updateCondition,
            {
                $addToSet: {
                    seenBy: {
                        userId: new mongoose.Types.ObjectId(userId),
                        seenAt: new Date()
                    }
                }
            }
        );

        // Emit unread count reset event
        io.to(userId).emit('unreadCountReset', { senderId, groupId });

        return res.json({ success: true, message: 'Messages marked as read' });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getUnseenMessagesCount = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).lean();
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Get direct message counts
        const directMessageCounts = await Message.aggregate([
            {
                $match: {
                    recepientId: new mongoose.Types.ObjectId(userId),
                    groupId: null,
                    status: { $ne: "seen" },
                    $or: [
                        { 'seenBy.userId': { $ne: new mongoose.Types.ObjectId(userId) } },
                        { seenBy: { $size: 0 } }
                    ]
                }
            },
            {
                $group: {
                    _id: "$senderId",
                    unseenCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    userId: "$_id",
                    unseenCount: 1,
                    _id: 0
                }
            }
        ]);

        // Get group message counts
        const groupMessageCounts = await Message.aggregate([
            {
                $match: {
                    groupId: {
                        $in: user.groups?.map(id => new mongoose.Types.ObjectId(id)) || []
                    },
                    senderId: { $ne: new mongoose.Types.ObjectId(userId) },
                    status: { $ne: "seen" },
                    $or: [
                        { 'seenBy.userId': { $ne: new mongoose.Types.ObjectId(userId) } },
                        { seenBy: { $size: 0 } }
                    ]
                }
            },
            {
                $group: {
                    _id: "$groupId",
                    unseenCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    groupId: "$_id",
                    unseenCount: 1,
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            directMessages: directMessageCounts,
            groupMessages: groupMessageCounts
        });

    } catch (error) {
        console.error("Error fetching unseen message count:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: error.message
        });
    }
};

export const createGroup = async (req, res) => {
    try {
        const { name, creatorId, members } = req.body;

        // Fetch the creator's details
        const creator = await User.findById(creatorId);
        if (!creator) {
            return res.status(404).json({ message: "Creator not found" });
        }

        // Define allowed roles for group creation
        const allowedRoles = [
            "superAdmin",
            "systemAdmin",
            "anchalPramukh",
            "sankulPramukh",
            "sanchPramukh",
            "upSanchPramukh"
        ];

        if (!allowedRoles.includes(creator.role)) {
            return res.status(403).json({
                message: "You don't have permission to create groups"
            });
        }

        // Validate members based on creator's role hierarchy
        const invalidMembers = [];
        for (const memberId of members) {
            const member = await User.findById(memberId);
            if (!member) {
                invalidMembers.push(memberId);
                continue;
            }

            // Check hierarchy based on creator's role
            switch (creator.role) {
                case "superAdmin":
                case "systemAdmin":
                    // Can add anyone to the group
                    break;

                case "anchalPramukh":
                    // Can only add users from their Anchal
                    if (member.anchal?.toString() !== creator.anchal?.toString()) {
                        invalidMembers.push(memberId);
                    }
                    break;

                case "sankulPramukh":
                    // Can only add users from their Sankul
                    if (member.sankul?.toString() !== creator.sankul?.toString()) {
                        invalidMembers.push(memberId);
                    }
                    break;

                case "sanchPramukh":
                    // Can only add users from their Sanch
                    if (member.sanch?.toString() !== creator.sanch?.toString()) {
                        invalidMembers.push(memberId);
                    }
                    break;

                case "upSanchPramukh":
                    // Can only add users from their Up-Sanch
                    if (member.upSanch?.toString() !== creator.upSanch?.toString()) {
                        invalidMembers.push(memberId);
                    }
                    break;
            }
        }

        if (invalidMembers.length > 0) {
            return res.status(400).json({
                message: "Some members don't belong to your administrative area",
                invalidMembers
            });
        }

        // Create the group with validated members
        const newGroup = new Group({
            name,
            creatorId,
            members: [creatorId, ...members], // Include creator in the group
            createdBy: creator.role, // Store the role of who created the group
            hierarchyLevel: {
                anchal: creator.anchal,
                sankul: creator.sankul,
                sanch: creator.sanch,
                upSanch: creator.upSanch
            }
        });

        await newGroup.save();

        res.status(201).json({
            success: true,
            message: "Group created successfully",
            group: newGroup
        });

    } catch (error) {
        console.error("Group creation error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

export const addGroupMembers = async (req, res) => {
    try {
        const { groupId, userId, members } = req.body;

        // Fetch the group details
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if the user is the group creator
        if (group.creatorId.toString() !== userId) {
            return res.status(403).json({
                message: "Only the group creator can add members to this group",
            });
        }

        // Ensure all members being added are valid
        const invalidMembers = [];
        for (const memberId of members) {
            const member = await User.findById(memberId);
            if (!member) {
                invalidMembers.push(memberId);
            }
        }

        if (invalidMembers.length > 0) {
            return res.status(400).json({
                message: "Some members are invalid",
                invalidMembers,
            });
        }

        // Add the new members to the group
        await Group.findByIdAndUpdate(groupId, {
            $addToSet: { members: { $each: members } }, // Add unique members to the group
        });

        res.status(200).json({ message: "Members added successfully" });
    } catch (error) {
        console.error("Error adding members:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ error: "Invalid groupId" });
        }

        const messages = await Message.find({ groupId }).populate("senderId", "userName");

        res.status(200).json(messages);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getUserGroups = async (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: "Invalid userId" });
    }
    try {
        const groups = await Group.find({ members: userId });
        res.json(groups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ error: "Invalid groupId" });
        }

        // Fetch the group and populate member and admin details
        const group = await Group.findById(groupId)
            .populate("members", "userName email image")
            .populate("creatorId", "userName email");

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        res.json({
            admin: group.creatorId,
            members: group.members,
            groupProfileImage: group.image, // Send the group profile image URL
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const removeGroupMember = async (req, res) => {
    try {
        const { groupId, adminId, memberId } = req.body;

        // Fetch the group details
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Check if the requester is the group admin
        if (group.creatorId.toString() !== adminId.toString()) {
            return res.status(403).json({ message: "Only the group admin can remove members" });
        }

        // Remove the member from the group
        await Group.findByIdAndUpdate(groupId, {
            $pull: { members: memberId },
        });

        res.status(200).json({ message: "Member removed successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const leaveGroup = async (req, res) => {
    try {
        const { groupId, memberId } = req.body;

        // Fetch the group details
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Remove the member from the group
        await Group.findByIdAndUpdate(groupId, {
            $pull: { members: memberId },
        });

        res.status(200).json({ message: "You have left the group successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getAvailableUsers = async (req, res) => {
    const loggedInUserId = req.params.userId;
    const { role, groupId } = req.query;

    try {
        // Validate userId format
        if (!mongoose.Types.ObjectId.isValid(loggedInUserId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format"
            });
        }

        // Find the logged-in user
        const loggedInUser = await User.findById(loggedInUserId);
        if (!loggedInUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Initialize filter for users
        let userFilter = {};
        if (role) {
            userFilter.role = role;
        }

        // Handle group member filtering
        if (groupId) {
            const group = await Group.findById(groupId);
            if (!group) {
                return res.status(404).json({
                    success: false,
                    message: "Group not found"
                });
            }
            if (group.members && group.members.length > 0) {
                userFilter._id = { $nin: group.members };
            }
        }

        let availableUsers = [];

        // Handle Anchal Pramukh
        if (loggedInUser.role === 'anchalPramukh') {
            const anchalArea = await AnchalAreaNew.findById(loggedInUser.anchalAreaId);
            if (!anchalArea) {
                return res.status(404).json({ message: "Anchal area not found" });
            }

            // Get all sankul areas under this anchal
            const sankulAreas = await SankulAreaNew.find({
                anchalName: anchalArea._id
            });

            // Get all sanch areas
            const sanchAreas = await SanchAreaNew.find({
                sankulName: { $in: sankulAreas.map(sankul => sankul._id) }
            });

            // Get all up-sanch areas
            const upSanchAreas = await UpSanchAreaNew.find({
                sanchName: { $in: sanchAreas.map(sanch => sanch._id) }
            });

            // Build filter for users under this hierarchy
            const hierarchyFilter = {
                $or: [
                    { anchalAreaId: anchalArea._id },
                    { sankulAreaId: { $in: sankulAreas.map(area => area._id) } },
                    { sanchAreaId: { $in: sanchAreas.map(area => area._id) } },
                    { upSanchAreaId: { $in: upSanchAreas.map(area => area._id) } }
                ],
                ...userFilter
            };

            availableUsers = await User.find(hierarchyFilter)
                .select('userName svpEmail role');
        }
        // Handle Sankul Pramukh
        else if (loggedInUser.role === 'sankulPramukh') {
            const sankulArea = await SankulAreaNew.findById(loggedInUser.sankulAreaId);
            if (!sankulArea) {
                return res.status(404).json({ message: "Sankul area not found" });
            }

            // Get all sanch areas under this sankul
            const sanchAreas = await SanchAreaNew.find({
                sankulName: sankulArea._id
            });

            // Get all up-sanch areas
            const upSanchAreas = await UpSanchAreaNew.find({
                sanchName: { $in: sanchAreas.map(sanch => sanch._id) }
            });

            // Build filter for users under this hierarchy
            const hierarchyFilter = {
                $or: [
                    { sankulAreaId: sankulArea._id },
                    { sanchAreaId: { $in: sanchAreas.map(area => area._id) } },
                    { upSanchAreaId: { $in: upSanchAreas.map(area => area._id) } }
                ],
                ...userFilter
            };

            availableUsers = await User.find(hierarchyFilter)
                .select('userName svpEmail role');
        }
        // Handle Sanch Pramukh
        else if (loggedInUser.role === 'sanchPramukh') {
            const sanchArea = await SanchAreaNew.findById(loggedInUser.sanchAreaId);
            if (!sanchArea) {
                return res.status(404).json({ message: "Sanch area not found" });
            }

            // Get all up-sanch areas under this sanch
            const upSanchAreas = await UpSanchAreaNew.find({
                sanchName: sanchArea._id
            });

            // Build filter for users under this hierarchy
            const hierarchyFilter = {
                $or: [
                    { sanchAreaId: sanchArea._id },
                    { upSanchAreaId: { $in: upSanchAreas.map(area => area._id) } }
                ],
                ...userFilter
            };

            availableUsers = await User.find(hierarchyFilter)
                .select('userName svpEmail role');
        } else {
            return res.status(403).json({
                success: false,
                message: "Access restricted to Anchal Pramukh, Sankul Pramukh and Sanch Pramukh"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Available users retrieved successfully",
            data: availableUsers
        });

    } catch (error) {
        console.error("Error retrieving available users:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

export const uploadGroupImage = async (req, res) => {
    try {
        const { groupId } = req.body;

        // Ensure file exists
        if (!req.file) {
            return res.status(400).json({ message: "No image file uploaded" });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Save the image URL in the group record
        const imageUrl = `/files/${req.file.filename}`;
        group.image = imageUrl;
        await group.save();

        res.status(200).json({
            message: "Group image uploaded successfully",
            imageUrl,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
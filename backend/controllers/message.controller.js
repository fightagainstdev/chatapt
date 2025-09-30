import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
	try {
		const { message } = req.body;
		const { id: receiverId } = req.params;
		const senderId = req.user._id;

		// Validate and convert string ID to ObjectId
		if (!mongoose.Types.ObjectId.isValid(receiverId)) {
			return res.status(400).json({ error: "无效的用户ID" });
		}
		const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, receiverObjectId] },
		});

		if (!conversation) {
			conversation = await Conversation.create({
				participants: [senderId, receiverObjectId],
			});
		}

		const newMessage = new Message({
			senderId,
			receiverId,
			message,
		});

		if (newMessage) {
			conversation.messages.push(newMessage._id);
		}

		// await conversation.save();
		// await newMessage.save();

		// this will run in parallel
		await Promise.all([conversation.save(), newMessage.save()]);

		// SOCKET IO FUNCTIONALITY WILL GO HERE
		const receiverSocketId = getReceiverSocketId(receiverId);
		if (receiverSocketId) {
			// io.to(<socket_id>).emit() used to send events to specific client
			io.to(receiverSocketId).emit("newMessage", newMessage);
		}

		res.status(201).json(newMessage);
	} catch (error) {
		console.log("发送消息控制器错误：", error.message);
		res.status(500).json({ error: "内部服务器错误" });
	}
};

export const getMessages = async (req, res) => {
	try {
		const { id: userToChatId } = req.params;
		const senderId = req.user._id;

		// Validate and convert string ID to ObjectId
		if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
			return res.status(400).json({ error: "无效的用户ID" });
		}
		const userToChatObjectId = new mongoose.Types.ObjectId(userToChatId);

		const conversation = await Conversation.findOne({
			participants: { $all: [senderId, userToChatObjectId] },
		}).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES

		if (!conversation) return res.status(200).json([]);

		const messages = conversation.messages;

		res.status(200).json(messages);
	} catch (error) {
		console.log("获取消息控制器错误：", error.message);
		res.status(500).json({ error: "内部服务器错误" });
	}
};

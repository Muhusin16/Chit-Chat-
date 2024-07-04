const Messages = require("../models/messageModel");
const User = require("../models/userModel")

const getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    }).sort({ createdAt: 1 });

    const projectedMessages = messages.map((msg) => ({
      fromSelf: msg.sender.toString() === from,
      message: msg.message.text,
      timestamp: msg.createdAt,
    }));
    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

const addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;

    // Ensure message is an object with a text property
    if (typeof message !== 'string') {
      return res.status(400).json({ msg: "Invalid message format" });
    }

    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
      read: false,
    });

    if (data) return res.json({ msg: "Message added successfully." });
    else return res.status(400).json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};

const getUnreadMessageCount = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    // Count unread messages from 'from' to 'to'
    const unreadCount = await Messages.countDocuments({
      sender: from,
      read: false,
      users: { $all: [from, to] },
    });

    res.json({ unreadCount });
  } catch (ex) {
    next(ex);
  }
};

const markMessagesAsRead = async (req, res, next) => {
  try {
    const { from, to } = req.body;
    
    const updatedMessages = await Messages.updateMany(
      { sender: from, users: { $all: [from, to] }, read: false },
      { $set: { read: true } }
    );

    res.json({ msg: "Messages marked as read.", count: updatedMessages.modifiedCount });
  } catch (ex) {
    next(ex);
  }
};

const getContactsData = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const contacts = await User.find({ _id: { $ne: userId } }); // Fetch all users except the current user

    const contactsData = await Promise.all(contacts.map(async (contact) => {
      const unreadCount = await Messages.countDocuments({
        sender: contact._id,
        read: false,
        users: { $all: [contact._id, userId] },
      });

      const lastMessage = await Messages.findOne({
        users: { $all: [contact._id, userId] },
      }).sort({ createdAt: -1 });

      return {
        contact,
        unreadCount,
        lastMessageTime: lastMessage ? lastMessage.createdAt : null,
      };
    }));

    res.json({ contactsData });
  } catch (ex) {
    next(ex);
  }
};


module.exports = {
  getMessages,
  addMessage,
  getUnreadMessageCount,
  markMessagesAsRead,
  getContactsData
};

const express = require('express')

const { addMessage, getMessages, markMessagesAsRead, getUnreadMessageCount } = require("../controllers/messageController");
const router = express.Router();

router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);
// router.post("/mark-messages-as-read", markMessagesAsRead);
// router.post("/unread-messages", getUnreadMessageCount);

module.exports = router;
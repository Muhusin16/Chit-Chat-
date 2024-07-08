import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute, readMessageRoute, getUnreadMessagesAndLastMessageTimeRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, socket, setContactsData }) {
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();
  const [arrivalMessage, setArrivalMessage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await JSON.parse(
          localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
        );

        if (data && currentChat) {
          const response = await axios.post(recieveMessageRoute, {
            from: data._id,
            to: currentChat._id,
          });
          setMessages(response.data);

          // Mark messages as read
          await axios.post(readMessageRoute, {
            from: data._id,
            to: currentChat._id,
          });

          // Fetch and update contacts data
          if (setContactsData) {
            await fetchContactsData(data._id);
          }
        }
      } catch (error) {
        console.error("Error fetching messages:", error.response || error);
      }
    };

    fetchData();
  }, [currentChat]);

  const handleSendMsg = async (msg) => {
    const data = await JSON.parse(
      localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)
    );

    const message = {
      to: currentChat._id,
      from: data._id,
      msg,
    };

    try {
      // Emit to the socket server
      socket.current.emit("send-msg", message);

      // Send to the backend API
      await axios.post(sendMessageRoute, {
        from: data._id,
        to: currentChat._id,
        message: msg, // Send as a string
      });

      // Update local messages with timestamp
      setMessages((prev) => [
        ...prev,
        { fromSelf: true, message: msg, timestamp: new Date() },
      ]);
    } catch (error) {
      console.error("Error sending message:", error.response || error);
    }
  };

  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-recieve", (msg) => {
        setArrivalMessage({ fromSelf: false, message: msg.text, timestamp: msg.timestamp });
      });
    }
  }, [socket]);

  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchContactsData = async (userId) => {
    try {
      const response = await axios.post(getUnreadMessagesAndLastMessageTimeRoute, {
        userId,
      });
      setContactsData(response.data.contactsData);
    } catch (error) {
      console.error("Error fetching contacts data:", error.response || error);
    }
  };

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
          </div>
        </div>
        <Logout />
      </div>
      <div className="chat-messages">
        {messages.map((message) => (
          <div ref={scrollRef} key={uuidv4()}>
            <div
              className={`message ${message.fromSelf ? "sended" : "recieved"
                }`}
            >
              <div className="content">
                <p>{message.message}</p>
                <span className="timestamp">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ChatInput handleSendMsg={handleSendMsg} />
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 80% 10%;
  gap: 0.1rem;
  overflow: hidden;
  @media screen and (min-width: 720px) and (max-width: 1080px) {
    grid-template-rows: 15% 70% 15%;
  }
  .chat-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 2rem;
    .user-details {
      display: flex;
      align-items: center;
      gap: 1rem;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .username {
        h3 {
          color: white;
        }
      }
    }
  }
  .chat-messages {
    padding: 1rem 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .message {
      display: flex;
      align-items: center;
      .content {
        max-width: 40%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;
        position: relative;
        @media screen and (min-width: 720px) and (max-width: 1080px) {
          max-width: 70%;
        }
        .timestamp {
          font-size: 0.8rem;
          color: #a0a0a0;
          position: absolute;
          bottom: -1.5rem;
          right: 0;
        }
      }
    }
    .sended {
      justify-content: flex-end;
      .content {
        background-color: #4f04ff21;
      }
    }
    .recieved {
      justify-content: flex-start;
      .content {
        background-color: #9900ff20;
      }
    }
  }
`;

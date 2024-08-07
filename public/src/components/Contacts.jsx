import React, { useState, useEffect } from "react";
import styled from "styled-components";
import Logo from "../assets/logo.svg";
import axios from "axios";
import { getUnreadMessagesAndLastMessageTimeRoute } from "../utils/APIRoutes";

export default function Contacts({ contacts, changeChat }) {
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentUserImage, setCurrentUserImage] = useState("");
  const [currentSelected, setCurrentSelected] = useState(null);
  const [contactsData, setContactsData] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const storedData = localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY);
        if (storedData) {
          const data = JSON.parse(storedData);
          setCurrentUserName(data?.username || "");
          setCurrentUserImage(data?.avatarImage || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchContactsData = async () => {
      try {
        const storedData = localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY);
        if (storedData) {
          const data = JSON.parse(storedData);
          const response = await axios.post(getUnreadMessagesAndLastMessageTimeRoute, { userId: data._id });
          setContactsData(response.data.contactsData || []);
        }
      } catch (error) {
        console.error("Error fetching contacts data:", error);
      }
    };

    fetchContactsData();
  }, []);

  const changeCurrentChat = async (index, contact) => {
    setCurrentSelected(index);
    changeChat(contact);

    try {
      const storedData = localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY);
      if (storedData) {
        const data = JSON.parse(storedData);
        // Optimistically update the contactsData state
        setContactsData(prevContactsData =>
          prevContactsData.map(contactData =>
            contactData.contact._id === contact._id
              ? { ...contactData, unreadCount: 0 }
              : contactData
          )
        );

        await axios.post("/api/messages/mark-messages-as-read", {
          from: data._id,
          to: contact._id
        });
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
      // Optional: revert the state update in case of an error
    }
  };

  return (
    <>
      {currentUserImage && currentUserName && (
        <Container>
          <div className="brand">
            <img src={Logo} alt="logo" />
            <h3>chitChat</h3>
          </div>
          <div className="contacts">
            {contactsData.map((contactData, index) => (
              <div
                key={contactData.contact._id}
                className={`contact ${index === currentSelected ? "selected" : ""}`}
                onClick={() => changeCurrentChat(index, contactData.contact)}
              >
                <div className="avatar">
                  <img src={`data:image/svg+xml;base64,${contactData.contact.avatarImage}`} alt="" />
                </div>
                <div className="details">
                  <div className="username">
                    <h3>{contactData.contact.username}</h3>
                  </div>
                  <div className="message-info">
                    {contactData.unreadCount > 0 && (
                      <span className="unread-count">{contactData.unreadCount}</span>
                    )}
                    <span className="last-message-time">
                      {new Date(contactData.lastMessageTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="current-user">
            <div className="avatar">
              <img src={`data:image/svg+xml;base64,${currentUserImage}`} alt="avatar" />
            </div>
            <div className="username">
              <h2>{currentUserName}</h2>
            </div>
          </div>
        </Container>
      )}
    </>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: 10% 75% 15%;
  overflow: hidden;
  background-color: #080420;
  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
    img {
      height: 2rem;
    }
    h3 {
      color: white;
      text-transform: uppercase;
    }
  }
  .contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
    gap: 0.8rem;
    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        width: 0.1rem;
        border-radius: 1rem;
      }
    }
    .contact {
      background-color: #ffffff34;
      min-height: 5rem;
      cursor: pointer;
      width: 90%;
      border-radius: 0.2rem;
      padding: 0.4rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      transition: 0.5s ease-in-out;
      .avatar {
        img {
          height: 3rem;
        }
      }
      .details {
        display: flex;
        flex-direction: column;
        .username {
          h3 {
            color: white;
          }
        }
        .message-info {
          display: flex;
          justify-content: space-between;
          .unread-count {
            color: red;
            font-weight: bold;
          }
          .last-message-time {
            color: gray;
            font-size: 0.8rem;
          }
        }
      }
    }
    .selected {
      background-color: #9a86f3;
    }
  }
  .current-user {
    background-color: #0d0d30;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    .avatar {
      img {
        height: 4rem;
        max-inline-size: 100%;
      }
    }
    .username {
      h2 {
        color: white;
      }
    }
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      gap: 0.5rem;
      .username {
        h2 {
          font-size: 1rem;
        }
      }
    }
  }
`;

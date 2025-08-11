import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";

// Connect to your backend WebSocket
const socket = io("http://localhost:4000");

const ChatRoom = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false); // Toggle chat box

  useEffect(() => {
    socket.on("receive_message", (data) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() !== "") {
      socket.emit("send_message", message);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          padding: "12px 18px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "50px",
          fontSize: "16px",
          cursor: "pointer",
          zIndex: 1000,
        }}
      >
        {isOpen ? "Close Chat" : "💬 Chat"}
      </button>

      {/* Chat Box */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "70px",
            right: "20px",
            width: "320px",
            background: "rgba(0, 0, 0, 0.9)",
            color: "white",
            padding: "15px",
            borderRadius: "10px",
            boxShadow: "0px 4px 10px rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
        >
          <h3>Live Chat</h3>
          <div
            style={{
              height: "180px",
              overflowY: "auto",
              border: "1px solid gray",
              padding: "5px",
              background: "white",
              color: "black",
              marginBottom: "8px",
            }}
          >
            {messages.map((msg, index) => (
              <p key={index}>{msg}</p>
            ))}
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            style={{
              width: "75%",
              marginRight: "5px",
              padding: "5px",
            }}
          />
          <button
            onClick={sendMessage}
            style={{
              padding: "5px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </div>
      )}
    </>
  );
};

export default ChatRoom;

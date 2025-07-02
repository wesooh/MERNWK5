import React, { useState, useEffect } from 'react';
import socket from './socket';

// Prompt only ONCE, outside the component
const username = prompt("Enter your username");

function App() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [room, setRoom] = useState('general');

  const audio = new Audio('/notify.mp3');

  useEffect(() => {
    // Register user and room
    socket.emit('registerUser', username);

    socket.on('chatMessage', (data) => {
      setMessages((prev) => [...prev, data]);

      if (data.user !== username) {
        audio.play().catch(() => {});

        // Show browser notification if tab is not focused
        if (document.visibilityState !== 'visible' && Notification.permission === 'granted') {
          new Notification(`${data.user} says:`, {
            body: data.message,
            icon: '/vite.svg', // You can replace with any icon in /public
          });
        }
      }
    });

    socket.on('typing', (user) => {
      setTyping(user);
      setTimeout(() => setTyping(null), 2000);
    });

    socket.on('onlineUsers', (users) => {
      setOnlineUsers(users);
    });

    // Ask for browser notification permission
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('chatMessage');
      socket.off('typing');
      socket.off('onlineUsers');
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() === '') return;

    socket.emit('chatMessage', {
      user: username,
      message,
      time: new Date().toLocaleTimeString(),
    });

    setMessage('');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h2>Global Chat</h2>

      <div style={{ marginBottom: 10 }}>
        <strong>Online Users:</strong> {onlineUsers.join(', ') || 'None'}
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>
          <strong>Current Room:</strong>
          <select
            value={room}
            onChange={(e) => {
              const newRoom = e.target.value;
              setRoom(newRoom);
              socket.emit('joinRoom', newRoom);
              setMessages([]); // clear local messages
            }}
            style={{ marginLeft: '10px' }}
          >
            <option value="general">general</option>
            <option value="tech">tech</option>
            <option value="random">random</option>
          </select>
        </label>
      </div>

      <div style={{ border: '1px solid #ccc', padding: 10, height: 300, overflowY: 'auto', marginBottom: 10 }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.user}</strong> <em style={{ fontSize: '0.75rem' }}>{msg.time}</em>: {msg.message}
          </div>
        ))}
        {typing && <p style={{ fontStyle: 'italic', color: '#888' }}>{typing} is typing...</p>}
      </div>

      <input
        type="text"
        placeholder="Type your message"
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          socket.emit('typing', username);
        }}
        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        style={{ width: '75%', padding: '8px' }}
      />
      <button onClick={sendMessage} style={{ padding: '8px 16px', marginLeft: '8px' }}>
        Send
      </button>
    </div>
  );
}

export default App;

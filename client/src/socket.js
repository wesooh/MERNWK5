import { io } from 'socket.io-client';

// Adjust this URL if your backend is hosted elsewhere
const socket = io('http://localhost:5000');

export default socket;

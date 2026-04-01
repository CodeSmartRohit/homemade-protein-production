import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || undefined;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  path: '/socket.io',
});

export const connectSocket = () => {
  if (!socket.connected) {
    const token = Cookies.get('accessToken');
    if (token) {
      socket.auth = { token };
    }
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

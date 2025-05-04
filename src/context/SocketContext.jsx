import { createContext, useContext, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef();

  useEffect(() => {
    if (user && !socketRef.current) {
      socketRef.current = io("http://localhost:5000", {
        query: { userId: user._id },
        reconnection: true, // Enable reconnection
        reconnectionAttempts: 5, // Retry 5 times
        reconnectionDelay: 1000, // Delay for reconnection
      });

      socketRef.current.on("connect", () => {
        console.log("Socket connected: ", socketRef.current.id);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

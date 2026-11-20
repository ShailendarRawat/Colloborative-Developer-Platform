import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

interface DashboardProps {
  onJoinRoom: (roomId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onJoinRoom }) => {
  const { user } = useAuth();
  const [roomInput, setRoomInput] = useState('');

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8) + '-' + Math.random().toString(36).substring(2, 8);
    onJoinRoom(newRoomId);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomInput.trim()) {
      onJoinRoom(roomInput.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-gray-900 text-white p-4">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <span className="text-gray-400">Logged in as {user?.email}</span>
        <button 
          onClick={() => signOut(auth)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-semibold transition"
        >
          Sign Out
        </button>
      </div>

      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-8">Collab Platform</h1>
        
        <button 
          onClick={handleCreateRoom}
          className="w-full p-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg transition mb-8 shadow-lg"
        >
          + Create New Room
        </button>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-gray-600"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400">OR</span>
          <div className="flex-grow border-t border-gray-600"></div>
        </div>

        <form onSubmit={handleJoinRoom} className="flex gap-2 mt-4">
          <input 
            type="text" 
            placeholder="Enter Room ID..." 
            value={roomInput}
            onChange={e => setRoomInput(e.target.value)}
            className="flex-1 p-3 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="p-3 bg-gray-600 hover:bg-gray-500 rounded font-semibold transition">
            Join
          </button>
        </form>
      </div>
    </div>
  );
};

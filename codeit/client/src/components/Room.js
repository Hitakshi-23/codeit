import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

function Room({ setRoomId, setUsername }) {
  const [roomInput, setRoomInput] = useState('');
  const [userInput, setUserInput] = useState('');

  const createRoom = () => {
    const newRoomId = uuidv4();
    setRoomId(newRoomId);
    setUsername(userInput || 'Anonymous');
  };

  const joinRoom = () => {
    if (roomInput) {
      setRoomId(roomInput);
      setUsername(userInput || 'Anonymous');
    }
  };

  return (
    <div className="room-container">
      <input
        type="text"
        placeholder="Username"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
      />
      <br />
      <input
        type="text"
        placeholder="Room ID (leave empty to create)"
        value={roomInput}
        onChange={(e) => setRoomInput(e.target.value)}
      />
      <br />
      <button onClick={createRoom}>Create Room</button>
      <button onClick={joinRoom}>Join Room</button>
    </div>
  );
}

export default Room;
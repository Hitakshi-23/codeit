import { useState } from 'react';
import Room from './components/Room';
import EditorComponent from './components/Editor';
import './App.css';

function App() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');

  return (
    <div className="App">
      <h1>Code It</h1>
      {!roomId ? (
        <Room setRoomId={setRoomId} setUsername={setUsername} />
      ) : (
        <EditorComponent roomId={roomId} username={username} />
      )}
    </div>
  );
}

export default App;
import { useEffect, useState } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism.css';
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_API_URL);

function EditorComponent({ roomId, username, onLogout }) {
  const getDefaultCode = (lang) => {
    switch (lang) {
      case 'c':
        return '#include <stdio.h>\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}\n';
      case 'cpp':
        return '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello from C++!\\n";\n    return 0;\n}\n';
      case 'python':
        return '# Start coding here...\nprint("Hello from Python!")\n';
      default:
        return '#include <stdio.h>\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}\n';
    }
  };

  const [language, setLanguage] = useState('c');
  const [code, setCode] = useState(getDefaultCode('c'));
  const [notifications, setNotifications] = useState([]);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [cursors, setCursors] = useState({});

  useEffect(() => {
    socket.emit('joinRoom', { roomId, username });

    // Request the current state (language and code) when joining
    socket.emit('requestState', { roomId });

    // Sync language and code when a user joins
    socket.on('syncState', ({ lang, code }) => {
      setLanguage(lang);
      setCode(code);
    });

    socket.on('codeChange', ({ code }) => {
      setCode(code);
    });

    socket.on('languageChange', ({ lang }) => {
      setLanguage(lang);
      setCode(getDefaultCode(lang));
    });

    socket.on('userJoined', (user) => {
      setNotifications((prev) => [...prev, `${user} joined the room`]);
      // Send the current state to the new user
      socket.emit('syncState', { roomId, lang: language, code });
      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 3000);
    });

    socket.on('userLeft', (user) => {
      setNotifications((prev) => [...prev, `${user} left the room`]);
      setCursors((prev) => {
        const newCursors = { ...prev };
        delete newCursors[user];
        return newCursors;
      });
      setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
      }, 3000);
    });

    socket.on('codeOutput', ({ output }) => {
      setConsoleOutput(output);
    });

    socket.on('cursorUpdate', ({ user, position }) => {
      setCursors((prev) => ({
        ...prev,
        [user]: position,
      }));
    });

    return () => {
      socket.emit('leaveRoom', { roomId, username });
      socket.off('codeChange');
      socket.off('languageChange');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('codeOutput');
      socket.off('cursorUpdate');
      socket.off('syncState');
    };
  }, [roomId, username]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit('codeChange', { roomId, code: newCode });
  };

  const handleRunCode = () => {
    socket.emit('runCode', { roomId, code, language });
  };

  const handleLogout = () => {
    socket.emit('leaveRoom', { roomId, username });
    onLogout();
  };

  const handleCursorChange = (e) => {
    const textarea = e.target;
    const position = {
      line: textarea.value.substr(0, textarea.selectionStart).split('\n').length,
      column: textarea.selectionStart - textarea.value.lastIndexOf('\n', textarea.selectionStart - 1),
    };
    socket.emit('cursorUpdate', { roomId, user: username, position });
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(getDefaultCode(newLang));
    socket.emit('languageChange', { roomId, lang: newLang });
  };

  const getHighlightLanguage = () => {
    switch (language) {
      case 'c':
        return Prism.languages.c;
      case 'cpp':
        return Prism.languages.cpp;
      case 'python':
        return Prism.languages.python;
      default:
        return Prism.languages.c;
    }
  };

  return (
    <div className="editor-container">
      <div style={{ marginBottom: '10px', color: '#ecf0f1', fontSize: '1.2em' }}>
        Workspace of {username}
      </div>
      <select
        className="language-selector"
        value={language}
        onChange={handleLanguageChange}
      >
        <option value="c">C</option>
        <option value="cpp">C++</option>
        <option value="python">Python</option>
      </select>
      <div style={{ position: 'relative' }}>
        <Editor
          value={code}
          onValueChange={handleCodeChange}
          highlight={(code) => Prism.highlight(code, getHighlightLanguage(), language)}
          padding={10}
          className="code-editor"
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
        />
        {Object.entries(cursors).map(([user, position]) => (
          user !== username && (
            <div
              key={user}
              style={{
                position: 'absolute',
                top: `${position.line * 20 - 20}px`,
                left: `${position.column * 8}px`,
                height: '20px',
                width: '2px',
                backgroundColor: '#e74c3c',
                opacity: 0.8,
                zIndex: 10,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '0',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  padding: '2px 5px',
                  borderRadius: '3px',
                  fontSize: '12px',
                }}
              >
                {user}
              </span>
            </div>
          )
        ))}
      </div>
      <button onClick={handleRunCode}>Run Code</button>
      <button onClick={handleLogout} style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)' }}>
        Log Out
      </button>
      <div className="console-container">
        <h3>Console Output</h3>
        <pre>{consoleOutput || 'Run your code to see the output here...'}</pre>
      </div>
      {notifications.map((note, index) => (
        <div key={index} className="notification">
          {note}
        </div>
      ))}
    </div>
  );
}

export default EditorComponent;
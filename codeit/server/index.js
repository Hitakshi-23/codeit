const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3001',
    methods: ['GET', 'POST'],
  },
});

// Store the current state of each room (language and code)
const rooms = {};

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('joinRoom', ({ roomId, username }) => {
    socket.join(roomId);
    socket.to(roomId).emit('userJoined', username);

    // Initialize room state if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = { language: 'c', code: '#include <stdio.h>\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}\n' };
    }
  });

  socket.on('requestState', ({ roomId }) => {
    if (rooms[roomId]) {
      socket.emit('syncState', { lang: rooms[roomId].language, code: rooms[roomId].code });
    }
  });

  socket.on('syncState', ({ roomId, lang, code }) => {
    rooms[roomId] = { language: lang, code };
    socket.to(roomId).emit('syncState', { lang, code });
  });

  socket.on('codeChange', ({ roomId, code }) => {
    rooms[roomId].code = code;
    socket.to(roomId).emit('codeChange', { code });
  });

  socket.on('languageChange', ({ roomId, lang }) => {
    rooms[roomId].language = lang;
    socket.to(roomId).emit('languageChange', { lang });
  });

  socket.on('runCode', async ({ roomId, code, language }) => {
    try {
      const tempDir = path.join(__dirname, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }

      const fileName = `code-${Date.now()}`;
      let filePath, execCommand;

      switch (language) {
        case 'c':
          filePath = path.join(tempDir, `${fileName}.c`);
          fs.writeFileSync(filePath, code);
          execCommand = `gcc "${filePath}" -o "${path.join(tempDir, fileName)}" && "${path.join(tempDir, fileName)}"`;
          break;
        case 'cpp':
          filePath = path.join(tempDir, `${fileName}.cpp`);
          fs.writeFileSync(filePath, code);
          execCommand = `g++ "${filePath}" -o "${path.join(tempDir, fileName)}" && "${path.join(tempDir, fileName)}"`;
          break;
        case 'python':
          filePath = path.join(tempDir, `${fileName}.py`);
          fs.writeFileSync(filePath, code);
          execCommand = `python "${filePath}"`;
          break;
        default:
          throw new Error('Unsupported language');
      }

      exec(execCommand, (error, stdout, stderr) => {
        let output;
        if (error || stderr) {
          const errorMessage = stderr || error.message;
          const lines = code.split('\n');
          const errorLineMatch = errorMessage.match(/line (\d+)/);
          const lineNumber = errorLineMatch ? parseInt(errorLineMatch[1]) : null;
          const errorDetails = errorMessage.split('\n').filter(line => line.includes('error') || line.includes('SyntaxError')).join('\n');

          output = 'Compilation Error:\n';
          if (lineNumber && lines[lineNumber - 1]) {
            output += `Error at Line ${lineNumber}: ${errorDetails}\n`;
            output += `Code: ${lines[lineNumber - 1].trim()}\n`;
          } else {
            output += errorMessage;
          }
        } else {
          output = stdout || 'No output';
        }

        socket.to(roomId).emit('codeOutput', { output });
        socket.emit('codeOutput', { output });

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        const exePath = path.join(tempDir, fileName);
        if (fs.existsSync(exePath)) {
          fs.unlinkSync(exePath);
        }
        const exePathExt = `${exePath}.exe`;
        if (fs.existsSync(exePathExt)) {
          fs.unlinkSync(exePathExt);
        }
      });
    } catch (error) {
      const output = `Error: ${error.message}`;
      socket.to(roomId).emit('codeOutput', { output });
      socket.emit('codeOutput', { output });
    }
  });

  socket.on('cursorUpdate', ({ roomId, user, position }) => {
    socket.to(roomId).emit('cursorUpdate', { user, position });
  });

  socket.on('leaveRoom', ({ roomId, username }) => {
    socket.leave(roomId);
    socket.to(roomId).emit('userLeft', username);
    // Clean up room state if no users are left
    const room = io.sockets.adapter.rooms.get(roomId);
    if (!room || room.size === 0) {
      delete rooms[roomId];
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
Code-It: My Command Reference
This is a quick reference for running Code-It on my Windows system (C:\Projects\Code-It).
Start the App
1. Run the Backend

Open Command Prompt.
Navigate to the server folder:cd C:\Projects\Code-It\server


Start the backend:npm run dev


Should run on http://localhost:3000.

2. Run the Frontend

Open another Command Prompt.
Navigate to the client folder:cd C:\Projects\Code-It\client


Start the frontend:npm start


Should run on http://localhost:3001 and open in the browser.

Use the App

Open http://localhost:3001 in Chrome.
Join or create a room, select a language (C, C++, or Python), and code.

Troubleshooting Commands
If Dependencies Are Missing

Backend:cd C:\Projects\Code-It\server
rmdir /S /Q node_modules
del package-lock.json
npm install


Frontend:cd C:\Projects\Code-It\client
rmdir /S /Q node_modules
del package-lock.json
npm install



If Port 3000 Is in Use

Change the PORT in server/index.js (e.g., to 4000).
Update client/.env:REACT_APP_API_URL=http://localhost:4000


Restart both servers.

Clean Up Temporary Files

Delete the temp folder in server:cd C:\Projects\Code-It\server
rmdir /S /Q temp



Notes

Ensure MinGW (GCC) and Python are in PATH (gcc --version, g++ --version, python --version to check).
Use two browser windows (e.g., Chrome and incognito) to test collaboration.

Happy coding! 😊

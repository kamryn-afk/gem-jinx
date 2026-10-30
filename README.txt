GEM JINX – MULTIPLAYER WEB GAME

To host on Render:
1. Upload these extracted files to the root of a new GitHub repository.
2. Render.com > New > Web Service > connect your GitHub repository.
3. Runtime: Node; build command: npm install; start command: npm start.
4. Choose a plan, deploy, then share your Render URL with friends.
5. Players open the SAME URL on their phones/computers, create a room and join with the code.

Do not upload the ZIP to GitHub directly. Extract it first.
This is a Node.js Socket.IO game, so it cannot run as a standalone static HTML file.
Rooms are stored in server memory and are lost when the service restarts.

# QuickChat App

QuickChat App is a full-stack real-time chat application built with the MERN stack, Socket.IO, and WebRTC. It supports secure authentication, private messaging, media sharing, voice notes, online presence, profile management, and one-to-one video calling.

## Overview

QuickChat App lets users create an account, log in, update their profile, find other users, exchange private messages, share images and voice notes, see who is online, and start live video calls directly inside the browser.

The frontend is a React app built with Vite, while the backend is an Express API connected to MongoDB and Cloudinary. Real-time messaging, online presence, and WebRTC call signaling are handled through Socket.IO.

## Features

- JWT authentication
- User registration and login
- Profile editing
- Avatar upload
- Online and offline presence
- Real-time private messaging
- Message seen status
- Image sharing
- Voice messages
- Shared image gallery
- WebRTC video calling
- Screen sharing
- Camera toggle
- Microphone toggle
- Fullscreen mode
- Accept and reject calls
- Socket.IO real-time communication

## Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Tailwind CSS 4
- Axios
- Socket.IO Client
- React Hot Toast
- Lucide React

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Socket.IO
- Cloudinary
- CORS

### Real-Time Communication

- WebRTC
- STUN servers

Note: the app uses public STUN servers for WebRTC signaling support. A TURN server is not implemented.

## Architecture

- Frontend: React handles authentication screens, chat UI, profile pages, media previews, and the call interface.
- Backend: Express exposes auth and message APIs, connects to MongoDB, uploads media to Cloudinary, and serves as the Socket.IO server.
- Database: MongoDB stores users and messages through Mongoose models.
- Socket Server: Socket.IO tracks online users, delivers new messages in real time, and relays WebRTC signaling events.
- Media Storage: Cloudinary stores uploaded profile pictures, message images, and voice message files.
- Authentication Flow: users sign up or log in, receive a JWT token, store it in `localStorage`, and send it back in the `token` request header for protected routes.

## Folder Structure

```text
QuickChat-App/
  Client/
    public/
    src/
      assets/
        chat-app-assets/
      components/
      Context/
      lib/
      pages/
      App.jsx
      main.jsx
      index.css
    package.json
    vite.config.js
    vercel.json
  server/
    controller/
    lib/
    middleware/
    models/
    routes/
    server.js
    package.json
    vercel.json
  README.md
  .gitignore
```

## Installation

Clone the repository and install dependencies for both apps:

```bash
git clone <repository-url>
cd QuickChat-App

cd server
npm install

cd ../Client
npm install
```

## Environment Variables

### Server

Create a `.env` file inside the `server` folder:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

- `MONGODB_URI` connects the backend to MongoDB.
- `JWT_SECRET` signs and verifies authentication tokens.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` configure media uploads.
- `PORT` sets the backend port.
- `CLIENT_URL` and `FRONTEND_URL` are used for CORS allowlisting.

### Client

Create a `.env` file inside the `Client` folder:

```env
VITE_BACKEND_URL=http://localhost:5000
```

- `VITE_BACKEND_URL` points the frontend to the backend API.

## Running the Project

### Backend

```bash
cd server
npm run server
```

### Frontend

```bash
cd Client
npm run dev
```

Open the frontend URL shown by Vite, usually:

```text
http://localhost:5173
```

## Available Scripts

### Server

- `npm start` - start the backend with Node.js
- `npm run server` - start the backend with Nodemon
- `npm test` - placeholder script

### Client

- `npm run dev` - start the Vite development server
- `npm run build` - build the frontend for production
- `npm run preview` - preview the production build
- `npm run lint` - run ESLint

## API Documentation

### Auth Endpoints

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| POST | `/api/auth/signup` | Register a new user | No |
| POST | `/api/auth/login` | Log in an existing user | No |
| PUT | `/api/auth/update-profile` | Update profile details and avatar | Yes |
| GET | `/api/auth/check` | Verify the current authenticated user | Yes |

### Message Endpoints

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| GET | `/api/messages/users` | Get users for the sidebar and unseen counts | Yes |
| GET | `/api/messages/:id` | Get the conversation with a specific user | Yes |
| PUT | `/api/messages/mark/:id` | Mark a message as seen | Yes |
| POST | `/api/messages/send/:id` | Send a text, image, or voice message | Yes |

### Utility Endpoints

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| GET | `/api/status` | Health check endpoint | No |

## Authentication Flow

1. The user signs up or logs in through the frontend.
2. The backend creates or validates the user and generates a JWT token with `jsonwebtoken`.
3. The token is stored in `localStorage`.
4. The frontend sends the token in the custom `token` header for protected API requests.
5. `protectRoute` verifies the token, loads the user from MongoDB, and attaches the user to `req.user`.
6. `checkAuth` returns the authenticated user to restore the session on refresh.
7. Logout clears local storage, resets the auth state, and disconnects the Socket.IO client.

## Messaging Flow

1. The user selects another user from the sidebar.
2. The client requests `/api/messages/:id` to load the conversation.
3. The backend fetches message history from MongoDB and marks incoming messages as seen.
4. When the user sends a message, the client can attach text, an image, or a voice note.
5. The backend validates the payload, uploads media to Cloudinary when needed, saves the message in MongoDB, and emits `newMessage` to both users in real time.
6. The sidebar updates unseen message counts through Socket.IO events.

## Video Calling Flow

1. A user starts a call from the chat header.
2. The caller gets a local camera and microphone stream with `getUserMedia`.
3. The caller creates a WebRTC offer and sends it through Socket.IO as `call:offer`.
4. The receiver gets the incoming call and can accept or reject it.
5. If accepted, the receiver creates an answer and sends it back as `call:answer`.
6. Both sides exchange ICE candidates through `call:ice-candidate`.
7. The peer connection shows the remote video stream once connected.
8. Either user can end the call with `call:end`.
9. During the call, the UI supports screen sharing, camera toggle, microphone toggle, and fullscreen mode.

## Socket.IO Events

### Client to Server

| Event | Purpose |
|---|---|
| `call:offer` | Send a WebRTC offer to the other user |
| `call:answer` | Send a WebRTC answer to the other user |
| `call:ice-candidate` | Send ICE candidates during call setup |
| `call:reject` | Reject an incoming call |
| `call:end` | End an active call |

### Server to Client

| Event | Purpose |
|---|---|
| `getOnlineUsers` | Broadcast the list of currently connected users |
| `newMessage` | Deliver a newly created chat message |
| `call:offer` | Deliver an incoming call offer |
| `call:answer` | Deliver the WebRTC answer |
| `call:ice-candidate` | Deliver ICE candidates |
| `call:reject` | Notify the caller that the call was declined |
| `call:end` | Notify the other side that the call ended |

## Media Upload

- Cloudinary is used for all uploaded media.
- Profile avatars are uploaded from the profile page.
- Image messages are sent as base64 data from the client, uploaded on the server, and stored as Cloudinary URLs.
- Voice messages are recorded in the browser with `MediaRecorder`, converted to a file, and uploaded to Cloudinary from the backend.

## Security Features

- JWT-based authentication
- Password hashing with `bcryptjs`
- Protected routes through authentication middleware
- CORS origin allowlisting
- Environment variable usage for secrets and configuration
- Message length validation
- Duplicate-message protection inside the send-message flow

## Deployment

The repository includes `vercel.json` files for both apps, so the project can be deployed in a split frontend and backend setup.

- Frontend: deploy the `Client` folder as a Vite app.
- Backend: deploy the `server` folder as a Node.js serverless app.
- Update `VITE_BACKEND_URL`, `CLIENT_URL`, and `FRONTEND_URL` to match the deployed domains.
- Keep MongoDB and Cloudinary credentials in the deployment environment variables.

## Known Issues

- `signup` and `login` currently return the full user document, which includes the hashed password field. The password should be excluded before sending the response.
- The auth provider calls `/api/auth/check` on mount even when no token exists, which can trigger an unnecessary error toast for logged-out users.
- WebRTC uses public STUN servers only. A TURN server is not configured, so calls may fail in restrictive network environments.
- The project does not currently include an automated test suite.

## Future Improvements

- Group chats
- Typing indicators
- Read receipts
- Push notifications
- Message search
- End-to-end encryption
- File sharing
- Voice and video group calls
- Dark mode
- Automated tests
- TURN server support for WebRTC reliability

## Screenshots

No screenshots folder is present in the repository yet. Add images here when available.

```md
![Login](screenshots/login.png)
![Chat](screenshots/chat.png)
![Profile](screenshots/profile.png)
```

## Contributing

Contributions are welcome.

1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Make your changes.
4. Test the project locally.
5. Open a pull request with a clear description of the update.

## License

This project currently does not specify a license.

## Author

**Priyanshu Das**

GitHub: https://github.com/priyanshudas006

LinkedIn: Not provided

## Conclusion

QuickChat App demonstrates a strong full-stack real-time application workflow using React, Node.js, Express, MongoDB, Socket.IO, Cloudinary, JWT, and WebRTC. It combines authentication, messaging, media handling, and live calling into a single project that is suitable for portfolio review, recruiter evaluation, and further open-source development.


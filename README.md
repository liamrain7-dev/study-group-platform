# Study Group Platform

A live server platform for university students to create and join study groups. Students can login, select their university, browse classes, and create or join study groups in real-time.

## Features

- 🔐 User authentication (login/register)
- 🏫 University-based organization
- 📚 Class management (view and create classes)
- 👥 Study group creation and joining
- ⚡ Real-time updates using WebSockets
- 🎨 Modern, responsive UI

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Socket.io for real-time features

### Frontend
- React
- React Router for navigation
- Axios for API calls
- Socket.io-client for real-time updates

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

   Or install separately:
   ```bash
   # Root dependencies
   npm install
   
   # Server dependencies
   cd server
   npm install
   
   # Client dependencies
   cd ../client
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the `server` directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/study-groups
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

   For MongoDB Atlas, use:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-groups
   ```

4. **Start MongoDB:**
   
   If using local MongoDB:
   ```bash
   mongod
   ```
   
   Or use MongoDB Atlas (cloud) - no local setup needed.

5. **Seed universities:**
   
   Before running the app, you need to populate the database with universities:
   ```bash
   cd server
   npm run seed
   ```
   
   This will read from `server/data/universities.json` and add 80+ universities to your database. Users can only register with universities from this list. You can edit the JSON file to add or remove universities.

## Running the Application

### Development Mode (Both Server and Client)

From the root directory:
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

### Run Separately

**Backend only:**
```bash
cd server
npm run dev
```

**Frontend only:**
```bash
cd client
npm start
```

## Usage

1. **Register a new account:**
   - Go to `http://localhost:3000/register`
   - Enter your name, email, password, and university name
   - Click "Register"

2. **Login:**
   - Go to `http://localhost:3000/login`
   - Enter your email and password
   - Click "Login"

3. **View your university page:**
   - After login, you'll be redirected to your university page
   - See all available classes for your university

4. **Create a class:**
   - Click "+ Create Class" button
   - Enter class name, code, and optional description
   - Click "Create Class"

5. **View a class:**
   - Click on any class card to view its study groups

6. **Create a study group:**
   - On the class page, click "+ Create Study Group"
   - Enter group name, description, and max members
   - Click "Create Study Group"

7. **Join a study group:**
   - Click "Join Group" on any available study group
   - You'll see yourself added to the members list

## Project Structure

```
study-group-platform/
├── server/
│   ├── models/          # MongoDB models (User, University, Class, StudyGroup)
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   └── index.js         # Server entry point
├── client/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # React contexts (Auth, Socket)
│   │   ├── services/    # API service
│   │   └── App.js       # Main App component
│   └── public/
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Universities
- `GET /api/universities` - Get all universities
- `GET /api/universities/:id` - Get university with classes (protected)

### Classes
- `GET /api/classes/university/:universityId` - Get classes for university (protected)
- `GET /api/classes/:id` - Get single class (protected)
- `POST /api/classes` - Create new class (protected)

### Study Groups
- `GET /api/study-groups/class/:classId` - Get study groups for class (protected)
- `POST /api/study-groups` - Create study group (protected)
- `POST /api/study-groups/:id/join` - Join study group (protected)

## Real-time Features

The application uses Socket.io for real-time updates:
- New classes appear instantly for all users in the same university
- New study groups appear instantly for all users viewing the same class
- Study group member updates are broadcast in real-time

## Future Enhancements

- Chat functionality within study groups
- Study session scheduling
- File sharing
- Notifications
- Search functionality
- User profiles
- Study group messaging

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!


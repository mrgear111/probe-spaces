/**
 * Probe Spaces - WebSocket Signaling Server
 * Handles real-time communication between collaborative browsing sessions
 */

const express = require('express');
const portfinder = require('portfinder');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Store active spaces
const spaces = new Map();

/**
 * Space data structure:
 * {
 *   id: string,
 *   host: { socketId, userId, name, color },
 *   participants: Map<socketId, { userId, name, color, isHost }>,
 *   state: {
 *     currentUrl: string,
 *     scrollPosition: { x: number, y: number },
 *     cursors: Map<userId, { x: number, y: number }>,
 *     selections: Map<userId, { start, end, text }>
 *   },
 *   createdAt: Date
 * }
 */

// Generate random space ID
function generateSpaceId() {
  return Math.random().toString(36).substring(2, 10);
}

// Generate random user ID
function generateUserId() {
  return Math.random().toString(36).substring(2, 15);
}

// Generate random color
function generateColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#FF8C94', '#74B9FF', '#A29BFE', '#FD79A8'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);
  
  // Create a new space
  socket.on('create-space', ({ userName = 'Host' }, callback) => {
    const spaceId = generateSpaceId();
    const userId = generateUserId();
    const color = generateColor();
    
    const space = {
      id: spaceId,
      host: { socketId: socket.id, userId, name: userName, color },
      participants: new Map([[socket.id, { userId, name: userName, color, isHost: true }]]),
      state: {
        currentUrl: '',
        scrollPosition: { x: 0, y: 0 },
        cursors: new Map(),
        selections: new Map()
      },
      createdAt: new Date()
    };
    
    spaces.set(spaceId, space);
    socket.join(spaceId);
    socket.spaceId = spaceId;
    socket.userId = userId;
    
    console.log(`✨ Created space ${spaceId} by ${userName}`);
    
    callback({
      success: true,
      spaceId,
      userId,
      inviteLink: `probe://space/${spaceId}`,
      participants: Array.from(space.participants.values())
    });
  });
  
  // Join an existing space
  socket.on('join-space', ({ spaceId, userName = 'Guest' }, callback) => {
    const space = spaces.get(spaceId);
    
    if (!space) {
      callback({ success: false, error: 'Space not found' });
      return;
    }
    
    const userId = generateUserId();
    const color = generateColor();
    
    const participant = {
      userId,
      name: userName,
      color,
      isHost: false
    };
    
    space.participants.set(socket.id, participant);
    socket.join(spaceId);
    socket.spaceId = spaceId;
    socket.userId = userId;
    
    console.log(`👥 ${userName} joined space ${spaceId}`);
    
    // Notify all other participants
    socket.to(spaceId).emit('user-joined', { user: participant });
    
    callback({
      success: true,
      userId,
      spaceId,
      participants: Array.from(space.participants.values()),
      state: space.state
    });
  });
  
  // Leave space
  socket.on('leave-space', () => {
    handleDisconnect(socket);
  });
  
  // Sync URL change
  socket.on('sync-url', ({ url }) => {
    const spaceId = socket.spaceId;
    if (!spaceId) return;
    
    const space = spaces.get(spaceId);
    if (!space) return;
    
    space.state.currentUrl = url;
    
    // Broadcast to all except sender
    socket.to(spaceId).emit('url-changed', {
      url,
      userId: socket.userId,
      userName: space.participants.get(socket.id)?.name
    });
    
    console.log(`🔗 URL changed in space ${spaceId}: ${url}`);
  });
  
  // Sync scroll position
  socket.on('sync-scroll', ({ x, y }) => {
    const spaceId = socket.spaceId;
    if (!spaceId) return;
    
    const space = spaces.get(spaceId);
    if (!space) return;
    
    space.state.scrollPosition = { x, y };
    
    // Broadcast to all except sender
    socket.to(spaceId).emit('scroll-changed', {
      x,
      y,
      userId: socket.userId
    });
  });
  
  // Sync cursor position
  socket.on('sync-cursor', ({ x, y }) => {
    const spaceId = socket.spaceId;
    if (!spaceId) return;
    
    const space = spaces.get(spaceId);
    if (!space) return;
    
    space.state.cursors.set(socket.userId, { x, y });
    
    const participant = space.participants.get(socket.id);
    
    // Broadcast to all except sender
    socket.to(spaceId).emit('cursor-moved', {
      userId: socket.userId,
      userName: participant?.name,
      color: participant?.color,
      x,
      y
    });
  });
  
  // Sync text selection
  socket.on('sync-selection', ({ text, range }) => {
    const spaceId = socket.spaceId;
    if (!spaceId) return;
    
    const space = spaces.get(spaceId);
    if (!space) return;
    
    space.state.selections.set(socket.userId, { text, range });
    
    const participant = space.participants.get(socket.id);
    
    // Broadcast to all except sender
    socket.to(spaceId).emit('selection-changed', {
      userId: socket.userId,
      userName: participant?.name,
      color: participant?.color,
      text,
      range
    });
  });
  
  // Click event
  socket.on('sync-click', ({ x, y, element }) => {
    const spaceId = socket.spaceId;
    if (!spaceId) return;
    
    const space = spaces.get(spaceId);
    if (!space) return;
    
    const participant = space.participants.get(socket.id);
    
    // Broadcast to all except sender
    socket.to(spaceId).emit('click-occurred', {
      userId: socket.userId,
      userName: participant?.name,
      color: participant?.color,
      x,
      y,
      element
    });
  });
  
  // Get space info
  socket.on('get-space-info', ({ spaceId }, callback) => {
    const space = spaces.get(spaceId);
    
    if (!space) {
      callback({ success: false, error: 'Space not found' });
      return;
    }
    
    callback({
      success: true,
      space: {
        id: space.id,
        participants: Array.from(space.participants.values()),
        state: space.state,
        createdAt: space.createdAt
      }
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    handleDisconnect(socket);
  });
});

function handleDisconnect(socket) {
  const spaceId = socket.spaceId;
  if (!spaceId) return;
  
  const space = spaces.get(spaceId);
  if (!space) return;
  
  const participant = space.participants.get(socket.id);
  if (!participant) return;
  
  space.participants.delete(socket.id);
  space.state.cursors.delete(socket.userId);
  space.state.selections.delete(socket.userId);
  
  // Notify others
  socket.to(spaceId).emit('user-left', {
    userId: socket.userId,
    userName: participant.name
  });
  
  console.log(`👋 ${participant.name} left space ${spaceId}`);
  
  // If host left or no participants, close space
  if (participant.isHost || space.participants.size === 0) {
    socket.to(spaceId).emit('space-closed', {
      reason: participant.isHost ? 'Host left the space' : 'Last participant left'
    });
    spaces.delete(spaceId);
    console.log(`🚪 Closed space ${spaceId}`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeSpaces: spaces.size,
    timestamp: new Date().toISOString()
  });
});

// Get active spaces
app.get('/spaces', (req, res) => {
  const activeSpaces = Array.from(spaces.entries()).map(([id, space]) => ({
    id,
    participantCount: space.participants.size,
    host: space.host.name,
    createdAt: space.createdAt
  }));
  
  res.json({ spaces: activeSpaces });
});


const PORT = process.env.PORT || 3030;

server.listen(PORT, () => {
  console.log(`🚀 Probe Spaces Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

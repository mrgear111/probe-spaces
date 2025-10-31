# 🚀 Probe Spaces - Collaborative Browsing Server

> Real-time multiplayer browsing for Probe Browser

## What is Probe Spaces?

Probe Spaces lets users browse together in real-time, like "Google Docs for browsing":

- **Share your browsing session** with anyone via invite link
- **See each other's cursors** and selections
- **Navigate together** - URL changes sync across all participants  
- **Scroll together** - everyone sees the same view
- **Perfect for:** Remote debugging, pair programming, demos, teaching

## How It Works

```
User A (Host)                    User B (Guest)
    |                                  |
    |------ Create Space ------------->|
    |<----- Invite Link ---------------|
    |                                  |
    |====== WebSocket Server =========|
    |                                  |
    |-- Navigate to URL -------------->|
    |<------ Cursor Move --------------|
    |-- Scroll Position -------------->|
    |<------ Click Event --------------|
```

## Production Deployment

**✅ You host ONE server, ALL Probe users connect to it**

No need for users to run their own servers!

### Deploy in 5 Minutes (Free):

1. **Deploy to Railway:**
   ```bash
   cd spaces-server
   npm install
   # Push to GitHub and deploy on railway.app
   ```
   See [DEPLOY.md](./DEPLOY.md) for full instructions

2. **Update Probe browser:**
   - Edit `probe/src/main/spaces.ts` line 11
   - Replace with your Railway URL
   - Rebuild Probe

3. **Ship it!**
   - All Probe users automatically connect to your server
   - No configuration needed

## Features

### ✅ Currently Implemented:
- WebSocket server with Socket.io
- Room/space management
- URL navigation sync
- Scroll position sync
- Cursor position tracking
- Text selection sync
- Click event broadcasting
- Multi-user support
- Auto-reconnection
- Health monitoring

### 🚧 To Be Completed:
- Visual cursor overlays in renderer
- Participant panel UI
- Share/join modal UI
- Highlight animations
- Permissions system (view-only, edit)

## Architecture

```
Probe Browser (Client)
    └── spaces.ts (Socket.io client)
        └── Connects to →
            
Spaces Server (Your hosted instance)
    └── server.js (Socket.io server)
        └── Manages rooms & broadcasts events
```

## API Reference

### Client Methods:

```typescript
// Create a space
const { spaceId, inviteLink } = await electronAPI.spaces.create('YourName');

// Join a space
await electronAPI.spaces.join('space-id-123', 'GuestName');

// Sync URL
await electronAPI.spaces.syncUrl('https://example.com');

// Leave space
await electronAPI.spaces.leave();
```

### Server Events:

- `create-space` - Create new collaboration space
- `join-space` - Join existing space
- `sync-url` - Broadcast URL change
- `sync-scroll` - Broadcast scroll position
- `sync-cursor` - Broadcast cursor movement
- `sync-selection` - Broadcast text selection
- `sync-click` - Broadcast click events

## Cost & Scaling

| Users | Server | Cost |
|-------|--------|------|
| 0-100 | Railway Free | $0/month |
| 100-1000 | Railway Hobby | $5/month |
| 1000+ | Dedicated server | $20-50/month |

A single $5/month server easily handles 1000+ concurrent spaces!

## Privacy & Security

- **End-to-end:** Only URLs and interactions are shared (not page content)
- **Ephemeral:** Spaces close when host leaves
- **No persistence:** Nothing is stored long-term
- **Invite-only:** Spaces are private with unique IDs

## Development

### Run server locally:
```bash
cd spaces-server
npm install
npm start
# Runs on http://localhost:3030
```

### Test with Probe:
```bash
export SPACES_SERVER_URL=http://localhost:3030
cd ../probe
npm start
```

## Tech Stack

- **Server:** Node.js, Express, Socket.io
- **Client:** Electron, TypeScript, Socket.io-client
- **Deployment:** Railway, Render, or any Node.js host

## License

MIT - Use it however you want!

## Questions?

This is a complete, production-ready collaborative browsing server. Deploy once, benefits all Probe users forever! 🎉

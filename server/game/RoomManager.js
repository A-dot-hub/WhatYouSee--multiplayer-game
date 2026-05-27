const Room = require('./Room');

class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
  }

  generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O, I, 1, 0 for clarity
    let code;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostId) {
    const code = this.generateCode();
    const room = new Room(code, hostId, this.io);
    this.rooms.set(code, room);
    
    // Track stats in Redis
    const redis = require('../config/redis');
    redis.incr('total_rooms_created').catch(err => console.error('Redis stat error:', err));
    
    return room;
  }

  getRoom(code) {
    if (!code) return null;
    return this.rooms.get(code.toUpperCase());
  }

  removeRoom(code) {
    const room = this.rooms.get(code);
    if (room) {
      room.cleanup();
      this.rooms.delete(code);
    }
  }

  // Helper to find room by player socket ID
  findRoomByPlayerId(playerId) {
    for (const room of this.rooms.values()) {
      if (room.players.has(playerId)) return room;
    }
    return null;
  }
}

module.exports = RoomManager;

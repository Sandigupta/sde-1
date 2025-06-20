import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export class SocketService {
  constructor() {
    this.socket = io(SOCKET_URL);
    this.listeners = new Map();
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    // Handle connection and disconnection
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    // Handle disaster updates
    this.socket.on('disaster_updated', (disaster) => {
      this.notifyListeners('disaster_updated', disaster);
    });

    this.socket.on('resource_updated', (resource) => {
      this.notifyListeners('resource_updated', resource);
    });

    this.socket.on('report_updated', (report) => {
      this.notifyListeners('report_updated', report);
    });
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      callbacks.forEach(callback => callback(data));
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  subscribeToDisasters(filters) {
    this.socket.emit('subscribe_to_disasters', filters);
  }

  subscribeToDisaster(disasterId) {
    this.socket.emit('subscribe_to_disaster', disasterId);
  }

  subscribeToResources(disasterId) {
    this.socket.emit('subscribe_to_resources', disasterId);
  }

  subscribeToReports(disasterId) {
    this.socket.emit('subscribe_to_reports', disasterId);
  }
}

// Singleton instance
export const socketService = new SocketService();

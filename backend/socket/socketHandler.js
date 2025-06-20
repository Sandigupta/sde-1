const socketIo = require('socket.io');
const { createServer } = require('http');
const { queryDisasters, updateAuditTrail } = require('../utils/dbUtils');

let io;

exports.initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Handle connection and disconnection
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join default room
    socket.join('disasters');

    // Handle disaster updates
    socket.on('subscribe_to_disasters', async (filters) => {
      try {
        const disasters = await queryDisasters(filters);
        socket.emit('disaster_list', disasters);
      } catch (error) {
        console.error('Error in disaster subscription:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle specific disaster subscription
    socket.on('subscribe_to_disaster', (disasterId) => {
      socket.join(`disaster_${disasterId}`);
    });

    // Handle resource updates
    socket.on('subscribe_to_resources', async (disasterId) => {
      try {
        const resources = await getNearbyResources(disasterId);
        socket.emit('resource_list', resources);
      } catch (error) {
        console.error('Error in resource subscription:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle reports
    socket.on('subscribe_to_reports', (disasterId) => {
      socket.join(`reports_${disasterId}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Export the io instance for use in other modules
  return io;
};

// Helper functions to emit events
exports.emitDisasterUpdate = async (disaster) => {
  if (io) {
    io.to('disasters').emit('disaster_updated', disaster);
    io.to(`disaster_${disaster.id}`).emit('disaster_updated', disaster);
  }
};

exports.emitResourceUpdate = async (resource) => {
  if (io) {
    io.to(`disaster_${resource.disaster_id}`).emit('resource_updated', resource);
  }
};

exports.emitReportUpdate = async (report) => {
  if (io) {
    io.to(`reports_${report.disaster_id}`).emit('report_updated', report);
  }
};

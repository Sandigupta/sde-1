import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { socketService } from '../services/socketService';
import axios from 'axios';
import './DisasterMap.css';

const DisasterMap = () => {
  const [disasters, setDisasters] = useState([]);

  useEffect(() => {
    // Subscribe to disaster updates
    const unsubscribe = socketService.on('disaster_updated', (disaster) => {
      if (disaster.deleted) {
        setDisasters(prev => prev.filter(d => d.id !== disaster.id));
      } else {
        setDisasters(prev => prev.map(d => 
          d.id === disaster.id ? disaster : d
        ));
      }
    });

    // Fetch initial disasters
    fetchDisasters();

    // Subscribe to all disasters
    socketService.subscribeToDisasters();

    return () => {
      unsubscribe();
    };
  }, []);

  const fetchDisasters = async () => {
    try {
      const response = await axios.get('http://localhost:5000/disasters');
      setDisasters(response.data);
    } catch (error) {
      console.error('Error fetching disasters:', error);
    }
  };

  const handleReportClick = (disaster) => {
    // Navigate to report form with disaster context
    window.location.href = `/report?disasterId=${disaster.id}`;
  };

  return (
    <div className="map-container">
      <MapContainer
        center={[20.5937, 78.9629]} // Center on India
        zoom={5}
        style={{ height: '100vh', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {disasters.map((disaster) => (
          <Marker
            key={disaster.id}
            position={[disaster.location.coordinates[1], disaster.location.coordinates[0]]}
          >
            <Popup>
              <h3>{disaster.title}</h3>
              <p>{disaster.description}</p>
              <p>Tags: {disaster.tags.join(', ')}</p>
              <button onClick={() => handleReportClick(disaster)}>Report</button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default DisasterMap;

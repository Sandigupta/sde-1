import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './DisasterDetails.css';

const DisasterDetails = () => {
  const [disaster, setDisaster] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const disasterId = window.location.pathname.split('/').pop();

//   useEffect(() => {
//     const fetchData = async () => {
//       await fetchDisasterDetails();
//       await fetchUpdates();
//       await fetchNearbyResources();
//       setLoading(false);
//     };
//     fetchData();
    //   }, [disasterId]);
    useEffect(() => {
        const fetchData = async () => {
          await fetchDisasterDetails();
          await fetchUpdates();
          await fetchNearbyResources();
          setLoading(false);
        };
        fetchData();
      });

  const fetchDisasterDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/disasters/${disasterId}`);
      setDisaster(response.data);
    } catch (error) {
      console.error('Error fetching disaster details:', error);
    }
  };

  const fetchUpdates = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/updates/${disasterId}`);
      setUpdates(response.data);
    } catch (error) {
      console.error('Error fetching updates:', error);
    }
  };

  const fetchNearbyResources = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/resources/${disasterId}`);
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  if (loading || !disaster) {
    return <div className="loading">Loading disaster details...</div>;
  }

  return (
    <div className="disaster-details">
      <div className="header">
        <h1>{disaster.title}</h1>
        <div className="status-badge" style={{
          backgroundColor: disaster.status === 'active' ? '#4CAF50' :
                         disaster.status === 'critical' ? '#f44336' :
                         '#2196F3'
        }}>
          {disaster.status}
        </div>
      </div>

      <div className="content">
        <div className="description">
          <h2>Description</h2>
          <p>{disaster.description}</p>
        </div>

        <div className="tags">
          <h2>Tags</h2>
          <div className="tag-list">
            {disaster.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </div>

        <div className="resources">
          <h2>Nearby Resources</h2>
          <div className="resource-list">
            {resources.map(resource => (
              <div key={resource.id} className="resource-item">
                <h3>{resource.title}</h3>
                <p>Type: {resource.type}</p>
                <p>Distance: {resource.distance} km</p>
                <p>Contact: {resource.contact_info}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="updates">
          <h2>Social Media Updates</h2>
          <div className="update-list">
            {updates.map(update => (
              <div key={update.id} className="update-item">
                <div className="update-header">
                  <span className="platform">{update.platform}</span>
                  <span className="timestamp">{new Date(update.created_at).toLocaleString()}</span>
                </div>
                <div className="update-content">
                  <p>{update.content}</p>
                  {update.media_url && (
                    <img src={update.media_url} alt="Update" className="update-image" />
                  )}
                  {update.verification_status && (
                    <div className="verification-badge">
                      {update.verification_status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisasterDetails;

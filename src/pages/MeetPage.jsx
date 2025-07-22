import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const MeetPage = () => {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('Loading location...');

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/location/${id}`);
        setLocation(res.data);
        setStatus('Here’s the location to meet:');
      } catch (err) {
        console.error(err);
        setStatus('❌ Location not found or expired.');
      }
    };

    fetchLocation();
  }, [id]);

  return (
    <div style={styles.container}>
      <h2>Meet-Up Location</h2>
      <p>{status}</p>

      {location && (
        <>
          <p><strong>Latitude:</strong> {location.latitude}</p>
          <p><strong>Longitude:</strong> {location.longitude}</p>
          <a
            href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.link}
          >
            Open in Google Maps
          </a>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '40px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
  },
  link: {
    marginTop: '20px',
    display: 'inline-block',
    backgroundColor: '#007aff',
    color: 'white',
    padding: '12px 20px',
    textDecoration: 'none',
    borderRadius: '8px',
  },
};

export default MeetPage;

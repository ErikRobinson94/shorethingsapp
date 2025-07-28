import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/location');
  };

  return (
    <div style={styles.container}>
      <img src="/logo.png" alt="ShoreThing Logo" style={styles.logo} />
      <p style={styles.tagline}>Beach vibes, delivered.</p>
      <p style={styles.description}>
        Order food, drinks, and beach gear from local businesses — delivered straight to your towel.
      </p>
      <button style={styles.button} onClick={handleStart}>
        Start Order
      </button>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(to bottom, #fbb03b, #29d3c2)',
    textAlign: 'center',
    padding: '20px',
  },
  logo: {
    width: '200px',
    maxWidth: '80%',
    marginBottom: '24px',
  },
  tagline: {
    fontSize: '18px',
    color: 'white',
    marginBottom: '10px',
    fontWeight: '500',
  },
  description: {
    color: 'white',
    maxWidth: '320px',
    fontSize: '14px',
    marginBottom: '40px',
  },
  button: {
    padding: '14px 32px',
    fontSize: '18px',
    backgroundColor: '#007aff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
};

export default HomePage;

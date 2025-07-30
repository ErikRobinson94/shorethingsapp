import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/LocationPage.css'; // reusing same styles

const TOWER_OPTIONS = [
  'Tower 26', 'Tower 27', 'Tower 28', 'Tower 29', 'Tower 30',
  'Tower 31', 'Tower 32', 'Tower 33', 'Tower 34', 'Tower 35'
];

function ConfirmTowerPage() {
  const [selectedTower, setSelectedTower] = useState('');
  const [coords, setCoords] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🚩 [TowerPage] Mounted');
    const savedCoords = localStorage.getItem('userCoords');
    if (savedCoords) {
      const parsed = JSON.parse(savedCoords);
      setCoords(parsed);
    } else {
      console.warn('⚠️ No coordinates found in localStorage');
    }
  }, []);

  const handleConfirm = () => {
    if (!selectedTower) {
      alert('Please select a lifeguard tower before continuing.');
      return;
    }

    localStorage.setItem('selectedTower', selectedTower);
    console.log('✅ [TowerPage] Saved tower:', selectedTower);

    navigate('/items');
  };

  return (
    <div className="location-page">
      <h1>Select Closest Lifeguard Tower</h1>
      <p>This will be your delivery location.</p>

      {coords && (
        <p className="coords">
          📍 <strong>Lat:</strong> {coords.lat.toFixed(5)} | <strong>Lon:</strong> {coords.lon.toFixed(5)}
        </p>
      )}

      <select
        value={selectedTower}
        onChange={(e) => setSelectedTower(e.target.value)}
        className="tower-dropdown"
      >
        <option value="">-- Choose a tower --</option>
        {TOWER_OPTIONS.map((tower) => (
          <option key={tower} value={tower}>
            {tower}
          </option>
        ))}
      </select>

      <button className="add-items-btn" onClick={handleConfirm}>
        <span className="icon">🛟</span> Confirm Tower & Add Items →
      </button>
    </div>
  );
}

export default ConfirmTowerPage;

// src/pages/DeviceListPage.jsx
import React, { useState, useEffect } from 'react';
import { getDevices } from '../services/api';

function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await getDevices();
        if (data.success) {
          setDevices(data.devices);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();
  }, []);

  if (isLoading) {
    return <div>A carregar dispositivos...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Erro: {error}</div>;
  }

  return (
    <div>
      <h2>Inventário de Dispositivos ({devices.length})</h2>
      <table border="1" cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Nº de Série</th>
            <th>Próxima Preventiva</th>
          </tr>
        </thead>
        <tbody>
          {devices.map((device) => (
            <tr key={device.id}>
              <td>{device.name}</td>
              <td>{device.deviceType}</td>
              <td>{device.serial || 'N/A'}</td>
              <td>{device.nextPreventiveDate ? new Date(device.nextPreventiveDate).toLocaleDateString() : 'N/D'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DeviceListPage;
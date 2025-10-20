// src/pages/DeviceListPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getDevices } from '../services/api';
import styles from './DeviceListPage.module.css'; // <-- 1. Importe os estilos

function DeviceListPage() {
  const [devices, setDevices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchDevices = async () => {
      // ... (a sua lógica de fetch continua igual)
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

  const filteredDevices = useMemo(() => {
    // ... (a sua lógica de filtro continua igual)
    if (filterType === 'all') return devices;
    return devices.filter(device => device.deviceType === filterType);
  }, [devices, filterType]);

  if (isLoading) {
    return <div>A carregar dispositivos...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Erro: {error}</div>;
  }

  // 2. Use as classes de estilo do .module.css
  return (
    <div className={styles.container}>
      <h2 className={styles.header}>Inventário de Dispositivos ({filteredDevices.length})</h2>

      <div className={styles.filterButtons}>
        <strong>Filtrar por: </strong>
        <button onClick={() => setFilterType('all')} disabled={filterType === 'all'}>Todos</button>
        <button onClick={() => setFilterType('computer')} disabled={filterType === 'computer'}>Computadores</button>
        <button onClick={() => setFilterType('printer')} disabled={filterType === 'printer'}>Impressoras</button>
      </div>

      <table className={styles.deviceTable}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Tipo</th>
            <th>Nº de Série</th>
            <th>Próxima Preventiva</th>
          </tr>
        </thead>
        <tbody>
          {filteredDevices.map((device) => (
            <tr key={device.id}>
              <td>
                <Link to={`/devices/${device.id}`} className={styles.deviceNameLink}>
                  {device.name}
                </Link>
              </td>
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
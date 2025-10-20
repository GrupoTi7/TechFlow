// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/api'; // Importa a função

function HomePage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats();
        if (data.success) {
          setStats(data.stats);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <div>A carregar estatísticas do dashboard...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Erro: {error}</div>;
  }

  return (
    <div>
      <h2>Dashboard de Preventivas</h2>
      {stats ? (
        <div style={{ display: 'flex', gap: '20px' }}>
          <StatCard title="Total de Dispositivos" value={stats.totalDevices} />
          <StatCard title="Preventivas Atrasadas" value={stats.overdueCount} isWarning />
          <StatCard title="Próximas (30 dias)" value={stats.upcomingCount} />
          <StatCard title="Total de Manutenções" value={stats.totalPreventivesDone} />
        </div>
      ) : (
        <p>Não foi possível carregar as estatísticas.</p>
      )}
    </div>
  );
}

// Componente auxiliar para os cartões
function StatCard({ title, value, isWarning = false }) {
  const cardStyle = {
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    textAlign: 'center',
    backgroundColor: isWarning && value > 0 ? '#fff0f0' : '#f9f9f9',
    border: isWarning && value > 0 ? '1px solid red' : '1px solid #ddd',
  };
  const valueStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: isWarning && value > 0 ? 'red' : 'black',
  };
  return (
    <div style={cardStyle}>
      <div style={valueStyle}>{value}</div>
      <div>{title}</div>
    </div>
  );
}

export default HomePage;
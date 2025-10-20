// src/pages/DeviceDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getDeviceById, getPreventivesForDevice, createPreventive } from '../services/api';

function DeviceDetailPage() {
  const { id } = useParams(); // Pega o ID do dispositivo do URL
  const [device, setDevice] = useState(null);
  const [preventives, setPreventives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para o formulário da nova preventiva
  const [newPreventiveDate, setNewPreventiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTechnician, setNewTechnician] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState(null);

  // Função para carregar todos os dados (detalhes + histórico)
  const loadData = async () => {
    try {
      setIsLoading(true);
      const deviceResult = await getDeviceById(id);
      const preventivesResult = await getPreventivesForDevice(id);

      if (deviceResult.success) {
        setDevice(deviceResult.device);
      } else {
        throw new Error(deviceResult.message);
      }
      
      if (preventivesResult.success) {
        setPreventives(preventivesResult.preventives);
      } else {
        throw new Error(preventivesResult.message);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Executa a função de carregar dados quando a página abre
  useEffect(() => {
    loadData();
  }, [id]); // O [id] garante que isto re-executa se o ID no URL mudar

  // Função para lidar com o envio do formulário de nova preventiva
  const handlePreventiveSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    if (!newTechnician || !newPreventiveDate) {
      setFormError('Data e Técnico são obrigatórios.');
      return;
    }

    try {
      const preventiveData = {
        date: new Date(newPreventiveDate),
        technician: newTechnician,
        notes: newNotes,
      };
      
      await createPreventive(id, preventiveData);
      
      // Limpa o formulário e recarrega os dados da página
      setNewTechnician('');
      setNewNotes('');
      setNewPreventiveDate(new Date().toISOString().split('T')[0]);
      alert('Preventiva registada com sucesso!');
      loadData(); // Recarrega os detalhes do dispositivo e o histórico

    } catch (err) {
      setFormError(err.message);
    }
  };

  if (isLoading) return <div>A carregar detalhes do dispositivo...</div>;
  if (error) return <div style={{ color: 'red' }}>Erro: {error}</div>;
  if (!device) return <div>Dispositivo não encontrado.</div>;

  return (
    <div>
      <Link to="/devices">&larr; Voltar para a lista</Link>
      
      <h2>{device.name}</h2>
      
      {/* SECÇÃO DE DETALHES DO DISPOSITIVO */}
      <h3>Detalhes</h3>
      <ul>
        <li><strong>Tipo:</strong> {device.deviceType}</li>
        <li><strong>Nº de Série:</strong> {device.serial || 'N/A'}</li>
        <li><strong>Intervalo de Manutenção:</strong> A cada {device.maintenanceIntervalDays} dias</li>
        <li style={{ color: 'blue', fontWeight: 'bold' }}>
          <strong>Próxima Preventiva:</strong> 
          {device.nextPreventiveDate ? new Date(device.nextPreventiveDate).toLocaleDateString() : 'Nenhuma agendada'}
        </li>
      </ul>

      <hr />

      {/* SECÇÃO PARA ADICIONAR NOVA PREVENTIVA */}
      <h3>Registar Nova Preventiva</h3>
      <form onSubmit={handlePreventiveSubmit}>
        <div>
          <label>Data: </label>
          <input 
            type="date" 
            value={newPreventiveDate} 
            onChange={(e) => setNewPreventiveDate(e.target.value)} 
          />
        </div>
        <div>
          <label>Técnico: </label>
          <input 
            type="text" 
            value={newTechnician} 
            onChange={(e) => setNewTechnician(e.target.value)} 
            placeholder="Nome do técnico"
          />
        </div>
        <div>
          <label>Notas: </label>
          <textarea 
            value={newNotes} 
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Descreva o que foi feito..."
          />
        </div>
        {formError && <p style={{ color: 'red' }}>{formError}</p>}
        <button type="submit">Adicionar Registo</button>
      </form>

      <hr />

      {/* SECÇÃO DO HISTÓRICO DE PREVENTIVAS */}
      <h3>Histórico de Preventivas</h3>
      {preventives.length > 0 ? (
        <table border="1" cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Data</th>
              <th>Técnico</th>
              <th>Notas</th>
            </tr>
          </thead>
          <tbody>
            {preventives.map(prev => (
              <tr key={prev.id}>
                <td>{new Date(prev.date).toLocaleDateString()}</td>
                <td>{prev.technician}</td>
                <td>{prev.notes || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Nenhum registo de preventiva encontrado para este dispositivo.</p>
      )}
    </div>
  );
}

export default DeviceDetailPage;
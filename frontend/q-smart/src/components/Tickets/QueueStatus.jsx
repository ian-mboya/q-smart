/* import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketsAPI } from '../services/api';

const QueueStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicketStatus();
    const interval = setInterval(fetchTicketStatus, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const fetchTicketStatus = async () => {
    try {
      const response = await ticketsAPI.getMyTicket(id);
      setTicket(response.data.data.ticket);
      setQueue(response.data.data.queue);
    } catch (error) {
      console.error('Error fetching ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading your ticket status...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="error-page">
        <h2>No Active Ticket Found</h2>
        <p>You don't have an active ticket for this queue.</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="queue-status">
      <header className="status-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">
          ← Back
        </button>
        <h1>{queue?.name}</h1>
        <div className="ticket-number">Ticket #{ticket.ticketNumber}</div>
      </header>

      <div className="status-card">
        <div className="status-icon">
          {ticket.status === 'waiting' ? '⏳' : 
           ticket.status === 'called' ? '🚨' : '✅'}
        </div>
        
        <h2 className="status-message">
          {ticket.status === 'waiting' && `You are position #${ticket.position}`}
          {ticket.status === 'called' && 'Your turn is now! Please proceed.'}
          {ticket.status === 'in-progress' && 'Meeting in progress'}
        </h2>

        <p className="status-instruction">
          {ticket.status === 'waiting' && `Estimated wait: ${ticket.estimatedWaitTime} minutes`}
          {ticket.status === 'called' && `Go to ${queue?.location} immediately`}
        </p>

        {ticket.status === 'waiting' && (
          <div className="progress-section">
            <div className="progress-info">
              <span>Currently serving: #{queue?.currentTicket || 0}</span>
              <span>Your position: #{ticket.position}</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ 
                  width: `${Math.min(100, ((queue?.currentTicket || 0) / ticket.ticketNumber) * 100)}%` 
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="queue-info">
        <h3>Queue Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Location:</label>
            <span>{queue?.location}</span>
          </div>
          <div className="info-item">
            <label>Estimated Wait:</label>
            <span>{ticket.estimatedWaitTime} minutes</span>
          </div>
          {ticket.studentInfo && (
            <div className="info-item">
              <label>Student:</label>
              <span>{ticket.studentInfo.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueStatus; */
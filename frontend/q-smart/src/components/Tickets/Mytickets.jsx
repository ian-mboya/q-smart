/* import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ticketsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
//import '../../styles/MyTickets.css';

const MyTickets = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyTickets();
    const interval = setInterval(fetchMyTickets, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMyTickets = async () => {
    try {
      const response = await ticketsAPI.getMyTickets();
      setTickets(response.data.data.tickets);
      setError('');
    } catch (error) {
      setError('Failed to load your tickets');
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    if (window.confirm('Are you sure you want to cancel this ticket?')) {
      try {
        await ticketsAPI.cancelTicket(ticketId);
        fetchMyTickets(); // Refresh the list
      } catch (error) {
        alert('Failed to cancel ticket');
      }
    }
  };

  const handleViewTicket = (queueId) => {
    navigate(`/queue/${queueId}`);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'waiting': { label: 'Waiting', class: 'status-waiting', icon: '⏳' },
      'called': { label: 'Called', class: 'status-called', icon: '🚨' },
      'in-progress': { label: 'In Progress', class: 'status-in-progress', icon: '✅' },
      'completed': { label: 'Completed', class: 'status-completed', icon: '🏁' },
      'cancelled': { label: 'Cancelled', class: 'status-cancelled', icon: '❌' }
    };

    const config = statusConfig[status] || { label: status, class: 'status-unknown', icon: '❓' };
    
    return (
      <span className={`status-badge ${config.class}`}>
        <span className="status-icon">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getQueueIcon = (serviceType) => {
    const icons = {
      'admissions': '🎓',
      'counselling': '💬',
      'library': '📚',
      'fee-payment': '💰',
      'parent-teacher': '👨‍👩‍👧‍👦',
      'administration': '🏫'
    };
    return icons[serviceType] || '📋';
  };

  if (loading) {
    return (
      <div className="my-tickets-loading">
        <div className="loading-spinner"></div>
        <p>Loading your tickets...</p>
      </div>
    );
  }

  return (
    <div className="my-tickets">
      <div className="tickets-header">
        <h2>My Active Tickets</h2>
        <button 
          onClick={fetchMyTickets}
          className="refresh-btn"
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={fetchMyTickets} className="retry-btn">Retry</button>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="empty-tickets">
          <div className="empty-icon">🎫</div>
          <h3>No Active Tickets</h3>
          <p>You don't have any active queue tickets. Join a queue to get started!</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="browse-queues-btn"
          >
            Browse Available Queues
          </button>
        </div>
      ) : (
        <div className="tickets-list">
          {tickets.map(ticket => (
            <div key={ticket._id} className="ticket-card">
              <div className="ticket-header">
                <div className="queue-info">
                  <span className="queue-icon">
                    {getQueueIcon(ticket.queue.serviceType)}
                  </span>
                  <div className="queue-details">
                    <h4>{ticket.queue.name}</h4>
                    <span className="queue-location">📍 {ticket.queue.location}</span>
                  </div>
                </div>
                {getStatusBadge(ticket.status)}
              </div>

              <div className="ticket-body">
                <div className="ticket-meta">
                  <div className="meta-item">
                    <span className="meta-label">Ticket #</span>
                    <span className="meta-value">{ticket.ticketNumber}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Position</span>
                    <span className="meta-value">#{ticket.position}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Est. Wait</span>
                    <span className="meta-value">{ticket.estimatedWaitTime} min</span>
                  </div>
                  {ticket.studentInfo && (
                    <div className="meta-item">
                      <span className="meta-label">Student</span>
                      <span className="meta-value">
                        {ticket.studentInfo.name} ({ticket.studentInfo.grade})
                      </span>
                    </div>
                  )}
                </div>

                <div className="queue-progress">
                  <div className="progress-info">
                    <span>Current: #{ticket.queue.currentTicket}</span>
                    <span>You: #{ticket.ticketNumber}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${Math.min(100, ((ticket.queue.currentTicket || 0) / ticket.ticketNumber) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="ticket-actions">
                <button 
                  onClick={() => handleViewTicket(ticket.queue._id)}
                  className="view-ticket-btn"
                >
                  View Details
                </button>
                
                {(ticket.status === 'waiting' || ticket.status === 'called') && (
                  <button 
                    onClick={() => handleCancelTicket(ticket._id)}
                    className="cancel-ticket-btn"
                  >
                    Cancel Ticket
                  </button>
                )}
              </div>

              <div className="ticket-footer">
                <span className="created-time">
                  Joined: {new Date(ticket.createdAt).toLocaleTimeString()}
                </span>
                {ticket.calledAt && (
                  <span className="called-time">
                    Called: {new Date(ticket.calledAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTickets; */
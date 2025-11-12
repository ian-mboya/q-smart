import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('queues');

  // Mock data for demonstration
  const mockQueues = [
    {
      id: 1,
      name: 'Parent-Teacher Meetings',
      description: 'Meet with your child\'s teacher',
      location: 'Room 101',
      waiting: 8,
      avgWait: 15,
      serviceType: 'parent-teacher'
    },
    {
      id: 2,
      name: 'Library Book Return',
      description: 'Quick book return service',
      location: 'Library Desk',
      waiting: 3,
      avgWait: 5,
      serviceType: 'library'
    },
    {
      id: 3,
      name: 'Fee Payment',
      description: 'School fee payment counter',
      location: 'Administration Office',
      waiting: 12,
      avgWait: 10,
      serviceType: 'fee-payment'
    }
  ];

  const mockTickets = [
    {
      id: 1,
      queueName: 'Parent-Teacher Meetings',
      ticketNumber: 15,
      position: 8,
      status: 'waiting',
      estimatedWait: 120
    }
  ];

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

  const handleJoinQueue = (queueId) => {
    alert(`This would join queue ${queueId} - functionality coming soon!`);
  };

  const handleViewTicket = (queueId) => {
    alert(`This would show ticket for queue ${queueId} - functionality coming soon!`);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-welcome">
            <h1>Welcome to QueueSmart! 👋</h1>
            <p>Manage your school queue tickets in one place</p>
          </div>
          <div className="user-actions">
            <button 
              className="logout-btn"
              onClick={() => navigate('/')}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'queues' ? 'active' : ''}`}
          onClick={() => setActiveTab('queues')}
        >
          📋 Available Queues
        </button>
        <button 
          className={`tab ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          🎫 My Tickets
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        {activeTab === 'queues' && (
          <div className="queues-section">
            <h2>Available Services</h2>
            <p className="section-description">
              Join a queue to get service. Your position will be tracked in real-time.
            </p>
            
            <div className="queues-grid">
              {mockQueues.map(queue => (
                <div key={queue.id} className="queue-card">
                  <div className="queue-header">
                    <div className="queue-icon">{getQueueIcon(queue.serviceType)}</div>
                    <div className="queue-info">
                      <h3>{queue.name}</h3>
                      <span className="queue-type">{queue.serviceType}</span>
                    </div>
                    <div className="queue-stats">
                      <span className="waiting-count">{queue.waiting} waiting</span>
                    </div>
                  </div>
                  
                  <p className="queue-description">{queue.description}</p>
                  
                  <div className="queue-details">
                    <div className="detail">
                      <span className="icon">📍</span>
                      <span>{queue.location}</span>
                    </div>
                    <div className="detail">
                      <span className="icon">⏱️</span>
                      <span>Avg. {queue.avgWait} min</span>
                    </div>
                  </div>
                  
                  <button 
                    className="join-btn"
                    onClick={() => handleJoinQueue(queue.id)}
                  >
                    Join Queue
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="tickets-section">
            <h2>My Active Tickets</h2>
            
            {mockTickets.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎫</div>
                <h3>No Active Tickets</h3>
                <p>You don't have any active tickets. Join a queue to get started!</p>
                <button 
                  className="browse-btn"
                  onClick={() => setActiveTab('queues')}
                >
                  Browse Queues
                </button>
              </div>
            ) : (
              <div className="tickets-list">
                {mockTickets.map(ticket => (
                  <div key={ticket.id} className="ticket-card">
                    <div className="ticket-header">
                      <h4>{ticket.queueName}</h4>
                      <span className={`status ${ticket.status}`}>
                        {ticket.status === 'waiting' ? '⏳ Waiting' : '✅ Ready'}
                      </span>
                    </div>
                    
                    <div className="ticket-details">
                      <div className="detail">
                        <span>Ticket #</span>
                        <strong>{ticket.ticketNumber}</strong>
                      </div>
                      <div className="detail">
                        <span>Position</span>
                        <strong>#{ticket.position}</strong>
                      </div>
                      <div className="detail">
                        <span>Est. Wait</span>
                        <strong>{ticket.estimatedWait} min</strong>
                      </div>
                    </div>
                    
                    <button 
                      className="view-btn"
                      onClick={() => handleViewTicket(ticket.id)}
                    >
                      View Status
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Quick Stats Footer */}
      <footer className="dashboard-footer">
        <div className="stats">
          <div className="stat">
            <span className="number">{mockQueues.length}</span>
            <span className="label">Active Queues</span>
          </div>
          <div className="stat">
            <span className="number">{mockTickets.length}</span>
            <span className="label">Your Tickets</span>
          </div>
          <div className="stat">
            <span className="number">{mockQueues.reduce((sum, q) => sum + q.waiting, 0)}</span>
            <span className="label">Total Waiting</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
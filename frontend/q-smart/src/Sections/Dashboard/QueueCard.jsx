/* import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { queuesAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
//import '../../styles/QueueCard.css';

const QueueCard = ({ queue, onJoinSuccess }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joining, setJoining] = useState(false);

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

  const getStatusColor = (waitingTickets) => {
    if (waitingTickets === 0) return 'status-empty';
    if (waitingTickets < 5) return 'status-low';
    if (waitingTickets < 10) return 'status-medium';
    return 'status-high';
  };

  const handleJoinQueue = async () => {
    setJoining(true);
    try {
      // Prepare student info based on user role
      const studentInfo = user.role === 'parent' && user.children?.[0] 
        ? {
            name: user.children[0].name,
            grade: user.children[0].grade,
            studentId: user.children[0].studentId
          }
        : {
            name: user.name,
            grade: user.grade || 'N/A',
            studentId: user.studentId || 'N/A'
          };

      const response = await queuesAPI.join(queue._id, studentInfo);
      
      if (response.status === 201) {
        alert(`✅ Success! Your ticket number is ${response.data.data.ticket.ticketNumber}`);
        onJoinSuccess?.();
        navigate(`/queue/${queue._id}`);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to join queue';
      alert(`❌ ${message}`);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="queue-card">
      <div className="queue-header">
        <div className="queue-icon">{getQueueIcon(queue.serviceType)}</div>
        <div className="queue-title">
          <h3>{queue.name}</h3>
          <span className="queue-service-type">{queue.serviceType}</span>
        </div>
        <div className={`queue-status ${getStatusColor(queue.waitingTickets)}`}>
          {queue.waitingTickets} waiting
        </div>
      </div>

      <div className="queue-body">
        <p className="queue-description">{queue.description}</p>
        
        <div className="queue-details">
          <div className="detail-item">
            <span className="detail-icon">📍</span>
            <span className="detail-text">{queue.location}</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">⏱️</span>
            <span className="detail-text">Avg. {queue.averageWaitTime} min wait</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">🎯</span>
            <span className="detail-text">Current: #{queue.currentTicket}</span>
          </div>
        </div>
      </div>

      <div className="queue-footer">
        <button 
          className={`join-btn ${joining ? 'joining' : ''}`}
          onClick={handleJoinQueue}
          disabled={joining || !queue.isActive}
        >
          {joining ? (
            <>
              <span className="spinner"></span>
              Joining...
            </>
          ) : (
            queue.isActive ? 'Join Queue' : 'Queue Closed'
          )}
        </button>
        
        {queue.waitingTickets > 0 && (
          <div className="wait-time-estimate">
            Est. wait: ~{queue.waitingTickets * queue.averageWaitTime} min
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueCard; */
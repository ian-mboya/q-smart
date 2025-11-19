// Pages/ParentDashboard.jsx - COMPLETE IMPLEMENTATION WITH ALL FEATURES
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { parentAPI, ticketsAPI, queuesAPI } from '../services/api';
import './Dashboard.css';

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [familyData, setFamilyData] = useState(null);
  const [children, setChildren] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showChildModal, setShowChildModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showJoinQueueModal, setShowJoinQueueModal] = useState(false);
  const [availableQueues, setAvailableQueues] = useState([]);
  const [childModalLoading, setChildModalLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', grade: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchParentData();
  }, []);

  const fetchParentData = async () => {
    try {
      setLoading(true);
      console.log('🔄 fetchParentData starting...');
      
      const [analyticsResponse, childrenResponse, ticketsResponse] = await Promise.all([
        parentAPI.getFamilyAnalytics().catch(e => { console.error('❌ Analytics failed:', e); throw e; }),
        parentAPI.getMyChildren().catch(e => { console.error('❌ getMyChildren failed:', e); throw e; }),
        parentAPI.getFamilyTickets().catch(e => { console.error('❌ getFamilyTickets failed:', e); throw e; })
      ]);
      
      console.log('✅ All API calls completed');
      console.log('Family Analytics Response:', analyticsResponse);
      console.log('Children Response:', childrenResponse);
      console.log('Tickets Response:', ticketsResponse);
      
      // Set family data (analytics)
      console.log('📊 Setting familyData:', analyticsResponse.data);
      setFamilyData(analyticsResponse.data || {});
      
      // Handle both direct array and wrapped response for children
      // Note: childrenResponse.data is the API response { status, data: [...] }
      // So actual children are at childrenResponse.data.data
      let childrenData = [];
      if (childrenResponse.data?.data && Array.isArray(childrenResponse.data.data)) {
        console.log('✅ childrenResponse.data.data is an array:', childrenResponse.data.data.length, 'items');
        childrenData = childrenResponse.data.data;
      } else if (childrenResponse.data?.childStats && Array.isArray(childrenResponse.data.childStats)) {
        console.log('✅ childrenResponse.data.childStats found:', childrenResponse.data.childStats.length, 'items');
        childrenData = childrenResponse.data.childStats;
      } else if (Array.isArray(childrenResponse.data)) {
        console.log('✅ childrenResponse.data is a direct array:', childrenResponse.data.length, 'items');
        childrenData = childrenResponse.data;
      } else {
        console.warn('⚠️ Unexpected children response structure:', childrenResponse.data);
      }
      
      console.log('👶 Processed childrenData:', childrenData);
      console.log('👶 Setting children state with', childrenData.length, 'items');
      setChildren(childrenData);
      
      // Handle tickets response structure: response.data.data.tickets
      let ticketsData = [];
      if (ticketsResponse.data?.data?.tickets && Array.isArray(ticketsResponse.data.data.tickets)) {
        console.log('✅ Using response.data.data.tickets:', ticketsResponse.data.data.tickets.length, 'tickets');
        ticketsData = ticketsResponse.data.data.tickets;
      } else if (Array.isArray(ticketsResponse.data?.tickets)) {
        console.log('✅ Using response.data.tickets:', ticketsResponse.data.tickets.length, 'tickets');
        ticketsData = ticketsResponse.data.tickets;
      } else if (Array.isArray(ticketsResponse.data?.data)) {
        console.log('✅ Using response.data.data:', ticketsResponse.data.data.length, 'tickets');
        ticketsData = ticketsResponse.data.data;
      } else if (Array.isArray(ticketsResponse.data)) {
        console.log('✅ Using response.data directly:', ticketsResponse.data.length, 'tickets');
        ticketsData = ticketsResponse.data;
      }
      console.log('🎫 Processed ticketsData:', ticketsData);
      setTickets(ticketsData);
      
      if (childrenData.length > 0) {
        addNotification(`Loaded ${childrenData.length} child(ren)`, 'success');
      } else {
        console.log('ℹ️ No children to display');
      }
    } catch (error) {
      console.error('❌ Error fetching parent data:', error);
      addNotification('Failed to load family data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (message, type = 'success') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const handleSelectChild = async (child) => {
    try {
      setChildModalLoading(true);
      setSelectedChild(child);
      setShowChildModal(true);
    } catch (error) {
      console.error('Error selecting child:', error);
      addNotification('Failed to load child details', 'error');
    } finally {
      setChildModalLoading(false);
    }
  };

  const handleOpenJoinQueue = async () => {
    try {
      console.log('📋 Fetching available queues...');
      const response = await queuesAPI.getAll();
      console.log('📋 Queues response:', response);
      
      // Handle both response formats - backend returns data: { queues: [...] }
      let queuesData = [];
      if (response.data?.data?.queues && Array.isArray(response.data.data.queues)) {
        console.log('✅ Using response.data.data.queues:', response.data.data.queues.length, 'queues');
        queuesData = response.data.data.queues;
      } else if (response.data?.queues && Array.isArray(response.data.queues)) {
        console.log('✅ Using response.data.queues:', response.data.queues.length, 'queues');
        queuesData = response.data.queues;
      } else if (Array.isArray(response.data?.data)) {
        console.log('✅ Using response.data.data:', response.data.data.length, 'queues');
        queuesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        console.log('✅ Using response.data directly:', response.data.length, 'queues');
        queuesData = response.data;
      }
      
      console.log('📋 Found', queuesData.length, 'queues to display');
      setAvailableQueues(queuesData);
      setSearchQuery(''); // Reset search when opening modal
      setShowJoinQueueModal(true);
      console.log('✅ Join queue modal opened with', queuesData.length, 'queues');
    } catch (error) {
      console.error('❌ Error fetching queues:', error);
      addNotification('Failed to load available queues', 'error');
    }
  };

  const handleJoinQueue = async (queueId) => {
    if (!selectedChild) {
      addNotification('No child selected', 'error');
      return;
    }
    
    try {
      console.log('🎫 Joining child to queue...');
      console.log('  Child ID:', selectedChild._id || selectedChild.childId);
      console.log('  Queue ID:', queueId);
      
      const childId = selectedChild._id || selectedChild.childId;
      const response = await parentAPI.joinQueueForChild(childId, queueId);
      
      console.log('✅ Join queue response:', response);
      addNotification(`Successfully joined ${selectedChild.name || selectedChild.childName} to queue`);
      setShowJoinQueueModal(false);
      
      // Refresh data after a short delay to ensure server has processed
      setTimeout(() => {
        fetchParentData();
      }, 500);
    } catch (error) {
      console.error('❌ Error joining queue:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to join queue';
      addNotification(errorMsg, 'error');
    }
  };

  const handleAddChild = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      addNotification('Please fill in all required fields', 'error');
      return;
    }

    try {
      console.log('Adding child with data:', formData);
      const response = await parentAPI.addChild(formData);
      console.log('Add child response:', response);
      addNotification(`Successfully added ${formData.name}`);
      setFormData({ name: '', email: '', grade: '' });
      setShowAddChildModal(false);
      setTimeout(() => {
        console.log('Refreshing parent data after adding child');
        fetchParentData();
      }, 500);
    } catch (error) {
      console.error('Error adding child:', error);
      addNotification('Failed to add child: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const handleCancelTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to cancel this ticket?')) return;

    try {
      console.log('❌ Cancelling ticket:', ticketId);
      const response = await ticketsAPI.cancelTicket(ticketId);
      console.log('✅ Ticket cancelled:', response);
      addNotification('Ticket cancelled successfully');
      
      // Refresh data after a short delay
      setTimeout(() => {
        fetchParentData();
      }, 500);
    } catch (error) {
      console.error('❌ Error cancelling ticket:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to cancel ticket';
      addNotification(errorMsg, 'error');
    }
  };

  const handleContactTeacher = (ticket) => {
    if (!ticket.queue?.teacher?.email) {
      addNotification('Teacher contact information not available', 'error');
      return;
    }
    window.location.href = `mailto:${ticket.queue.teacher.email}?subject=Question about ${ticket.student?.name} - ${ticket.title}`;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading family dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard parent-dashboard">
      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map(notif => (
          <div key={notif.id} className={`notification ${notif.type}`}>
            {notif.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-welcome">
            <h1>Family Portal, {user?.name}! 👨‍👩‍👧‍👦</h1>
            <p>Monitor your children's queue activities and progress</p>
            {familyData?.summary && (
              <div className="quick-stats">
                <span className="stat">Children: {familyData.summary.totalChildren}</span>
                <span className="stat">Active Tickets: {familyData.summary.pendingFamilyTickets}</span>
                <span className="stat">Completed: {familyData.summary.completedFamilyTickets}</span>
              </div>
            )}
            <span className="role-badge role-parent">PARENT</span>
          </div>
          <div className="user-actions">
            <button className="refresh-btn" onClick={fetchParentData}>🔄 Refresh</button>
            <button className="logout-btn" onClick={logout}>Logout</button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          🏠 Child Overview
        </button>
        <button 
          className={`tab ${activeTab === 'children' ? 'active' : ''}`}
          onClick={() => {
            const childArray = Array.isArray(familyData?.childStats) ? familyData.childStats : (Array.isArray(children) ? children : []);
            console.log('Switching to children tab, children:', childArray);
            setActiveTab('children');
          }}
        >
          👨‍👧‍👦 My Children ({Array.isArray(familyData?.childStats) ? familyData.childStats.length : (Array.isArray(children) ? children.length : 0)})
        </button>
        <button 
          className={`tab ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          🎫 Tickets and History ({tickets.length})
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <FamilyOverviewSection 
            familyData={familyData}
            children={Array.isArray(familyData?.childStats) ? familyData.childStats : (Array.isArray(children) ? children : [])}
            tickets={tickets}
            onSelectChild={handleSelectChild}
          />
        )}

        {activeTab === 'children' && (
          <ChildrenSection 
            children={Array.isArray(children) && children.length > 0 ? children : (Array.isArray(familyData?.childStats) ? familyData.childStats : [])}
            onSelectChild={handleSelectChild}
            onAddChild={() => setShowAddChildModal(true)}
          />
        )}

        {activeTab === 'tickets' && (
          <FamilyTicketsSection 
            tickets={tickets}
            children={children}
            onCancelTicket={handleCancelTicket}
            onContactTeacher={handleContactTeacher}
          />
        )}
      </main>

      {/* Modals */}
      {showChildModal && selectedChild && (
        <ChildDetailModal
          child={selectedChild}
          onClose={() => {
            setShowChildModal(false);
            setSelectedChild(null);
          }}
          onJoinQueue={handleOpenJoinQueue}
          loading={childModalLoading}
        />
      )}

      {showJoinQueueModal && selectedChild && (
        <JoinQueueModal
          child={selectedChild}
          queues={availableQueues}
          onJoinQueue={handleJoinQueue}
          onClose={() => {
            setShowJoinQueueModal(false);
            setSearchQuery('');
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      {showAddChildModal && (
        <AddChildModal
          onSubmit={handleAddChild}
          onClose={() => {
            setShowAddChildModal(false);
            setFormData({ name: '', email: '', grade: '' });
          }}
          formData={formData}
          setFormData={setFormData}
        />
      )}
    </div>
  );
};

// Family Overview Section
const FamilyOverviewSection = ({ familyData, children, tickets, onSelectChild }) => {
  // Normalize children data - handle both formats
  const normalizedChildren = (children || []).map(child => ({
    _id: child._id || child.childId,
    name: child.name || child.childName,
    email: child.email || '',
    grade: child.grade || 'Not specified',
    createdAt: child.createdAt || new Date(),
    stats: {
      totalTickets: child.stats?.totalTickets || child.totalTickets || 0,
      pendingTickets: child.stats?.pendingTickets || child.pendingTickets || 0,
      completedTickets: child.stats?.completedTickets || child.completedTickets || 0,
      completionRate: child.stats?.completionRate || child.completionRate || 0
    }
  }));

  return (
    <div className="family-overview">
      <div className="section-header">
        <h2>Family Dashboard Overview</h2>
        <p>Quick glance at your children's academic support activities</p>
      </div>

      {/* Children Summary */}
      <div className="children-summary">
        <h3 style={{color: 'var(--color-pure-white)', marginBottom: '1.5rem'}}>Your Children</h3>
        <div className="queues-grid">
          {normalizedChildren.length > 0 ? (
            normalizedChildren.map(child => (
              <div key={child._id} className="queue-card">
                <div className="queue-header">
                  <h3>{child.name}</h3>
                  <span style={{
                    background: 'var(--color-emerald-green)',
                    color: 'var(--color-primary-black)',
                    padding: '0.375rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                  }}>
                    {(child.stats?.completionRate || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="queue-description" style={{marginBottom: '1rem'}}>
                  <strong>Email:</strong> {child.email || 'N/A'}<br/>
                  <strong>Grade:</strong> {child.grade || 'Not specified'}<br/>
                  <strong>Member Since:</strong> {new Date(child.createdAt).toLocaleDateString()}
                </div>
                <div className="queue-meta">
                  <span className="meta-item">
                    <strong>Total Sessions:</strong> {child.stats?.totalTickets || 0}
                  </span>
                  <span className="meta-item">
                    <strong>Waiting:</strong> {child.stats?.pendingTickets || 0}
                  </span>
                  <span className="meta-item">
                    <strong>Completed:</strong> {child.stats?.completedTickets || 0}
                  </span>
                  <span className="meta-item">
                    <strong>Success Rate:</strong> {(child.stats?.completionRate || 0).toFixed(1)}%
                  </span>
                </div>
                <button 
                  className="btn-primary"
                  onClick={() => onSelectChild(child)}
                  style={{marginTop: '1rem'}}
                >
                  View Details
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{gridColumn: '1 / -1'}}>
              <div className="empty-icon">👨‍👧‍👦</div>
              <h3>No Children Added</h3>
              <p>Add your children to start monitoring their academic progress.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Family Activity */}
      <div className="recent-activity">
        <h3>Recent Family Activity</h3>
        <div className="activity-timeline">
          {familyData?.recentFamilyTickets?.map(ticket => (
            <div key={ticket._id} className="history-item">
              <div className="activity-icon">
                {ticket.status === 'completed' ? '✅' : 
                 ticket.status === 'pending' ? '⏳' : '🔄'}
              </div>
              <div className="activity-details">
                <div className="activity-main">
                  <span className="service-name">{ticket.title}</span>
                  <span className="ticket-number">{ticket.queue?.name}</span>
                </div>
                <div className="completion-info">
                  <span className="completion-time">{ticket.student?.name}</span>
                  <span className="wait-time">
                    Teacher: {ticket.queue?.teacher?.name}
                  </span>
                  <span className="wait-time">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <span className={`status-badge ${ticket.status}`}>
                {ticket.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Children Section
const ChildrenSection = ({ children = [], onSelectChild, onAddChild }) => {
  const childrenList = Array.isArray(children) ? children : [];
  
  // Normalize children data - handle both formats
  const normalizedChildren = childrenList.map(child => ({
    _id: child._id || child.childId,
    name: child.name || child.childName,
    email: child.email || '',
    grade: child.grade || 'Not specified',
    createdAt: child.createdAt || new Date(),
    stats: {
      totalTickets: child.stats?.totalTickets || child.totalTickets || 0,
      pendingTickets: child.stats?.pendingTickets || child.pendingTickets || 0,
      completedTickets: child.stats?.completedTickets || child.completedTickets || 0,
      completionRate: child.stats?.completionRate || child.completionRate || 0
    }
  }));

  console.log('ChildrenSection received:', childrenList, 'normalized:', normalizedChildren);
  
  return (
    <div className="children-section">
      <div className="section-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
        <div>
          <h2>My Children</h2>
          <p>Manage and monitor each child's academic support</p>
        </div>
        <button className="btn-primary" onClick={onAddChild} style={{whiteSpace: 'nowrap', marginLeft: '1rem'}}>
          ➕ Add Child
        </button>
      </div>

      <div className="queues-grid">
        {normalizedChildren.map(child => (
          <div key={child._id} className="queue-card">
            <div className="queue-header">
              <h3>{child.name}</h3>
              <span className="role-badge role-student">STUDENT</span>
            </div>
            
            <div className="queue-description">
              <strong>Email:</strong> {child.email || 'N/A'}<br/>
              <strong>Grade:</strong> {child.grade || 'Not specified'}<br/>
              <strong>Member Since:</strong> {new Date(child.createdAt).toLocaleDateString()}
            </div>

            <div className="queue-meta">
              <span className="meta-item">
                <strong>Total Sessions:</strong> {child.stats?.totalTickets || 0}
              </span>
              <span className="meta-item">
                <strong>Currently Waiting:</strong> {child.stats?.pendingTickets || 0}
              </span>
              <span className="meta-item">
                <strong>Completed:</strong> {child.stats?.completedTickets || 0}
              </span>
              <span className="meta-item">
                <strong>Success Rate:</strong> {(child.stats?.completionRate || 0).toFixed(1)}%
              </span>
            </div>

            <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
              <button 
                className="btn-primary" 
                style={{flex: 2}}
                onClick={() => onSelectChild(child)}
              >
                View Details
              </button>
              <button className="cancel-btn" style={{flex: 1}}>
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {normalizedChildren.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👨‍👧‍👦</div>
          <h3>No Children Added</h3>
          <p>Add your children to start monitoring their academic progress.</p>
          <button className="btn-primary" style={{marginTop: '1rem'}} onClick={onAddChild}>
            Add Your First Child
          </button>
        </div>
      )}
    </div>
  );
};

// Family Tickets Section
const FamilyTicketsSection = ({ tickets = [], children = [], onCancelTicket, onContactTeacher }) => {
  const [filter, setFilter] = useState('all');
  const ticketsList = Array.isArray(tickets) ? tickets : [];
  
  const filteredTickets = filter === 'all' 
    ? ticketsList 
    : ticketsList.filter(ticket => ticket.status === filter);

  return (
    <div className="tickets-section">
      <div className="section-header">
        <h2>Find Tickets Here</h2>
        <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '0.75rem',
              background: 'var(--color-charcoal-dark)',
              border: '1px solid var(--border-primary)',
              borderRadius: '8px',
              color: 'var(--color-pure-white)',
              fontSize: '0.9rem'
            }}
          >
            <option value="all">All Tickets</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="tickets-list">
        {filteredTickets.map(ticket => (
          <div key={ticket._id} className={`ticket-item ${ticket.status}`}>
            <div className="ticket-main">
              <h4>{ticket.title}</h4>
              <div style={{marginTop: '0.5rem'}}>
                <p style={{color: 'var(--color-text-secondary)', margin: '0.25rem 0'}}>
                  <strong>Child:</strong> {ticket.student?.name}
                  {ticket.student?.grade && ` • Grade ${ticket.student.grade}`}
                </p>
                <p style={{color: 'var(--color-text-secondary)', margin: '0.25rem 0'}}>
                  <strong>Subject:</strong> {ticket.queue?.name}
                  {ticket.queue?.teacher && ` • ${ticket.queue.teacher.name}`}
                </p>
                {ticket.description && (
                  <p style={{color: 'var(--color-text-tertiary)', margin: '0.5rem 0 0 0', fontStyle: 'italic'}}>
                    {ticket.description}
                  </p>
                )}
              </div>
            </div>
            <div className="ticket-meta">
              <span className={`status-badge ${ticket.status}`}>
                {ticket.status}
              </span>
              <span style={{color: 'var(--color-text-secondary)', fontSize: '0.875rem'}}>
                {new Date(ticket.createdAt).toLocaleString()}
              </span>
              {ticket.completedAt && (
                <span style={{color: 'var(--color-text-tertiary)', fontSize: '0.875rem'}}>
                  Completed: {new Date(ticket.completedAt).toLocaleDateString()}
                </span>
              )}
              <div style={{display: 'flex', gap: '0.5rem', marginTop: '0.75rem'}}>
                {ticket.status === 'pending' && (
                  <button 
                    className="cancel-btn"
                    onClick={() => onCancelTicket(ticket._id)}
                    style={{fontSize: '0.875rem', padding: '0.5rem 1rem'}}
                  >
                    Cancel
                  </button>
                )}
                <button 
                  className="btn-primary"
                  onClick={() => onContactTeacher(ticket)}
                  style={{fontSize: '0.875rem', padding: '0.5rem 1rem'}}
                >
                  Contact Teacher
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎫</div>
          <h3>No Tickets Found</h3>
          <p>No {filter !== 'all' ? filter : ''} tickets match your criteria.</p>
        </div>
      )}
    </div>
  );
};

// Child Detail Modal
const ChildDetailModal = ({ child, onClose, onJoinQueue, loading }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{child.name}'s Profile</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div style={{display: 'grid', gap: '1rem'}}>
            <div>
              <label><strong>Email:</strong></label>
              <p>{child.email}</p>
            </div>
            <div>
              <label><strong>Grade:</strong></label>
              <p>{child.grade || 'Not specified'}</p>
            </div>
            <div>
              <label><strong>Member Since:</strong></label>
              <p>{new Date(child.createdAt).toLocaleDateString()}</p>
            </div>
            
            <div style={{borderTop: '1px solid var(--border-primary)', paddingTop: '1rem', marginTop: '1rem'}}>
              <h4>Statistics</h4>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem'}}>
                <div className="stat-card">
                  <span className="stat-value">{child.stats?.totalTickets || 0}</span>
                  <span className="stat-label">Total Sessions</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{child.stats?.pendingTickets || 0}</span>
                  <span className="stat-label">Waiting</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{child.stats?.completedTickets || 0}</span>
                  <span className="stat-label">Completed</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{(child.stats?.completionRate || 0).toFixed(1)}%</span>
                  <span className="stat-label">Success Rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          <button className="btn-primary" onClick={onJoinQueue} disabled={loading}>
            {loading ? 'Loading...' : 'Join Queue'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Join Queue Modal
const JoinQueueModal = ({ child, queues, onJoinQueue, onClose, searchQuery, onSearchChange }) => {
  // Filter queues based on search query
  const filteredQueues = queues.filter(queue => {
    const searchLower = (searchQuery || '').toLowerCase();
    const queueName = (queue.name || '').toLowerCase();
    const teacherName = (queue.teacher?.name || '').toLowerCase();
    const serviceType = (queue.serviceType?.name || '').toLowerCase();
    
    return queueName.includes(searchLower) || 
           teacherName.includes(searchLower) ||
           serviceType.includes(searchLower);
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Join Queue for {child.name || child.childName}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p style={{marginBottom: '1rem', color: 'var(--color-text-secondary)'}}>
            Select a queue for your child to join:
          </p>
          
          {/* Search Input */}
          <div style={{marginBottom: '1.5rem'}}>
            <input
              type="text"
              placeholder="🔍 Search by queue name, teacher, or subject..."
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'var(--color-charcoal-dark)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                color: 'var(--color-pure-white)',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Queue List */}
          <div style={{display: 'grid', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto'}}>
            {filteredQueues.length > 0 ? (
              filteredQueues.map(queue => (
                <div key={queue._id} className="queue-option" style={{
                  padding: '1.25rem',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  hoverBackgroundColor: 'rgba(255,255,255,0.05)'
                }}>
                  <div>
                    <h4 style={{margin: '0 0 0.5rem 0', color: 'var(--color-pure-white)', fontSize: '1rem'}}>{queue.name}</h4>
                    <div style={{display: 'grid', gap: '0.35rem'}}>
                      <p style={{margin: '0', fontSize: '0.85rem', color: 'var(--color-text-secondary)'}}>
                        👨‍🏫 Teacher: {queue.admin?.name || queue.teacher?.name || 'N/A'}
                      </p>
                      {queue.serviceType?.name && (
                        <p style={{margin: '0', fontSize: '0.85rem', color: 'var(--color-text-secondary)'}}>
                          📚 Subject: {queue.serviceType.name}
                        </p>
                      )}
                      <p style={{margin: '0', fontSize: '0.85rem', color: 'var(--color-text-tertiary)'}}>
                        ⏳ Students waiting: {queue.waitingTickets || queue.studentCount || 0}
                      </p>
                    </div>
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={() => onJoinQueue(queue._id)}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.6rem 1.2rem',
                      fontSize: '0.9rem',
                      width: '100%',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Join Queue
                  </button>
                </div>
              ))
            ) : queues.length === 0 ? (
              <p style={{color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem'}}>
                No available queues at this time.
              </p>
            ) : (
              <p style={{color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem'}}>
                No queues match your search. Try searching for a different teacher or subject.
              </p>
            )}
          </div>
          
          {/* Results Summary */}
          {queues.length > 0 && (
            <div style={{
              marginTop: '1rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-primary)',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)'
            }}>
              Showing {filteredQueues.length} of {queues.length} queue(s)
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// Add Child Modal
const AddChildModal = ({ onSubmit, onClose, formData, setFormData }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Child</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={onSubmit} className="modal-body">
          <div style={{display: 'grid', gap: '1rem'}}>
            <div>
              <label htmlFor="name"><strong>Child's Name *</strong></label>
              <input
                id="name"
                type="text"
                placeholder="Enter child's full name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--color-charcoal-dark)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--color-pure-white)',
                  marginTop: '0.5rem'
                }}
              />
            </div>

            <div>
              <label htmlFor="email"><strong>Email Address *</strong></label>
              <input
                id="email"
                type="email"
                placeholder="Enter child's email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--color-charcoal-dark)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--color-pure-white)',
                  marginTop: '0.5rem'
                }}
              />
            </div>

            <div>
              <label htmlFor="grade"><strong>Grade Level</strong></label>
              <select
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData({...formData, grade: e.target.value})}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--color-charcoal-dark)',
                  border: '1px solid var(--border-primary)',
                  borderRadius: '8px',
                  color: 'var(--color-pure-white)',
                  marginTop: '0.5rem'
                }}
              >
                <option value="">Select a grade</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add Child
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ParentDashboard;

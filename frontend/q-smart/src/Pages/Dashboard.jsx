// Pages/Dashboard.jsx - COMPLETE VERSION
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { analyticsAPI, queuesAPI, ticketsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import useSocket from "../hooks/useSocket";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, on, off, emit } = useSocket({
    token: localStorage.getItem("token"),
  });

  const [activeTab, setActiveTab] = useState("queues");
  const [queues, setQueues] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joiningQueue, setJoiningQueue] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleTicketCalled = (ticket) => {
      console.log("🔔 Ticket called event received:", ticket);
      setTickets((prev) =>
        prev.map((t) =>
          t._id === ticket._id ? { ...t, status: ticket.status, calledAt: ticket.calledAt } : t
        )
      );
    };

    const handleTicketCompleted = (ticket) => {
      console.log("✅ Ticket completed event received:", ticket);
      setTickets((prev) =>
        prev.map((t) =>
          t._id === ticket._id
            ? { ...t, status: ticket.status, completedAt: ticket.completedAt }
            : t
        )
      );
      // Refresh analytics when ticket is completed
      fetchAnalytics();
    };

    const handleTicketCreated = (ticket) => {
      console.log("📝 New ticket created:", ticket);
      if (ticket.user === user?.id || ticket.user?._id === user?.id) {
        setTickets((prev) => [ticket, ...prev]);
      }
    };

    const handleTicketRemoved = (ticket) => {
      console.log("🗑️ Ticket removed:", ticket);
      setTickets((prev) => prev.filter((t) => t._id !== ticket._id));
    };

    on("ticket-called", handleTicketCalled);
    on("ticket-completed", handleTicketCompleted);
    on("ticket-created", handleTicketCreated);
    on("ticket-removed", handleTicketRemoved);

    return () => {
      off("ticket-called", handleTicketCalled);
      off("ticket-completed", handleTicketCompleted);
      off("ticket-created", handleTicketCreated);
      off("ticket-removed", handleTicketRemoved);
    };
  }, [socket, user, on, off]);

  const fetchAnalytics = async () => {
    try {
      const userRole = user?.role;
      const analyticsPromise =
        userRole === "teacher"
          ? analyticsAPI.getTeacherAnalytics()
          : userRole === "student"
          ? analyticsAPI.getStudentAnalytics()
          : userRole === "parent"
          ? analyticsAPI.getParentAnalytics()
          : analyticsAPI.getSystemAnalytics();

      const analyticsRes = await analyticsPromise;
      const analyticsData =
        analyticsRes?.data?.data?.analytics ?? analyticsRes?.data ?? {};

      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const userRole = user?.role;

      const queuesPromise = queuesAPI.getAll();
      const ticketsPromise = ticketsAPI.getMyTickets();

      // pick analytics call based on role
      const analyticsPromise =
        userRole === "teacher"
          ? analyticsAPI.getTeacherAnalytics()
          : userRole === "student"
          ? analyticsAPI.getStudentAnalytics()
          : userRole === "parent"
          ? analyticsAPI.getParentAnalytics()
          : analyticsAPI.getSystemAnalytics();

      const [queuesRes, ticketsRes, analyticsRes] = await Promise.all([
        queuesPromise,
        ticketsPromise,
        analyticsPromise,
      ]);

      const queuesData = queuesRes?.data?.data?.queues ?? queuesRes?.data ?? [];
      const ticketsData = ticketsRes?.data?.data?.tickets ?? ticketsRes?.data ?? [];
      const analyticsData =
        analyticsRes?.data?.data?.analytics ?? analyticsRes?.data ?? {};

      console.log("📊 Dashboard fetched - Tickets:", ticketsData);
      console.log("📊 Dashboard fetched - Analytics:", analyticsData);
      
      // Log ticket statuses
      if (ticketsData && ticketsData.length > 0) {
        const statusCounts = {};
        ticketsData.forEach(t => {
          statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
        });
        console.log("📋 Ticket Status Breakdown:", statusCounts);
        ticketsData.forEach(t => {
          console.log(`  - Ticket #${t.ticketNumber}: ${t.status}, Queue: ${t.queue?.name}`);
        });
      }

      setQueues(queuesData);
      setTickets(ticketsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQueue = async (queueId) => {
    setJoiningQueue(queueId);
    try {
      const studentInfo = {
        name: user.name,
        grade: user.grade || "N/A",
        studentId: user.studentId || "N/A",
      };

      const response = await queuesAPI.join(queueId, studentInfo);

      if (response.status === 201) {
        const ticket = response.data.data?.ticket || response.data.ticket;
        alert(`✅ Success! Your ticket number is ${ticket.ticketNumber}`);
        await fetchData();
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to join queue";
      alert(`❌ ${message}`);
    } finally {
      setJoiningQueue(null);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    if (window.confirm("Are you sure you want to cancel this ticket?")) {
      try {
        await ticketsAPI.cancelTicket(ticketId);
        await fetchData();
        alert("✅ Ticket cancelled successfully");
      } catch (error) {
        const message =
          error.response?.data?.message || "Failed to cancel ticket";
        alert(`❌ ${message}`);
      }
    }
  };

  const getStudentJoinedQueueIds = () => {
    return tickets
      .filter((t) => ["waiting", "called", "in-progress"].includes(t.status))
      .map((t) => t.queue?._id || t.queue)
      .filter(Boolean);
  };

  // Enhanced tabs for students
  const studentTabs = [
    { id: "queues", label: "📋 Available Queues" },
    { id: "tickets", label: "🎫 My Tickets" },
    { id: "history", label: "📊 My History" },
    { id: "stats", label: "📈 My Stats" },
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Enhanced Header with Quick Stats */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-welcome">
            <h1>Welcome back, {user?.name}! 👋</h1>
            <p>Student Dashboard • Manage your queue tickets</p>
            {error && <div className="error-message">{error}</div>}
            <div className="quick-stats">
              <span className="stat">
                Active Tickets:{" "}
                {
                  tickets.filter((t) =>
                    ["pending", "in-progress"].includes(t.status)
                  ).length
                }
              </span>
              <span className="stat">Total Queues: {queues.length}</span>
              <span className="stat">
                Avg Wait: {analytics?.summary?.avgWaitTime || 0}min
              </span>
            </div>
          </div>
          <div className="user-actions">
            <button className="refresh-btn" onClick={fetchData}>
              🔄 Refresh
            </button>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Enhanced Navigation */}
      <nav className="dashboard-tabs">
        {studentTabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        {activeTab === "queues" && (
          <QueuesSection
            queues={queues}
            joiningQueue={joiningQueue}
            onJoinQueue={handleJoinQueue}
            joinedQueueIds={getStudentJoinedQueueIds()}
            navigate={navigate}
          />
        )}

        {activeTab === "tickets" && (
          <TicketsSection
            tickets={tickets}
            onCancelTicket={handleCancelTicket}
          />
        )}

        {activeTab === "history" && (
          <HistorySection tickets={tickets} analytics={analytics} />
        )}

        {activeTab === "stats" && (
          <StudentStatsSection analytics={analytics} tickets={tickets} />
        )}
      </main>
    </div>
  );
};

// Queues Section Component
const QueuesSection = ({
  queues,
  joiningQueue,
  onJoinQueue,
  joinedQueueIds = [],
  navigate,
}) => {
  if (queues.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No Queues Available</h3>
        <p>There are currently no active queues. Please check back later.</p>
      </div>
    );
  }

  return (
    <div className="queues-section">
      <div className="section-header">
        <h2>Available Queues</h2>
        <p>Join a queue to get help from teachers</p>
      </div>

      <div className="queues-grid">
        {queues.map((queue) => {
          const isJoined = joinedQueueIds.includes(queue._id);

          return (
            <div
              key={queue._id}
              className={`queue-card ${isJoined ? "joined" : ""}`}
              style={
                isJoined ? { borderColor: "#FF9500", borderWidth: "2px" } : {}
              }
            >
              <div className="queue-header">
                <h3>{queue.name}</h3>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  {isJoined && (
                    <span
                      style={{
                        background: "#FF9500",
                        color: "white",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      ✓ JOINED
                    </span>
                  )}
                  <span
                    className={`status ${
                      queue.isActive ? "active" : "inactive"
                    }`}
                  >
                    {queue.isActive ? "🟢 Active" : "🔴 Inactive"}
                  </span>
                </div>
              </div>

              <p className="queue-description">{queue.description}</p>

              <div className="queue-meta">
                <span className="meta-item">
                  <strong>Subject:</strong> {queue.subject || "General"}
                </span>
                <span className="meta-item">
                  <strong>Teacher:</strong> {queue.teacher?.name || "Staff"}
                </span>
                <span className="meta-item">
                  <strong>Waiting:</strong> {queue.waitingStudents || 0}{" "}
                  students
                </span>
                <span className="meta-item">
                  <strong>Avg. Time:</strong> {queue.averageWaitTime || 15} min
                </span>
              </div>

              {isJoined ? (
                <button
                  className="view-details-btn"
                  onClick={() => navigate(`/queue/${queue._id}`)}
                  style={{
                    background: "#FF9500",
                    color: "white",
                    border: "none",
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  👁️ View Details
                </button>
              ) : (
                <button
                  className={`join-btn ${
                    joiningQueue === queue._id ? "loading" : ""
                  }`}
                  onClick={() => onJoinQueue(queue._id)}
                  disabled={!queue.isActive || joiningQueue === queue._id}
                >
                  {joiningQueue === queue._id ? "Joining..." : "Join Queue"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Tickets Section Component
const TicketsSection = ({ tickets, onCancelTicket }) => {
  const activeTickets = tickets.filter((t) =>
    ["waiting", "called", "in-progress"].includes(t.status)
  );
  const completedTickets = tickets.filter((t) => t.status === "completed");
  const cancelledTickets = tickets.filter((t) => t.status === "cancelled");

  if (tickets.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🎫</div>
        <h3>No Tickets Yet</h3>
        <p>Join a queue to create your first ticket!</p>
      </div>
    );
  }

  return (
    <div className="tickets-section">
      <div className="section-header">
        <h2>My Tickets</h2>
        <p>Manage your current and past queue tickets</p>
      </div>

      {/* Active Tickets */}
      {activeTickets.length > 0 && (
        <div className="tickets-group">
          <h3>🔴 Active Tickets ({activeTickets.length})</h3>
          <div className="tickets-list">
            {activeTickets.map((ticket) => {
              const createdTime = new Date(ticket.createdAt);
              const waitMinutes = Math.round(
                (Date.now() - createdTime.getTime()) / 60000
              );
              const statusIcon =
                ticket.status === "waiting"
                  ? "⏳"
                  : ticket.status === "called"
                  ? "📢"
                  : "🔄";

              return (
                <div
                  key={ticket._id}
                  className={`ticket-item ${ticket.status}`}
                >
                  <div className="ticket-main">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <h4>Ticket #{ticket.ticketNumber}</h4>
                      <span className={`status-badge ${ticket.status}`}>
                        {statusIcon} {ticket.status.toUpperCase()}
                      </span>
                    </div>
                    <p
                      className="queue-name"
                      style={{ fontWeight: "bold", marginBottom: "0.5rem" }}
                    >
                      {ticket.queue?.name || "Queue"}
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.75rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      <div>
                        <strong>Position:</strong> {ticket.position || "—"}
                      </div>
                      <div>
                        <strong>Est. Wait:</strong>{" "}
                        {ticket.estimatedWaitTime || "—"} min
                      </div>
                      <div>
                        <strong>Waiting:</strong> {waitMinutes} min
                      </div>
                      <div>
                        <strong>Created:</strong>{" "}
                        {createdTime.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="ticket-meta">
                    {ticket.status === "waiting" && (
                      <button
                        className="cancel-btn"
                        onClick={() => onCancelTicket(ticket._id)}
                        style={{ marginTop: "0.5rem" }}
                      >
                        Cancel Ticket
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Tickets */}
      {completedTickets.length > 0 && (
        <div className="tickets-group">
          <h3>✅ Completed Tickets ({completedTickets.length})</h3>
          <div className="tickets-list">
            {completedTickets.map((ticket) => {
              const createdTime = new Date(ticket.createdAt);
              const completedTime = new Date(ticket.completedAt);
              const waitMinutes = Math.round(
                (completedTime.getTime() - createdTime.getTime()) / 60000
              );

              return (
                <div key={ticket._id} className="ticket-item completed">
                  <div className="ticket-main">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <h4>Ticket #{ticket.ticketNumber}</h4>
                      <span className="status-badge completed">
                        ✅ COMPLETED
                      </span>
                    </div>
                    <p
                      className="queue-name"
                      style={{ fontWeight: "bold", marginBottom: "0.5rem" }}
                    >
                      {ticket.queue?.name || "Queue"}
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.75rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      <div>
                        <strong>Total Wait:</strong> {waitMinutes} min
                      </div>
                      <div>
                        <strong>Created:</strong>{" "}
                        {createdTime.toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Completed:</strong>{" "}
                        {completedTime.toLocaleTimeString()}
                      </div>
                      <div>
                        <strong>Status:</strong> Done
                      </div>
                    </div>
                  </div>
                  <div className="ticket-meta">
                    <span className="status-badge completed">✅ Completed</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled Tickets */}
      {cancelledTickets.length > 0 && (
        <div className="tickets-group">
          <h3>❌ Cancelled Tickets ({cancelledTickets.length})</h3>
          <div className="tickets-list">
            {cancelledTickets.map((ticket) => {
              const createdTime = new Date(ticket.createdAt);

              return (
                <div key={ticket._id} className="ticket-item cancelled">
                  <div className="ticket-main">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <h4>Ticket #{ticket.ticketNumber}</h4>
                      <span className="status-badge cancelled">
                        ❌ CANCELLED
                      </span>
                    </div>
                    <p
                      className="queue-name"
                      style={{ fontWeight: "bold", marginBottom: "0.5rem" }}
                    >
                      {ticket.queue?.name || "Queue"}
                    </p>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "0.75rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      <div>
                        <strong>Created:</strong>{" "}
                        {createdTime.toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Cancelled:</strong>{" "}
                        {createdTime.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="ticket-meta">
                    <span className="status-badge cancelled">❌ Cancelled</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// History Section Component
const HistorySection = ({ tickets, analytics }) => {
  const completedTickets = tickets.filter((t) => t.status === "completed");
  const cancelledTickets = tickets.filter((t) => t.status === "cancelled");

  // Calculate average wait time from completed tickets
  const totalWaitTime = completedTickets.reduce((total, ticket) => {
    if (ticket.completedAt && ticket.createdAt) {
      return (
        total + (new Date(ticket.completedAt) - new Date(ticket.createdAt))
      );
    }
    return total;
  }, 0);
  const avgWaitTime =
    completedTickets.length > 0
      ? Math.round(totalWaitTime / completedTickets.length / 60000)
      : 0;

  // Calculate completion rate
  const allFinishedTickets = completedTickets.length + cancelledTickets.length;
  const completionRate =
    allFinishedTickets > 0
      ? Math.round((completedTickets.length / allFinishedTickets) * 100)
      : 0;

  return (
    <div className="history-section">
      <div className="section-header">
        <h2>My Queue History</h2>
        <p>Track your past queue interactions and performance</p>
      </div>

      {/* Statistics Cards */}
      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{completedTickets.length}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-info">
            <h3>{cancelledTickets.length}</h3>
            <p>Cancelled</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <h3>{avgWaitTime}</h3>
            <p>Avg Wait (min)</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>{completionRate}%</h3>
            <p>Success Rate</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="history-list">
        <h3>Recent Activity</h3>
        {completedTickets.length === 0 && cancelledTickets.length === 0 ? (
          <div className="empty-history">
            <p>No history yet. Join a queue to get started!</p>
          </div>
        ) : (
          <div className="activity-timeline">
            {[...completedTickets, ...cancelledTickets]
              .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
              .slice(0, 10)
              .map((ticket) => (
                <div key={ticket._id} className="history-item">
                  <div className="activity-icon">
                    {ticket.status === "completed" ? "✅" : "❌"}
                  </div>
                  <div className="activity-details">
                    <div className="activity-main">
                      <span className="queue-name">
                        {ticket.queue?.name || "Queue"}
                      </span>
                      <span className="ticket-number">
                        #{ticket.ticketNumber}
                      </span>
                    </div>
                    <div className="activity-meta">
                      <span className="activity-time">
                        {new Date(ticket.updatedAt).toLocaleDateString()} •
                        {ticket.status === "completed"
                          ? "Completed"
                          : "Cancelled"}
                      </span>
                      {ticket.status === "completed" && ticket.completedAt && (
                        <span className="wait-time">
                          Wait:{" "}
                          {Math.round(
                            (new Date(ticket.completedAt) -
                              new Date(ticket.createdAt)) /
                              60000
                          )}
                          min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Student Stats Section Component
const StudentStatsSection = ({ analytics, tickets }) => {
  const [statsLoading, setStatsLoading] = useState(false);

  const refreshStats = async () => {
    setStatsLoading(true);
    try {
      const response = await ticketsAPI.getMyTickets();
      const ticketsData = response?.data?.data?.tickets ?? response?.data ?? [];
      console.log("✅ Stats refreshed - Tickets:", ticketsData);
    } catch (err) {
      console.error("Error refreshing stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Filter tickets by status
  const completedTickets = tickets.filter((t) => t.status === "completed");
  const activeTickets = tickets.filter((t) =>
    ["waiting", "called", "in-progress"].includes(t.status)
  );
  const cancelledTickets = tickets.filter((t) => t.status === "cancelled");
  const waitingTickets = tickets.filter((t) => t.status === "waiting");
  const calledTickets = tickets.filter((t) => t.status === "called");
  const inProgressTickets = tickets.filter((t) => t.status === "in-progress");

  console.log("📊 StudentStatsSection - All tickets count:", tickets.length);
  console.log("📊 StudentStatsSection - All tickets:", tickets);
  console.log("✅ Completed:", completedTickets.length, completedTickets);
  console.log("❌ Cancelled:", cancelledTickets.length, cancelledTickets);
  console.log("⏳ Waiting:", waitingTickets.length);
  console.log("📢 Called:", calledTickets.length);
  console.log("🔄 In Progress:", inProgressTickets.length);
  
  if (tickets.length > 0) {
    console.log("Sample ticket:", {
      id: tickets[0]._id,
      status: tickets[0].status,
      statusType: typeof tickets[0].status,
      ticketNumber: tickets[0].ticketNumber,
      completedAt: tickets[0].completedAt
    });
  }

  const totalWaitTime = completedTickets.reduce((total, ticket) => {
    if (ticket.completedAt && ticket.createdAt) {
      return (
        total +
        (new Date(ticket.completedAt).getTime() -
          new Date(ticket.createdAt).getTime())
      );
    }
    return total;
  }, 0);

  const avgWaitTime =
    completedTickets.length > 0
      ? Math.round(totalWaitTime / completedTickets.length / 60000)
      : 0;

  const completionRate =
    tickets.length > 0
      ? Math.round((completedTickets.length / tickets.length) * 100)
      : 0;

  // Get queue preferences (count by queue)
  const queueCounts = {};
  tickets.forEach((ticket) => {
    const queueName = ticket.queue?.name || "Unknown Queue";
    queueCounts[queueName] = (queueCounts[queueName] || 0) + 1;
  });

  const queuePreferences = Object.entries(queueCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / tickets.length) * 100),
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="stats-section">
      <div className="section-header">
        <div style={{ flex: 1 }}>
        <h2>My Performance Analytics</h2>
        <p>Comprehensive insights into your queue usage and performance</p>
      </div>
        <button
          onClick={refreshStats}
          disabled={statsLoading}
          style={{
            padding: "0.75rem 1.5rem",
            background: "var(--color-electric-green)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.9rem",
          }}
        >
          {statsLoading ? "🔄 Refreshing..." : "🔄 Refresh Stats"}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="stats-overview">
        <div className="stat-card large">
          <h3>📊 Overall Performance</h3>
          <div className="performance-metrics">
            <div className="metric">
              <span className="value">{tickets.length}</span>
              <span className="label">Total Tickets</span>
            </div>
            <div className="metric">
              <span className="value">{completedTickets.length}</span>
              <span className="label">Completed ✅</span>
            </div>
            <div className="metric">
              <span className="value">{cancelledTickets.length}</span>
              <span className="label">Cancelled ❌</span>
            </div>
            <div className="metric">
              <span className="value">{activeTickets.length}</span>
              <span className="label">Active 🔴</span>
            </div>
            <div className="metric">
              <span className="value">{avgWaitTime}</span>
              <span className="label">Avg Wait (min)</span>
            </div>
            <div className="metric">
              <span className="value">{completionRate}%</span>
              <span className="label">Completion Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>📊 Ticket Status Distribution</h3>
          <div className="status-distribution">
            {[
              { status: "waiting", label: "⏳ Waiting", count: waitingTickets.length },
              { status: "called", label: "📢 Called", count: calledTickets.length },
              { status: "in-progress", label: "🔄 In Progress", count: inProgressTickets.length },
              { status: "completed", label: "✅ Completed", count: completedTickets.length },
              { status: "cancelled", label: "❌ Cancelled", count: cancelledTickets.length },
            ].map(({ status, label, count }) => {
              const percentage =
                tickets.length > 0 ? (count / tickets.length) * 100 : 0;

              return (
                <div key={status} className="status-item">
                  <span className="status-label">{label}</span>
                  <div className="status-bar">
                    <div
                      className={`status-fill ${status}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="status-count">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="analytics-card">
          <h3>Recent Performance</h3>
          <div className="recent-stats">
            <div className="recent-stat">
              <span className="label">This Week</span>
              <span className="value">
                {
                  tickets.filter(
                    (t) =>
                      new Date(t.createdAt) >
                      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length
                }
              </span>
            </div>
            <div className="recent-stat">
              <span className="label">Completion Rate</span>
              <span className="value">
                {tickets.length > 0
                  ? ((completedTickets.length / tickets.length) * 100).toFixed(
                      0
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="recent-stat">
              <span className="label">Avg Response Time</span>
              <span className="value">{avgWaitTime} min</span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>📚 Favorite Queues</h3>
          <div className="queue-preferences">
            {queuePreferences.length > 0 ? (
              queuePreferences.map((pref, index) => (
                <div key={index} className="preference-item">
                  <span className="queue-name">{pref.name}</span>
                  <div className="preference-bar">
                    <div
                      className="fill"
                      style={{ width: `${pref.percentage}%` }}
                    ></div>
                  </div>
                  <span className="count">
                    {pref.count} ({pref.percentage}%)
                  </span>
                </div>
              ))
            ) : (
              <div className="no-data">
                <p>No queue data available yet. Join a queue to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="activity-timeline-section">
        <h3>Recent Activity Timeline</h3>
        <div className="timeline">
          {tickets
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map((ticket, index) => (
              <div key={ticket._id} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="queue-name">{ticket.queue?.name}</span>
                    <span className={`status ${ticket.status}`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="timeline-description">
                    {ticket.title || `Ticket #${ticket.ticketNumber}`}
                  </p>
                  <span className="timeline-time">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

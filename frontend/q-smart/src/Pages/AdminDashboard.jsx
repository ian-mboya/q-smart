// Pages/AdminDashboard.jsx - ENHANCED WITH FULL ADMIN OPERATIONS
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { adminAPI, analyticsAPI, queuesAPI } from "../services/api";
import { generateExcelReport, generatePDFReport, generateReportSummary } from "../services/reportingService";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [systemStats, setSystemStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [queues, setQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // User Management State
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    phone: "",
  });

  // Queue Management State
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [editingQueue, setEditingQueue] = useState(null);
  const [queueFormData, setQueueFormData] = useState({
    name: "",
    serviceType: "",
    location: "",
    description: "",
    isActive: true,
  });

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState([]);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // View Mode State
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users;

    if (userSearch) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase())
      );
    }

    if (userRoleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === userRoleFilter);
    }

    if (userStatusFilter !== "all") {
      filtered = filtered.filter((u) =>
        userStatusFilter === "active" ? u.isActive : !u.isActive
      );
    }

    setFilteredUsers(filtered);
  }, [users, userSearch, userRoleFilter, userStatusFilter]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsResponse, usersResponse, analyticsResponse, queuesResponse] =
        await Promise.all([
          adminAPI.getDashboardStats(),
          adminAPI.getUsers(),
          analyticsAPI.getSystemAnalytics(),
          queuesAPI.getAll(),
        ]);

      const mergedStats = {
        ...(statsResponse.data?.data || {}),
        ...analyticsResponse.data?.data,
      };
      
      setSystemStats(mergedStats);
      setUsers(usersResponse.data?.data?.users || []);
      setQueues(queuesResponse.data?.data?.queues || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
      setError("Failed to load admin dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // User Management Functions
  const handleAddUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: "",
      email: "",
      password: "",
      role: "student",
      phone: "",
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      phone: user.phone || "",
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      if (!userFormData.name || !userFormData.email) {
        setError("Name and email are required");
        return;
      }

      if (editingUser) {
        await adminAPI.updateUser(editingUser._id, {
          name: userFormData.name,
          email: userFormData.email,
          role: userFormData.role,
          phone: userFormData.phone,
        });
        setSuccess("User updated successfully");
      } else {
        if (!userFormData.password) {
          setError("Password is required for new users");
          return;
        }
        await adminAPI.createUser(userFormData);
        setSuccess("User created successfully");
      }
      setShowUserModal(false);
      fetchAdminData();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save user");
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      await adminAPI.updateUser(user._id, { isActive: !user.isActive });
      setSuccess(
        `User ${!user.isActive ? "activated" : "deactivated"} successfully`
      );
      fetchAdminData();
    } catch (error) {
      setError("Failed to update user status");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await adminAPI.deleteUser(userId);
      setSuccess("User deleted successfully");
      fetchAdminData();
    } catch (error) {
      setError("Failed to delete user");
    }
  };

  const handleBulkExportUsers = () => {
    const csv = [
      ["ID", "Name", "Email", "Role", "Status", "Joined"],
      ...filteredUsers.map((u) => [
        u._id,
        u.name,
        u.email,
        u.role,
        u.isActive ? "Active" : "Inactive",
        new Date(u.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Queue Management Functions
  const handleAddQueue = () => {
    setEditingQueue(null);
    setQueueFormData({
      name: "",
      subject: "",
      description: "",
      capacity: 50,
      status: "active",
    });
    setShowQueueModal(true);
  };

  const handleEditQueue = (queue) => {
    setEditingQueue(queue);
    setQueueFormData({
      name: queue.name,
      subject: queue.subject,
      description: queue.description || "",
      capacity: queue.capacity || 50,
      status: queue.status || "active",
    });
    setShowQueueModal(true);
  };

  const handleSaveQueue = async () => {
    try {
      if (!queueFormData.name || !queueFormData.serviceType) {
        setError("Name and serviceType are required");
        return;
      }

      if (editingQueue) {
        await queuesAPI.update(editingQueue._id, queueFormData);
        setSuccess("Queue updated successfully");
      } else {
        await queuesAPI.create(queueFormData);
        setSuccess("Queue created successfully");
      }
      setShowQueueModal(false);
      fetchAdminData();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save queue");
    }
  };

  const handleDeleteQueue = async (queueId) => {
    if (!window.confirm("Are you sure you want to delete this queue?")) return;

    try {
      await queuesAPI.delete(queueId);
      setSuccess("Queue deleted successfully");
      fetchAdminData();
    } catch (error) {
      setError("Failed to delete queue");
    }
  };

  // Reporting Functions
  const handleExportExcel = () => {
    try {
      if (!systemStats) {
        setError("System stats not loaded yet");
        return;
      }
      generateExcelReport(systemStats, users, queues);
      setSuccess("Excel report generated and downloaded");
    } catch (error) {
      console.error("Error generating Excel report:", error);
      setError("Failed to generate Excel report");
    }
  };

  const handleExportPDF = () => {
    try {
      if (!systemStats) {
        setError("System stats not loaded yet");
        return;
      }
      generatePDFReport(systemStats, users, queues);
      setSuccess("PDF report generated and downloaded");
    } catch (error) {
      console.error("Error generating PDF report:", error);
      setError("Failed to generate PDF report");
    }
  };

  const handleExportSummary = () => {
    try {
      if (!systemStats) {
        setError("System stats not loaded yet");
        return;
      }
      const summary = generateReportSummary(systemStats, users, queues);
      const dataStr = JSON.stringify(summary, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Q-Smart_Summary_${new Date().getTime()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setSuccess("Summary report generated and downloaded");
    } catch (error) {
      console.error("Error generating summary:", error);
      setError("Failed to generate summary");
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard admin-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-welcome">
            <h1>Admin Console, {user?.name}! ⚙️</h1>
            <p>Manage the entire Q-Smart system</p>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            {systemStats?.overview && (
              <div className="quick-stats">
                <span className="stat">
                  Total Users: {systemStats.overview.totalUsers}
                </span>
                <span className="stat">
                  Active Tickets: {systemStats.overview.activeTickets}
                </span>
                <span className="stat">
                  System Uptime: {systemStats.performance?.systemUptime || 99.8}
                  %
                </span>
              </div>
            )}
            <span className="role-badge role-admin">ADMINISTRATOR</span>
          </div>
          <div className="user-actions">
            <button className="refresh-btn" onClick={fetchAdminData}>
              🔄 Refresh
            </button>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 System Overview
        </button>
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 User Management ({users.length})
        </button>
        <button
          className={`tab ${activeTab === "queues" ? "active" : ""}`}
          onClick={() => setActiveTab("queues")}
        >
          📋 System Queues ({systemStats?.overview?.totalQueues || 0})
        </button>
        <button
          className={`tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          📈 Analytics
        </button>
        <button
          className={`tab ${activeTab === "reporting" ? "active" : ""}`}
          onClick={() => setActiveTab("reporting")}
        >
          📄 Strategic Reports
        </button>
      </nav>

      {/* Main Content */}
      <main className="dashboard-content">
        {activeTab === "overview" && (
          <OverviewSection systemStats={systemStats} />
        )}

        {activeTab === "users" && (
          <UsersSection
            filteredUsers={filteredUsers}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            userRoleFilter={userRoleFilter}
            setUserRoleFilter={setUserRoleFilter}
            userStatusFilter={userStatusFilter}
            setUserStatusFilter={setUserStatusFilter}
            onAddUser={handleAddUser}
            onEditUser={handleEditUser}
            onToggleStatus={handleToggleUserStatus}
            onDeleteUser={handleDeleteUser}
            onExport={handleBulkExportUsers}
            userDistribution={systemStats?.userDistribution}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        )}

        {activeTab === "queues" && (
          <QueuesSection
            queues={queues}
            onAddQueue={handleAddQueue}
            onEditQueue={handleEditQueue}
            onDeleteQueue={handleDeleteQueue}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsSection systemStats={systemStats} />
        )}

        {activeTab === "reporting" && (
          <ReportingSection
            systemStats={systemStats}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            onExportSummary={handleExportSummary}
          />
        )}
      </main>

      {/* User Modal */}
      {showUserModal && (
        <Modal onClose={() => setShowUserModal(false)}>
          <div className="modal-content">
            <h2>{editingUser ? "Edit User" : "Create New User"}</h2>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={userFormData.name}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, name: e.target.value })
                }
                placeholder="User name"
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={userFormData.email}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, email: e.target.value })
                }
                placeholder="user@example.com"
              />
            </div>
            {!editingUser && (
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) =>
                    setUserFormData({
                      ...userFormData,
                      password: e.target.value,
                    })
                  }
                  placeholder="Password"
                />
              </div>
            )}
            <div className="form-group">
              <label>Role</label>
              <select
                value={userFormData.role}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, role: e.target.value })
                }
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                value={userFormData.phone}
                onChange={(e) =>
                  setUserFormData({ ...userFormData, phone: e.target.value })
                }
                placeholder="+254 XXX XXX XXX"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSaveUser}>
                {editingUser ? "Update" : "Create"} User
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowUserModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Queue Modal */}
      {showQueueModal && (
        <Modal onClose={() => setShowQueueModal(false)}>
          <div className="modal-content">
            <h2>{editingQueue ? "Edit Queue" : "Create New Queue"}</h2>
            <div className="form-group">
              <label>Queue Name</label>
              <input
                type="text"
                value={queueFormData.name}
                onChange={(e) =>
                  setQueueFormData({ ...queueFormData, name: e.target.value })
                }
                placeholder="e.g., Math Help Queue"
              />
            </div>
            <div className="form-group">
              <label>Service Type (Subject)</label>
              <input
                type="text"
                value={queueFormData.serviceType}
                onChange={(e) =>
                  setQueueFormData({
                    ...queueFormData,
                    serviceType: e.target.value,
                  })
                }
                placeholder="e.g., Mathematics"
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={queueFormData.location}
                onChange={(e) =>
                  setQueueFormData({
                    ...queueFormData,
                    location: e.target.value,
                  })
                }
                placeholder="e.g., Room 101"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={queueFormData.description}
                onChange={(e) =>
                  setQueueFormData({
                    ...queueFormData,
                    description: e.target.value,
                  })
                }
                placeholder="Queue description..."
                rows="3"
              />
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={queueFormData.isActive}
                  onChange={(e) =>
                    setQueueFormData({
                      ...queueFormData,
                      isActive: e.target.checked,
                    })
                  }
                />
                Active Queue
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSaveQueue}>
                {editingQueue ? "Update" : "Create"} Queue
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowQueueModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Modal Component
const Modal = ({ onClose, children }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

// Overview Section Component
const OverviewSection = ({ systemStats }) => {
  if (!systemStats) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <h3>No System Data</h3>
        <p>System statistics are not available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="overview-section">
      <div className="section-header">
        <h2>System Overview</h2>
        <p>Real-time monitoring of the Q-Smart platform</p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card large">
          <h3>Platform Statistics</h3>
          <div className="metric-content">
            <div className="metric-item">
              <span className="label">Total Users</span>
              <span className="value">
                {systemStats.overview?.totalUsers || 0}
              </span>
            </div>
            <div className="metric-item">
              <span className="label">Active Queues</span>
              <span className="value">
                {systemStats.overview?.totalQueues || 0}
              </span>
            </div>
            <div className="metric-item">
              <span className="label">Total Tickets</span>
              <span className="value">
                {systemStats.overview?.totalTickets || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>Performance</h3>
          <div className="metric-content">
            <div className="metric-item">
              <span className="label">System Uptime</span>
              <span className="value">
                {systemStats.performance?.systemUptime || 99.8}%
              </span>
            </div>
            <div className="metric-item">
              <span className="label">Avg Response Time</span>
              <span className="value">
                {systemStats.performance?.avgTicketResolution || 0}m
              </span>
            </div>
            <div className="metric-item">
              <span className="label">Peak Usage</span>
              <span className="value">
                {systemStats.performance?.peakUsageHours?.[0]?.hour || 0}:00
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Grid */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>User Distribution</h3>
          <div className="distribution-list">
            {systemStats.userDistribution &&
              Object.entries(systemStats.userDistribution).map(
                ([role, count]) => (
                  <div key={role} className="distribution-item">
                    <span className="role">
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </span>
                    <div className="distribution-bar">
                      <div
                        className="distribution-fill"
                        style={{
                          width: `${
                            (count / systemStats.overview.totalUsers) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="count">{count}</span>
                  </div>
                )
              )}
          </div>
        </div>

        <div className="analytics-card">
          <h3>Ticket Status</h3>
          <div className="status-distribution">
            {systemStats.ticketDistribution &&
              Object.entries(systemStats.ticketDistribution).map(
                ([status, count]) => (
                  <div key={status} className="status-item">
                    <span className="status-label">{status}</span>
                    <div className="status-bar">
                      <div
                        className={`status-fill ${status}`}
                        style={{
                          width: `${
                            (count / systemStats.overview.totalTickets) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <span className="status-count">{count}</span>
                  </div>
                )
              )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent System Activity</h3>
        <div className="activity-timeline">
          {systemStats.recentActivity?.slice(0, 6).map((activity) => (
            <div key={activity._id} className="history-item">
              <div className="activity-icon">
                {activity.status === "completed"
                  ? "✅"
                  : activity.status === "pending"
                  ? "⏳"
                  : "📝"}
              </div>
              <div className="activity-details">
                <div className="activity-main">
                  <span className="service-name">{activity.title}</span>
                  <span className="ticket-number">{activity.queue?.name}</span>
                </div>
                <div className="completion-info">
                  <span className="completion-time">
                    {activity.student?.name}
                  </span>
                  <span className="wait-time">
                    {new Date(activity.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <span className={`status-badge ${activity.status}`}>
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Users Section Component
const UsersSection = ({
  filteredUsers,
  userSearch,
  setUserSearch,
  userRoleFilter,
  setUserRoleFilter,
  userStatusFilter,
  setUserStatusFilter,
  onAddUser,
  onEditUser,
  onToggleStatus,
  onDeleteUser,
  onExport,
  userDistribution,
  viewMode,
  setViewMode,
}) => {
  return (
    <div className="users-section">
      <div className="section-header">
        <h2>User Management</h2>
        <p>Manage all system users and permissions</p>
      </div>

      {/* User Statistics */}
      {userDistribution && (
        <div className="history-stats">
          {Object.entries(userDistribution).map(([role, count]) => (
            <div key={role} className="stat-card">
              <div className="stat-icon">
                {role === "student"
                  ? "👨‍🎓"
                  : role === "teacher"
                  ? "👨‍🏫"
                  : role === "parent"
                  ? "👨‍👩‍👧‍👦"
                  : "⚙️"}
              </div>
              <div className="stat-info">
                <h3>{count}</h3>
                <p>{role.charAt(0).toUpperCase() + role.slice(1)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters and Actions */}
      <div className="users-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="🔍 Search by name or email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
        </div>

        <div className="filters">
          <select
            value={userRoleFilter}
            onChange={(e) => setUserRoleFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="parent">Parents</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={userStatusFilter}
            onChange={(e) => setUserStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="bulk-actions">
          <button className="btn-primary" onClick={onAddUser}>
            ➕ Add User
          </button>
          <button className="btn-secondary" onClick={onExport}>
            📥 Export CSV
          </button>
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
              title="Grid view"
            >
              ⊞ Grid
            </button>
            <button
              className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
              title="List view"
            >
              ☰ List
            </button>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div
        className={`queues-grid ${
          viewMode === "list" ? "list-view" : "grid-view"
        }`}
      >
        {filteredUsers.slice(0, 12).map((user) => (
          <div key={user._id} className="queue-card">
            <div className="queue-header">
              <h3>{user.name}</h3>
              <span className={`role-badge role-${user.role}`}>
                {user.role}
              </span>
            </div>
            <div className="queue-description">
              <strong>Email:</strong> {user.email}
              {user.phone && (
                <>
                  <br />
                  <strong>Phone:</strong> {user.phone}
                </>
              )}
            </div>
            <div className="queue-meta">
              <span className="meta-item">
                <strong>Status:</strong>{" "}
                <span
                  className={
                    user.isActive ? "status active" : "status inactive"
                  }
                >
                  {user.isActive ? "Active" : "Inactive"}
                </span>
              </span>
              <span className="meta-item">
                <strong>Joined:</strong>{" "}
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div
              className="user-actions"
              style={{ display: "flex", gap: "0.5rem" }}
            >
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={() => onEditUser(user)}
              >
                Edit
              </button>
              <button
                className="cancel-btn"
                style={{ flex: 1 }}
                onClick={() => onToggleStatus(user)}
              >
                {user.isActive ? "Deactivate" : "Activate"}
              </button>
              <button
                className="delete-btn"
                style={{ flex: 0.8 }}
                onClick={() => onDeleteUser(user._id)}
                title="Delete user"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No Users Found</h3>
          <p>Try adjusting your search filters.</p>
        </div>
      )}
    </div>
  );
};

// Queues Section Component
const QueuesSection = ({
  queues,
  onAddQueue,
  onEditQueue,
  onDeleteQueue,
  viewMode,
  setViewMode,
}) => {
  return (
    <div className="queues-section">
      <div className="section-header">
        <h2>System Queue Management</h2>
        <p>Monitor and manage all queues in the system</p>
      </div>

      {/* Add Queue Button */}
      <div className="section-actions">
        <button className="btn-primary" onClick={onAddQueue}>
          ➕ Create New Queue
        </button>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
            onClick={() => setViewMode("grid")}
            title="Grid view"
          >
            ⊞ Grid
          </button>
          <button
            className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
            onClick={() => setViewMode("list")}
            title="List view"
          >
            ☰ List
          </button>
        </div>
      </div>

      {/* Queue Statistics */}
      {queues && queues.length > 0 ? (
        <div
          className={`queues-grid ${
            viewMode === "list" ? "list-view" : "grid-view"
          }`}
        >
          {queues.map((queue) => (
            <div key={queue._id} className="queue-card">
              <div className="queue-header">
                <h3>{queue.name}</h3>
                <span className={`status ${queue.status || "active"}`}>
                  {queue.status || "Active"}
                </span>
              </div>
              <div className="queue-description">
                <strong>Subject:</strong> {queue.subject}
                <br />
                <strong>Description:</strong> {queue.description || "N/A"}
              </div>
              <div className="queue-meta">
                <span className="meta-item">
                  <strong>Capacity:</strong> {queue.capacity || 50}
                </span>
                <span className="meta-item">
                  <strong>Total Tickets:</strong> {queue.totalTickets || 0}
                </span>
                <span className="meta-item">
                  <strong>Active:</strong> {queue.activeTickets || 0}
                </span>
              </div>
              <div
                className="user-actions"
                style={{ display: "flex", gap: "0.5rem" }}
              >
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => onEditQueue(queue)}
                >
                  Edit
                </button>
                <button
                  className="cancel-btn"
                  style={{ flex: 1 }}
                  onClick={() => onDeleteQueue(queue._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Active Queues</h3>
          <p>Create your first queue to get started.</p>
        </div>
      )}
    </div>
  );
};

// Analytics Section Component
const AnalyticsSection = ({ systemStats }) => {
  return (
    <div className="analytics-section">
      <div className="section-header">
        <h2>System Analytics</h2>
        <p>Comprehensive analytics and insights</p>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Performance Metrics</h3>
          <div className="metric-content">
            <div className="metric-item">
              <span className="label">System Uptime</span>
              <span className="value">
                {systemStats?.performance?.systemUptime || 99.8}%
              </span>
            </div>
            <div className="metric-item">
              <span className="label">Avg Resolution Time</span>
              <span className="value">
                {systemStats?.performance?.avgTicketResolution || 0}m
              </span>
            </div>
            <div className="metric-item">
              <span className="label">Peak Usage Hour</span>
              <span className="value">
                {systemStats?.performance?.peakUsageHours?.[0]?.hour || 0}:00
              </span>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Usage Statistics</h3>
          <div className="metric-content">
            <div className="metric-item">
              <span className="label">Total Sessions</span>
              <span className="value">
                {systemStats?.overview?.totalTickets || 0}
              </span>
            </div>
            <div className="metric-item">
              <span className="label">Active Now</span>
              <span className="value">
                {systemStats?.overview?.activeTickets || 0}
              </span>
            </div>
            <div className="metric-item">
              <span className="label">Completion Rate</span>
              <span className="value">
                {systemStats?.ticketDistribution?.completed
                  ? Math.round(
                      (systemStats.ticketDistribution.completed /
                        systemStats.overview.totalTickets) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-card">
        <h3>Hourly Usage Pattern</h3>
        <div className="peak-hours">
          {systemStats?.performance?.peakUsageHours?.map((hour, index) => (
            <div key={index} className="peak-hour">
              <span className="time">{hour.hour}:00</span>
              <div className="bar-container">
                <div
                  className="bar"
                  style={{
                    height: `${
                      (hour.ticketCount /
                        Math.max(
                          ...systemStats.performance.peakUsageHours.map(
                            (h) => h.ticketCount
                          )
                        )) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
              <span className="count">{hour.ticketCount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Strategic Reporting Section Component
const ReportingSection = ({ systemStats, onExportPDF, onExportExcel, onExportSummary }) => {
  return (
    <div className="reporting-section">
      <div className="section-header">
        <h2>Strategic Reporting & Analytics Export</h2>
        <p>Generate comprehensive reports for stakeholder analysis and decision-making</p>
      </div>

      {/* Report Format Options */}
      <div className="report-formats">
        <div className="format-card">
          <div className="format-icon">📊</div>
          <h3>Excel Report</h3>
          <p>Multi-sheet workbook with detailed analytics, user data, and queue performance metrics</p>
          <ul className="data-points">
            <li>✓ Executive Summary Dashboard</li>
            <li>✓ Complete User Directory</li>
            <li>✓ Queue Performance Analysis</li>
            <li>✓ System Performance Metrics</li>
          </ul>
          <button className="btn-primary report-btn" onClick={onExportExcel}>
            📥 Download Excel (.xlsx)
          </button>
        </div>

        <div className="format-card">
          <div className="format-icon">📑</div>
          <h3>PDF Report</h3>
          <p>Professional formatted PDF with styled charts, metrics, and visual analytics</p>
          <ul className="data-points">
            <li>✓ Executive Summary</li>
            <li>✓ User Distribution Charts</li>
            <li>✓ Queue Performance Summary</li>
            <li>✓ Peak Usage Analysis</li>
          </ul>
          <button className="btn-primary report-btn" onClick={onExportPDF}>
            📄 Download PDF (.pdf)
          </button>
        </div>

        <div className="format-card">
          <div className="format-icon">📋</div>
          <h3>Summary Report</h3>
          <p>Lightweight JSON format with key performance indicators and metrics</p>
          <ul className="data-points">
            <li>✓ KPI Summary</li>
            <li>✓ User Statistics</li>
            <li>✓ Queue Metrics</li>
            <li>✓ Performance Indicators</li>
          </ul>
          <button className="btn-primary report-btn" onClick={onExportSummary}>
            📋 Download Summary (.json)
          </button>
        </div>
      </div>

      {/* Key Metrics Preview */}
      <div className="report-preview">
        <h3>Report Data Points</h3>
        <div className="metrics-grid">
          <div className="metric-preview">
            <span className="label">System Overview</span>
            <div className="items">
              <div>Total Users: {systemStats?.overview?.totalUsers || 0}</div>
              <div>Total Queues: {systemStats?.overview?.totalQueues || 0}</div>
              <div>Total Tickets: {systemStats?.overview?.totalTickets || 0}</div>
              <div>Active Tickets: {systemStats?.overview?.activeTickets || 0}</div>
            </div>
          </div>

          <div className="metric-preview">
            <span className="label">Performance Metrics</span>
            <div className="items">
              <div>System Uptime: {systemStats?.performance?.systemUptime || 99.8}%</div>
              <div>Avg Resolution: {systemStats?.performance?.avgTicketResolution || 0}m</div>
              <div>
                Completion Rate:{" "}
                {systemStats?.overview?.totalTickets > 0
                  ? (
                      ((systemStats?.ticketDistribution?.completed || 0) /
                        systemStats?.overview?.totalTickets) *
                      100
                    ).toFixed(2)
                  : 0}
                %
              </div>
              <div>Peak Hour: {systemStats?.performance?.peakUsageHours?.[0]?.hour || 0}:00</div>
            </div>
          </div>

          <div className="metric-preview">
            <span className="label">User Distribution</span>
            <div className="items">
              {systemStats?.userDistribution
                ? Object.entries(systemStats.userDistribution).map(([role, count]) => (
                    <div key={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}: {count}
                    </div>
                  ))
                : null}
            </div>
          </div>

          <div className="metric-preview">
            <span className="label">Ticket Distribution</span>
            <div className="items">
              {systemStats?.ticketDistribution
                ? Object.entries(systemStats.ticketDistribution).map(([status, count]) => (
                    <div key={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}: {count}
                    </div>
                  ))
                : null}
            </div>
          </div>
        </div>
      </div>

      {/* Report Information */}
      <div className="report-info">
        <h3>Report Contents</h3>
        <div className="info-grid">
          <div className="info-card">
            <h4>Executive Summary</h4>
            <p>High-level overview of system performance, user metrics, and operational KPIs</p>
          </div>
          <div className="info-card">
            <h4>User Management Analysis</h4>
            <p>Comprehensive user directory with roles, activity status, and registration dates</p>
          </div>
          <div className="info-card">
            <h4>Queue Performance</h4>
            <p>Queue utilization metrics, capacity analysis, and ticket distribution per queue</p>
          </div>
          <div className="info-card">
            <h4>Performance Benchmarking</h4>
            <p>System uptime, resolution times, completion rates, and SLA compliance metrics</p>
          </div>
          <div className="info-card">
            <h4>Usage Patterns</h4>
            <p>Peak hour analysis, ticket trends, and temporal usage distribution</p>
          </div>
          <div className="info-card">
            <h4>Stakeholder Ready</h4>
            <p>Professional formatting suitable for management presentations and board reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

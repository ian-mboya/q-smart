// Pages/TeacherDashboard.jsx - FIXED VERSION
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  teacherAPI,
  analyticsAPI,
  queuesAPI,
  ticketsAPI,
} from "../services/api";
import useSocket from "../hooks/useSocket";
import "./Dashboard.css";

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("my-queues");
  const [queues, setQueues] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [callingQueue, setCallingQueue] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [manageQueue, setManageQueue] = useState(null);

  const { socket, connected, on, off, emit } = useSocket({
    token: localStorage.getItem("token"),
  });

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    if (!socket || !queues?.length) return;

    queues.forEach((q) => {
      if (q?._id) emit("joinQueue", { queueId: q._id });
    });

    const ensureStats = (q) => ({
      pendingTickets: 0,
      inProgressTickets: 0,
      completedTickets: 0,
      totalTickets: 0,
      avgWaitTime: 0,
      ...(q.stats || {}),
    });

    const applyQueueUpdate = (updatedQueue) => {
      setQueues((prev) =>
        prev.map((q) =>
          String(q._id) === String(updatedQueue._id)
            ? {
                ...q,
                ...updatedQueue,
                stats: { ...ensureStats(q), ...(updatedQueue.stats || {}) },
              }
            : q
        )
      );
    };

    const handleTicketCreated = (ticket) => {
      setQueues((prev) =>
        prev.map((q) => {
          if (String(q._id) !== String(ticket.queue)) return q;
          const stats = ensureStats(q);
          stats.pendingTickets = (stats.pendingTickets || 0) + 1;
          stats.totalTickets = (stats.totalTickets || 0) + 1;
          return { ...q, stats };
        })
      );
    };

    const handleTicketCalled = (ticket) => {
      setQueues((prev) =>
        prev.map((q) => {
          if (String(q._id) !== String(ticket.queue)) return q;
          const stats = ensureStats(q);
          stats.pendingTickets = Math.max((stats.pendingTickets || 0) - 1, 0);
          stats.inProgressTickets = (stats.inProgressTickets || 0) + 1;
          return { ...q, stats };
        })
      );
    };

    const handleTicketCompleted = (ticket) => {
      setQueues((prev) =>
        prev.map((q) => {
          if (String(q._id) !== String(ticket.queue)) return q;
          const stats = ensureStats(q);
          stats.inProgressTickets = Math.max(
            (stats.inProgressTickets || 0) - 1,
            0
          );
          stats.completedTickets = (stats.completedTickets || 0) + 1;
          return { ...q, stats };
        })
      );
    };

    const handleTicketRemoved = (ticket) => {
      setQueues((prev) =>
        prev.map((q) => {
          if (String(q._id) !== String(ticket.queue)) return q;
          const stats = ensureStats(q);
          const status = ticket.status;
          if (/waiting|pending/i.test(status))
            stats.pendingTickets = Math.max((stats.pendingTickets || 0) - 1, 0);
          else if (/in[-_ ]?progress|called/i.test(status))
            stats.inProgressTickets = Math.max(
              (stats.inProgressTickets || 0) - 1,
              0
            );
          stats.totalTickets = Math.max((stats.totalTickets || 0) - 1, 0);
          return { ...q, stats };
        })
      );
    };

    const handleTicketUpdated = (ticket) => {
      if (
        ticket.queue &&
        typeof ticket.queue === "object" &&
        ticket.queue._id
      ) {
        applyQueueUpdate(ticket.queue);
        return;
      }
      if (ticket.stats && ticket.queue) {
        setQueues((prev) =>
          prev.map((q) =>
            String(q._id) === String(ticket.queue)
              ? { ...q, stats: { ...ensureStats(q), ...ticket.stats } }
              : q
          )
        );
        return;
      }
    };

    const handleQueueUpdated = (updatedQueue) => {
      applyQueueUpdate(updatedQueue);
    };

    on("ticket-created", handleTicketCreated);
    on("ticket-called", handleTicketCalled);
    on("ticket-completed", handleTicketCompleted);
    on("ticket-removed", handleTicketRemoved);
    on("ticket-updated", handleTicketUpdated);
    on("queue-updated", handleQueueUpdated);

    return () => {
      queues.forEach((q) => {
        if (q?._id) emit("leaveQueue", { queueId: q._id });
      });
      off("ticket-created", handleTicketCreated);
      off("ticket-called", handleTicketCalled);
      off("ticket-completed", handleTicketCompleted);
      off("ticket-removed", handleTicketRemoved);
      off("ticket-updated", handleTicketUpdated);
      off("queue-updated", handleQueueUpdated);
    };
  }, [socket, queues, emit, on, off]);

  // HELPER FUNCTION: Extract service type display name
  const getServiceTypeName = (serviceType) => {
    if (!serviceType) return "General";
    if (typeof serviceType === "string") return serviceType;
    if (typeof serviceType === "object" && serviceType.name)
      return serviceType.name;
    return "General";
  };

  const fetchTeacherData = useCallback(async () => {
    try {
      setLoading(true);
      const [activeQueuesResponse, pausedQueuesResponse, analyticsResponse] =
        await Promise.all([
          teacherAPI.getMyQueues(true),
          teacherAPI.getPausedQueues(),
          analyticsAPI.getTeacherAnalytics(),
        ]);

      const activeQueuesData =
        activeQueuesResponse?.data?.data?.queues ??
        activeQueuesResponse?.data ??
        [];
      const pausedQueuesData =
        pausedQueuesResponse?.data?.data?.queues ??
        pausedQueuesResponse?.data ??
        [];

      const allQueuesData = [...activeQueuesData, ...pausedQueuesData];

      const transformedQueues = allQueuesData.map((queue) => ({
        ...queue,
        stats: {
          pendingTickets:
            queue.waitingStudents || queue.stats?.pendingTickets || 0,
          inProgressTickets:
            queue.inProgressTickets || queue.stats?.inProgressTickets || 0,
          completedTickets:
            queue.completedTickets || queue.stats?.completedTickets || 0,
          totalTickets: queue.totalTickets || queue.stats?.totalTickets || 0,
          avgWaitTime: queue.averageWaitTime || queue.stats?.avgWaitTime || 15,
        },
        isActive: queue.isActive !== false,
        // Keep serviceType as-is (could be string or object)
        serviceType: queue.serviceType || queue.subject || "General",
      }));

      const analyticsData =
        analyticsResponse?.data?.data?.analytics ??
        analyticsResponse?.data ??
        {};

      setQueues(transformedQueues);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showCreateModal || manageQueue) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showCreateModal, manageQueue]);

  const handleCallNextTicket = async (queueId) => {
    setCallingQueue(queueId);
    try {
      console.log("Calling next ticket for queue:", queueId);

      let response;
      try {
        response = await teacherAPI.callNextTicket(queueId);
      } catch (teacherError) {
        console.log("Teacher API failed, trying tickets API...");
        response = await ticketsAPI.callNext(queueId);
      }

      console.log("Call next response:", response);

      if (response.status === 200 || response.status === 201) {
        const ticket =
          response.data.data?.ticket || response.data.ticket || response.data;

        if (ticket && ticket.student) {
          alert(
            `✅ Called next ticket for ${ticket.student.name || "Student"}`
          );
        } else {
          alert("✅ Called next ticket successfully!");
        }

        await fetchTeacherData();
      }
    } catch (error) {
      console.error("Call next error:", error);

      let message = "Failed to call next ticket";
      if (error.response?.status === 404) {
        message = "No students waiting in this queue";
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }

      alert(`❌ ${message}`);
    } finally {
      setCallingQueue(null);
    }
  };

  const handleCreateQueue = async (queueData) => {
    try {
      console.log("Creating queue with data:", queueData);

      const queuePayload = {
        name: queueData.name,
        serviceType: queueData.serviceType,
        location: queueData.location,
        description:
          queueData.description || `${queueData.serviceType} help queue`,
        isActive: queueData.isActive,
        teacher: user._id || user.id,
      };

      const response = await queuesAPI.create(queuePayload);

      if (response.status === 200 || response.status === 201) {
        alert("✅ Queue created successfully!");
        setShowCreateModal(false);
        await fetchTeacherData();
      }
    } catch (error) {
      console.error("Create queue error:", error);
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to create queue";
      alert(`❌ ${message}`);
    }
  };

  const handleManage = (queue) => {
    setManageQueue(queue);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your teacher dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard teacher-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-welcome">
            <h1>Teacher Portal, {user?.name}!👨🏻‍🏫</h1>
            <p>Manage your office hours and student queues</p>
            {analytics?.summary && (
              <div className="quick-stats">
                <span className="stat">
                  Active Queues: {analytics.summary.totalQueues}
                </span>
                <span className="stat">
                  Pending Tickets: {analytics.summary.pendingTickets}
                </span>
                <span className="stat">
                  Completed Today: {analytics.summary.completedTickets}
                </span>
              </div>
            )}
            <span className="role-badge role-teacher">TEACHER</span>
          </div>
          <div className="user-actions">
            <button className="refresh-btn" onClick={fetchTeacherData}>
              🔄 Refresh
            </button>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-tabs">
        <button
          className={`tab ${activeTab === "my-queues" ? "active" : ""}`}
          onClick={() => setActiveTab("my-queues")}
        >
          📋 Active Queues ({queues.filter((q) => q.isActive).length})
        </button>
        <button
          className={`tab ${activeTab === "paused" ? "active" : ""}`}
          onClick={() => setActiveTab("paused")}
        >
          ⏸️ Paused Queues ({queues.filter((q) => !q.isActive).length})
        </button>
        <button
          className={`tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          📊 Analytics
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === "my-queues" && (
          <TeacherQueuesSection
            queues={queues.filter((q) => q.isActive)}
            callingQueue={callingQueue}
            onCallNext={handleCallNextTicket}
            onCreateQueue={() => setShowCreateModal(true)}
            onManage={handleManage}
            getServiceTypeName={getServiceTypeName}
          />
        )}

        {activeTab === "paused" && (
          <PausedQueuesSection
            queues={queues.filter((q) => !q.isActive)}
            onManage={handleManage}
            getServiceTypeName={getServiceTypeName}
          />
        )}

        {activeTab === "analytics" && (
          <TeacherAnalyticsSection analytics={analytics} queues={queues} />
        )}
      </main>

      {showCreateModal && (
        <CreateQueueModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateQueue}
          teacher={user}
        />
      )}

      {manageQueue && (
        <QueueManagementModal
          queue={manageQueue}
          onClose={() => setManageQueue(null)}
          onUpdate={fetchTeacherData}
          getServiceTypeName={getServiceTypeName}
        />
      )}
    </div>
  );
};

// UPDATED: Added getServiceTypeName prop
const TeacherQueuesSection = ({
  queues,
  callingQueue,
  onCallNext,
  onCreateQueue,
  onManage,
  getServiceTypeName,
}) => {
  return (
    <div className="queues-section">
      <div className="section-header">
        <h2>My Office Hour Queues</h2>
        <button className="btn-primary" onClick={onCreateQueue}>
          + Create New Queue
        </button>
      </div>

      {queues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No Active Queues</h3>
          <p>Create your first office hour queue to get started.</p>
          <button className="btn-primary" onClick={onCreateQueue}>
            Create Your First Queue
          </button>
        </div>
      ) : (
        <div className="queues-grid">
          {queues.map((queue) => (
            <div key={queue._id} className="queue-card">
              <div className="queue-header">
                <h3>{queue.name}</h3>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <span
                    className={`status ${
                      queue.isActive ? "active" : "inactive"
                    }`}
                  >
                    {queue.isActive ? "🟢 Active" : "🔴 Inactive"}
                  </span>
                  <span
                    style={{
                      background: "var(--color-steel-blue)",
                      color: "var(--color-text-secondary)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                    }}
                  >
                    {/* FIXED: Use helper function instead of rendering object */}
                    {getServiceTypeName(queue.serviceType)}
                  </span>
                </div>
              </div>

              <div className="queue-description">{queue.description}</div>

              <div className="queue-meta">
                <span className="meta-item">
                  <strong>Waiting:</strong> {queue.stats?.pendingTickets ?? 0}{" "}
                  students
                </span>
                <span className="meta-item">
                  <strong>In Progress:</strong>{" "}
                  {queue.stats?.inProgressTickets ?? 0}
                </span>
                <span className="meta-item">
                  <strong>Avg Wait:</strong>{" "}
                  {Math.round(queue.stats?.avgWaitTime ?? 0)} min
                </span>
                <span className="meta-item">
                  <strong>Total:</strong> {queue.stats?.totalTickets ?? 0}{" "}
                  tickets
                </span>

                <div
                  className="queue-progress"
                  style={{ marginTop: "0.5rem", gridColumn: "1 / -1" }}
                >
                  {(() => {
                    const completed = queue.stats?.completedTickets ?? 0;
                    const total = Math.max(queue.stats?.totalTickets ?? 0, 1);
                    const pct = Math.round((completed / total) * 100);
                    return (
                      <div
                        style={{
                          width: "100%",
                          background: "var(--color-steel-blue)",
                          height: "8px",
                          borderRadius: "6px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background:
                              "linear-gradient(90deg, var(--color-electric-green), var(--color-emerald-green))",
                            borderRadius: "6px",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    );
                  })()}
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-secondary)",
                      marginTop: "0.25rem",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Completion Rate</span>
                    <span>
                      {Math.round(
                        (queue.stats?.completedTickets /
                          Math.max(queue.stats?.totalTickets, 1)) *
                          100
                      )}
                      %
                    </span>
                  </div>
                </div>
              </div>

              <div
                style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}
              >
                <button
                  className={`join-btn ${
                    callingQueue === queue._id ? "loading" : ""
                  }`}
                  onClick={() => onCallNext(queue._id)}
                  disabled={
                    !queue.isActive ||
                    (queue.stats?.pendingTickets || 0) === 0 ||
                    callingQueue === queue._id
                  }
                  style={{ flex: 2 }}
                >
                  {callingQueue === queue._id
                    ? "⏳ Calling..."
                    : "📢 Call Next Ticket"}
                </button>
                <button
                  className="cancel-btn"
                  style={{ flex: 1 }}
                  onClick={() => onManage(queue)}
                >
                  ⚙️ Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateQueueModal = ({ onClose, onCreate, teacher }) => {
  const [formData, setFormData] = useState({
    name: "",
    serviceType: "",
    location: "",
    description: "",
    isActive: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.serviceType.trim() ||
      !formData.location.trim()
    ) {
      alert("Please fill in all required fields");
      return;
    }

    onCreate({
      ...formData,
      teacher: teacher._id || teacher.id,
    });
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Queue</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="queue-form">
          <div className="form-group">
            <label htmlFor="queue-name">Queue Name *</label>
            <input
              id="queue-name"
              type="text"
              placeholder="e.g., Calculus Help, Office Hours"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="queue-serviceType">Service Type *</label>
            <select
              id="queue-serviceType"
              value={formData.serviceType}
              onChange={(e) => handleChange("serviceType", e.target.value)}
              required
            >
              <option value="">Select a service type</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="History">History</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Art">Art</option>
              <option value="Music">Music</option>
              <option value="Physical Education">Physical Education</option>
              <option value="General Help">General Help</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="queue-location">Location *</label>
            <input
              id="queue-location"
              type="text"
              placeholder="e.g., Room 201, Online, Library"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="queue-description">Description</label>
            <textarea
              id="queue-description"
              placeholder="Describe what help students can get in this queue..."
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows="3"
            />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange("isActive", e.target.checked)}
              />
              Activate queue immediately
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Queue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// UPDATED: Added getServiceTypeName prop
const QueueManagementModal = ({
  queue,
  onClose,
  onUpdate,
  getServiceTypeName,
}) => {
  const [isActive, setIsActive] = useState(queue.isActive);
  const [isLoading, setIsLoading] = useState(false);
  const [waitingStudents, setWaitingStudents] = useState([]);
  const [inProgressStudents, setInProgressStudents] = useState([]);
  const [callingTicketId, setCallingTicketId] = useState(null);
  const [completingTicketId, setCompletingTicketId] = useState(null);

  useEffect(() => {
    setIsActive(queue.isActive);
    fetchWaitingStudents();
  }, [queue]);

  const fetchWaitingStudents = async () => {
    try {
      const response = await ticketsAPI.getQueueTickets(queue._id);
      const tickets =
        response.data?.data?.tickets || response.data?.tickets || [];

      // Filter waiting and in-progress tickets
      const waitingTickets = tickets
        .filter((ticket) => ticket.status === "waiting")
        .map((ticket) => ({
          id: ticket._id,
          name:
            ticket.studentInfo?.name || ticket.user?.name || "Unknown Student",
          grade: ticket.studentInfo?.grade || "N/A",
          waitTime: Math.max(
            0,
            Math.round(
              (Date.now() - new Date(ticket.createdAt).getTime()) / 60000
            )
          ),
          userId: ticket.user?._id || ticket.user,
        }));

      const inProgressTickets = tickets
        .filter((ticket) => ticket.status === "in-progress" || ticket.status === "called")
        .map((ticket) => ({
          id: ticket._id,
          name:
            ticket.studentInfo?.name || ticket.user?.name || "Unknown Student",
          grade: ticket.studentInfo?.grade || "N/A",
          waitTime: Math.max(
            0,
            Math.round(
              (Date.now() - new Date(ticket.calledAt || ticket.createdAt).getTime()) / 60000
            )
          ),
          userId: ticket.user?._id || ticket.user,
        }));

      setWaitingStudents(waitingTickets);
      setInProgressStudents(inProgressTickets);
    } catch (error) {
      console.error("Error fetching queue tickets:", error);
      setWaitingStudents([]);
      setInProgressStudents([]);
    }
  };

  const handleCallStudent = async (ticketId) => {
    setCallingTicketId(ticketId);
    try {
      console.log("Calling ticket:", ticketId);
      const response = await ticketsAPI.callTicket(ticketId);
      console.log("Call ticket response:", response);
      
      alert("✅ Student called successfully!");
      await fetchWaitingStudents();
      onUpdate();
    } catch (error) {
      console.error("Error calling ticket:", error);
      alert(
        `❌ ${error.response?.data?.message || error.message || "Failed to call student"}`
      );
    } finally {
      setCallingTicketId(null);
    }
  };

  const handleCompleteStudent = async (ticketId) => {
    setCompletingTicketId(ticketId);
    try {
      console.log("Completing ticket:", ticketId);
      const response = await ticketsAPI.completeTicket(ticketId, "");
      console.log("Complete ticket response:", response);
      
      alert("✅ Ticket marked as completed!");
      await fetchWaitingStudents();
      onUpdate();
    } catch (error) {
      console.error("Error completing ticket:", error);
      alert(
        `❌ ${error.response?.data?.message || error.message || "Failed to complete ticket"}`
      );
    } finally {
      setCompletingTicketId(null);
    }
  };

  const handleStatusToggle = async () => {
    setIsLoading(true);
    try {
      const response = await queuesAPI.update(queue._id, {
        isActive: !isActive,
      });
      if (response.status === 200) {
        setIsActive(!isActive);
        onUpdate();
        alert(`✅ Queue ${!isActive ? "activated" : "paused"} successfully!`);
      }
    } catch (error) {
      console.error("Error updating queue status:", error);
      alert("❌ Failed to update queue status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQueue = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete this queue? All pending tickets will be cancelled."
      )
    ) {
      setIsLoading(true);
      try {
        await queuesAPI.delete(queue._id);
        onUpdate();
        onClose();
        alert("✅ Queue deleted successfully!");
      } catch (error) {
        console.error("Error deleting queue:", error);
        alert("❌ Failed to delete queue");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage Queue: {queue.name}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body" style={{ padding: "2rem" }}>
          <div className="management-section">
            <h3
              style={{ color: "var(--color-pure-white)", marginBottom: "1rem" }}
            >
              Queue Status
            </h3>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <div
                className={`status ${isActive ? "active" : "inactive"}`}
                style={{ margin: 0 }}
              >
                {isActive ? "🟢 Active" : "⏸️ Paused"}
              </div>
              <button
                onClick={handleStatusToggle}
                disabled={isLoading}
                style={{
                  padding: "0.5rem 1.5rem",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  background: isActive
                    ? "rgba(229, 62, 62, 0.1)"
                    : "var(--color-electric-green)",
                  color: isActive ? "#E53E3E" : "white",
                  border: isActive ? "1px solid #E53E3E" : "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                {isLoading
                  ? "Updating..."
                  : isActive
                  ? "⏸️ Pause Queue"
                  : "▶️ Unpause Queue"}
              </button>
            </div>
          </div>

          <div className="management-section">
            <h3
              style={{ color: "var(--color-pure-white)", marginBottom: "1rem" }}
            >
              Queue Information
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {/* FIXED: Use helper function */}
              <div>
                <strong>Service Type:</strong>{" "}
                {getServiceTypeName(queue.serviceType)}
              </div>
              <div>
                <strong>Location:</strong> {queue.location || "Not specified"}
              </div>
              <div>
                <strong>Description:</strong>{" "}
                {queue.description || "No description"}
              </div>
            </div>
          </div>

          <div className="management-section">
            <h3
              style={{ color: "var(--color-pure-white)", marginBottom: "1rem" }}
            >
              Queue Statistics
            </h3>
            <div
              className="queue-meta"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              <span className="meta-item">
                <strong>Waiting:</strong> {queue.stats?.pendingTickets ?? 0}{" "}
                students
              </span>
              <span className="meta-item">
                <strong>In Progress:</strong>{" "}
                {queue.stats?.inProgressTickets ?? 0}
              </span>
              <span className="meta-item">
                <strong>Completed:</strong> {queue.stats?.completedTickets ?? 0}
              </span>
              <span className="meta-item">
                <strong>Total:</strong> {queue.stats?.totalTickets ?? 0} tickets
              </span>
              <span className="meta-item">
                <strong>Avg Wait:</strong>{" "}
                {Math.round(queue.stats?.avgWaitTime ?? 0)} min
              </span>
            </div>
          </div>

          {waitingStudents.length > 0 && (
            <div className="management-section">
              <h3
                style={{
                  color: "var(--color-pure-white)",
                  marginBottom: "1rem",
                }}
              >
                Waiting Students ({waitingStudents.length})
              </h3>
              <div className="waiting-students-list">
                {waitingStudents.map((student) => (
                  <div key={student.id} className="student-item" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem",
                    borderBottom: "1px solid var(--border-primary)"
                  }}>
                    <div className="student-info" style={{flex: 1}}>
                      <div className="student-name">{student.name}</div>
                      <div className="student-grade">Grade {student.grade}</div>
                      <div style={{color: "var(--color-text-tertiary)", fontSize: "0.875rem", marginTop: "0.25rem"}}>
                        {student.waitTime} min waiting
                      </div>
                    </div>
                    <button
                      onClick={() => handleCallStudent(student.id)}
                      disabled={callingTicketId === student.id || isLoading}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "var(--color-electric-green)",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                        marginLeft: "1rem"
                      }}
                    >
                      {callingTicketId === student.id ? "Calling..." : "📞 Call"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inProgressStudents.length > 0 && (
            <div className="management-section" style={{
              borderTop: "1px solid var(--border-primary)",
              paddingTop: "1.5rem",
              marginTop: "1.5rem"
            }}>
              <h3
                style={{
                  color: "var(--color-pure-white)",
                  marginBottom: "1rem",
                }}
              >
                In Progress ({inProgressStudents.length})
              </h3>
              <div className="waiting-students-list">
                {inProgressStudents.map((student) => (
                  <div key={student.id} className="student-item" style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "1rem",
                    borderBottom: "1px solid var(--border-primary)",
                    background: "rgba(76, 175, 80, 0.05)"
                  }}>
                    <div className="student-info" style={{flex: 1}}>
                      <div className="student-name">{student.name}</div>
                      <div className="student-grade">Grade {student.grade}</div>
                      <div style={{color: "var(--color-text-tertiary)", fontSize: "0.875rem", marginTop: "0.25rem"}}>
                        Being helped for {student.waitTime} min
                      </div>
                    </div>
                    <button
                      onClick={() => handleCompleteStudent(student.id)}
                      disabled={completingTicketId === student.id || isLoading}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                        marginLeft: "1rem"
                      }}
                    >
                      {completingTicketId === student.id ? "Completing..." : "✅ Complete"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            className="management-section"
            style={{
              borderTop: "1px solid var(--border-primary)",
              paddingTop: "1.5rem",
              marginTop: "2rem",
            }}
          >
            <h3 style={{ color: "#E53E3E", marginBottom: "1rem" }}>
              Danger Zone
            </h3>
            <button
              onClick={handleDeleteQueue}
              disabled={isLoading}
              style={{
                background: "rgba(229, 62, 62, 0.1)",
                color: "#E53E3E",
                border: "1px solid #E53E3E",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                cursor: "pointer",
                width: "100%",
                fontSize: "0.875rem",
              }}
            >
              {isLoading ? "Deleting..." : "Delete Queue"}
            </button>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-secondary)",
                marginTop: "0.5rem",
              }}
            >
              This will permanently delete the queue and cancel all pending
              tickets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PausedQueuesSection = ({ queues, onManage, getServiceTypeName }) => {
  return (
    <div className="queues-section">
      <div className="section-header">
        <h2>Paused Office Hour Queues</h2>
        <p>Manage your paused queues</p>
      </div>

      {queues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⏸️</div>
          <h3>No Paused Queues</h3>
          <p>All your queues are currently active.</p>
        </div>
      ) : (
        <div className="queues-grid">
          {queues.map((queue) => (
            <div
              key={queue._id}
              className="queue-card"
              style={{
                borderColor: "#FFA500",
                borderWidth: "2px",
                opacity: 0.8,
              }}
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
                  <span
                    style={{
                      background: "#FFA500",
                      color: "white",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                    }}
                  >
                    ⏸️ PAUSED
                  </span>
                  <span
                    style={{
                      background: "var(--color-steel-blue)",
                      color: "var(--color-text-secondary)",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "12px",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                    }}
                  >
                    {getServiceTypeName(queue.serviceType)}
                  </span>
                </div>
              </div>

              <div className="queue-description">{queue.description}</div>

              <div className="queue-meta">
                <span className="meta-item">
                  <strong>Location:</strong> {queue.location || "N/A"}
                </span>
                <span className="meta-item">
                  <strong>Total Tickets:</strong>{" "}
                  {queue.stats?.totalTickets ?? 0}
                </span>
                <span className="meta-item">
                  <strong>Completed:</strong>{" "}
                  {queue.stats?.completedTickets ?? 0}
                </span>
              </div>

              <div
                style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}
              >
                <button
                  className="btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => onManage(queue)}
                >
                  ⚙️ Manage & Unpause
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TeacherAnalyticsSection = ({ analytics, queues }) => {
  if (!analytics) return <div>Loading analytics...</div>;

  return (
    <div className="analytics-section">
      <div className="section-header">
        <h2>Teaching Analytics</h2>
        <p>Insights into your queue performance and student interactions</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card large">
          <h3>📊 Queue Performance</h3>
          <div className="metric-content">
            <div className="metric-item">
              <span className="label">Total Students Helped</span>
              <span className="value">
                {analytics.summary?.completedTickets || 0}
              </span>
            </div>
            <div className="metric-item">
              <span className="label">Pending Tickets</span>
              <span className="value">
                {analytics.summary?.pendingTickets || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>🟢 Active Queues</h3>
          <div className="metric-content">
            <div className="metric-item">
              <span className="label">Count</span>
              <span className="value">
                {queues.filter((q) => q.isActive).length}
              </span>
            </div>
            <div className="metric-item">
              <span className="label">Total Tickets</span>
              <span className="value">
                {queues
                  .filter((q) => q.isActive)
                  .reduce((sum, q) => sum + (q.stats?.totalTickets || 0), 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>⏸️ Paused Queues</h3>
          <div className="metric-content">
            <div className="metric-item">
              <span className="label">Count</span>
              <span className="value">
                {queues.filter((q) => !q.isActive).length}
              </span>
            </div>
            <div className="metric-item">
              <span className="label">Total Tickets</span>
              <span className="value">
                {queues
                  .filter((q) => !q.isActive)
                  .reduce((sum, q) => sum + (q.stats?.totalTickets || 0), 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <h3>⭐ Performance</h3>
          <div className="metric-content">
            <div className="metric-item">
              <span className="label">Student Satisfaction</span>
              <span className="value">
                {analytics.performance?.satisfactionRate || 95}%
              </span>
            </div>
            <div className="metric-item">
              <span className="label">Avg Response Time</span>
              <span className="value">
                {Math.round(analytics.summary?.avgWaitTime || 0)} min
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

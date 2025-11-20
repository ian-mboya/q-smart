import * as XLSX from "xlsx";
import jsPDF from "jspdf";

/**
 * Strategic Reporting Service
 * Generates comprehensive admin reports in PDF and Excel formats
 */

const REPORT_COLORS = {
  primary: "#00D4FF",
  success: "#00FF88",
  warning: "#FFA500",
  danger: "#FF4444",
  dark: "#1a1a2e",
  light: "#eaeaea",
};

/**
 * Generate Excel Report with multiple sheets
 */
export const generateExcelReport = (systemStats, users, queues) => {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Executive Summary
  const summaryData = [
    ["Q-SMART SYSTEM - EXECUTIVE SUMMARY REPORT"],
    ["Generated:", new Date().toLocaleString()],
    [],
    ["SYSTEM OVERVIEW METRICS"],
    ["Metric", "Value"],
    ["Total Users", systemStats?.overview?.totalUsers || 0],
    ["Total Queues", systemStats?.overview?.totalQueues || 0],
    ["Total Tickets Created", systemStats?.overview?.totalTickets || 0],
    ["Active Tickets", systemStats?.overview?.activeTickets || 0],
    ["Completed Tickets", systemStats?.ticketDistribution?.completed || 0],
    ["System Uptime", `${systemStats?.performance?.systemUptime || 99.8}%`],
    ["Avg Resolution Time", `${systemStats?.performance?.avgTicketResolution || 0}m`],
    [],
    ["USER DISTRIBUTION"],
    ["Role", "Count", "Percentage"],
    ...(systemStats?.userDistribution
      ? Object.entries(systemStats.userDistribution).map(([role, count]) => [
          role.charAt(0).toUpperCase() + role.slice(1),
          count,
          systemStats?.overview?.totalUsers
            ? `${((count / systemStats.overview.totalUsers) * 100).toFixed(2)}%`
            : "0%",
        ])
      : [["No Data", 0, "0%"]]),
    [],
    ["TICKET STATUS DISTRIBUTION"],
    ["Status", "Count", "Percentage"],
    ...(systemStats?.ticketDistribution
      ? Object.entries(systemStats.ticketDistribution).map(([status, count]) => [
          status.charAt(0).toUpperCase() + status.slice(1),
          count,
          systemStats?.overview?.totalTickets
            ? `${((count / systemStats.overview.totalTickets) * 100).toFixed(2)}%`
            : "0%",
        ])
      : [["No Data", 0, "0%"]]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet.col_width = [30, 20, 20];
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Executive Summary");

  // Sheet 2: User Details
  const userDetailsData = [
    ["USER MANAGEMENT REPORT"],
    ["Generated:", new Date().toLocaleString()],
    [],
    ["ID", "Name", "Email", "Role", "Phone", "Status", "Joined Date"],
    ...users.map((u) => [
      u._id || "",
      u.name || "",
      u.email || "",
      u.role || "",
      u.phone || "N/A",
      u.isActive ? "Active" : "Inactive",
      u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
    ]),
  ];

  const userSheet = XLSX.utils.aoa_to_sheet(userDetailsData);
  userSheet.col_width = [24, 20, 25, 12, 15, 12, 15];
  XLSX.utils.book_append_sheet(workbook, userSheet, "User Details");

  // Sheet 3: Queue Performance
  const queueData = [
    ["QUEUE PERFORMANCE REPORT"],
    ["Generated:", new Date().toLocaleString()],
    [],
    ["Queue Name", "Subject", "Status", "Capacity", "Total Tickets", "Active Tickets", "Utilization %"],
    ...queues.map((q) => {
      const capacity = q.capacity || 50;
      const totalTickets = q.totalTickets || 0;
      const utilization = capacity > 0 ? ((totalTickets / capacity) * 100).toFixed(2) : 0;
      return [
        q.name || "",
        q.subject || "",
        (q.status || "active").toUpperCase(),
        capacity,
        totalTickets,
        q.activeTickets || 0,
        `${utilization}%`,
      ];
    }),
  ];

  const queueSheet = XLSX.utils.aoa_to_sheet(queueData);
  queueSheet.col_width = [20, 20, 12, 12, 15, 15, 15];
  XLSX.utils.book_append_sheet(workbook, queueSheet, "Queue Performance");

  // Sheet 4: Performance Metrics
  const performanceData = [
    ["SYSTEM PERFORMANCE METRICS"],
    ["Generated:", new Date().toLocaleString()],
    [],
    ["Metric", "Value", "Target", "Status"],
    [
      "System Uptime",
      `${systemStats?.performance?.systemUptime || 99.8}%`,
      "99.5%",
      (systemStats?.performance?.systemUptime || 99.8) >= 99.5 ? "✓ Met" : "✗ Below",
    ],
    [
      "Avg Ticket Resolution Time",
      `${systemStats?.performance?.avgTicketResolution || 0}m`,
      "30m",
      (systemStats?.performance?.avgTicketResolution || 0) <= 30 ? "✓ Met" : "✗ Below",
    ],
    [
      "Completion Rate",
      `${
        systemStats?.overview?.totalTickets > 0
          ? ((systemStats?.ticketDistribution?.completed || 0) / systemStats?.overview?.totalTickets * 100).toFixed(2)
          : 0
      }%`,
      "85%",
      (systemStats?.ticketDistribution?.completed || 0) / (systemStats?.overview?.totalTickets || 1) >= 0.85
        ? "✓ Met"
        : "✗ Below",
    ],
    [],
    ["PEAK USAGE HOURS"],
    ["Hour", "Ticket Count"],
    ...(systemStats?.performance?.peakUsageHours
      ? systemStats.performance.peakUsageHours.map((hour) => [`${hour.hour}:00`, hour.ticketCount])
      : [["No Data", 0]]),
  ];

  const perfSheet = XLSX.utils.aoa_to_sheet(performanceData);
  perfSheet.col_width = [30, 20, 15, 15];
  XLSX.utils.book_append_sheet(workbook, perfSheet, "Performance Metrics");

  // Write file
  const fileName = `Q-Smart_Report_${new Date().getTime()}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

/**
 * Generate PDF Report with styled formatting
 */
export const generatePDFReport = (systemStats, users, queues) => {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  let yPosition = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  // Helper function to add a new page if needed
  const checkPageBreak = (spaceNeeded = 30) => {
    if (yPosition + spaceNeeded > pdf.internal.pageSize.getHeight() - 10) {
      pdf.addPage();
      yPosition = 20;
    }
  };

  // Header
  pdf.setFillColor(0, 212, 255);
  pdf.rect(0, 0, pageWidth, 30, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.text("Q-SMART STRATEGIC REPORT", margin, 15);
  pdf.setFontSize(10);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 23);

  yPosition = 35;
  pdf.setTextColor(0, 0, 0);

  // Executive Summary Section
  pdf.setFontSize(14);
  pdf.setFont(undefined, "bold");
  pdf.text("EXECUTIVE SUMMARY", margin, yPosition);
  yPosition += 10;

  pdf.setFont(undefined, "normal");
  pdf.setFontSize(11);

  const summaryMetrics = [
    [`Total Users: ${systemStats?.overview?.totalUsers || 0}`, `Total Queues: ${systemStats?.overview?.totalQueues || 0}`],
    [`Active Tickets: ${systemStats?.overview?.activeTickets || 0}`, `Total Tickets: ${systemStats?.overview?.totalTickets || 0}`],
    [
      `System Uptime: ${systemStats?.performance?.systemUptime || 99.8}%`,
      `Avg Resolution: ${systemStats?.performance?.avgTicketResolution || 0}m`,
    ],
  ];

  summaryMetrics.forEach((row) => {
    pdf.text(row[0], margin, yPosition);
    pdf.text(row[1], margin + contentWidth / 2, yPosition);
    yPosition += 7;
  });

  // User Distribution
  yPosition += 8;
  checkPageBreak(50);
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(12);
  pdf.text("USER DISTRIBUTION", margin, yPosition);
  yPosition += 8;

  pdf.setFont(undefined, "normal");
  pdf.setFontSize(10);

  if (systemStats?.userDistribution) {
    Object.entries(systemStats.userDistribution).forEach(([role, count]) => {
      const percentage = systemStats?.overview?.totalUsers
        ? ((count / systemStats.overview.totalUsers) * 100).toFixed(2)
        : 0;
      const barWidth = (percentage / 100) * (contentWidth - 60);

      pdf.text(`${role.charAt(0).toUpperCase() + role.slice(1)}:`, margin, yPosition);
      pdf.setDrawColor(0, 212, 255);
      pdf.rect(margin + 50, yPosition - 3, barWidth, 5, "F");
      pdf.text(`${count} (${percentage}%)`, margin + 50 + barWidth + 5, yPosition);
      yPosition += 7;
    });
  }

  // Ticket Status Distribution
  yPosition += 8;
  checkPageBreak(50);
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(12);
  pdf.text("TICKET STATUS DISTRIBUTION", margin, yPosition);
  yPosition += 8;

  pdf.setFont(undefined, "normal");
  pdf.setFontSize(10);

  if (systemStats?.ticketDistribution) {
    Object.entries(systemStats.ticketDistribution).forEach(([status, count]) => {
      const percentage = systemStats?.overview?.totalTickets
        ? ((count / systemStats.overview.totalTickets) * 100).toFixed(2)
        : 0;
      pdf.text(`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count} (${percentage}%)`, margin, yPosition);
      yPosition += 6;
    });
  }

  // Queue Performance
  yPosition += 8;
  checkPageBreak(80);
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(12);
  pdf.text("QUEUE PERFORMANCE SUMMARY", margin, yPosition);
  yPosition += 8;

  pdf.setFont(undefined, "normal");
  pdf.setFontSize(9);

  queues.slice(0, 10).forEach((queue) => {
    const capacity = queue.capacity || 50;
    const utilization = capacity > 0 ? ((queue.totalTickets / capacity) * 100).toFixed(2) : 0;

    pdf.text(`${queue.name}`, margin, yPosition);
    pdf.text(`Subject: ${queue.subject || "N/A"}`, margin + 5, yPosition + 4);
    pdf.text(
      `Capacity: ${capacity} | Active: ${queue.activeTickets || 0} | Utilization: ${utilization}%`,
      margin + 5,
      yPosition + 8
    );
    yPosition += 12;

    checkPageBreak(20);
  });

  // Performance Metrics
  yPosition += 8;
  checkPageBreak(50);
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(12);
  pdf.text("SYSTEM PERFORMANCE METRICS", margin, yPosition);
  yPosition += 8;

  pdf.setFont(undefined, "normal");
  pdf.setFontSize(10);

  const perfMetrics = [
    [
      "System Uptime",
      `${systemStats?.performance?.systemUptime || 99.8}%`,
      "Target: 99.5%",
      (systemStats?.performance?.systemUptime || 99.8) >= 99.5 ? "✓" : "✗",
    ],
    [
      "Avg Resolution Time",
      `${systemStats?.performance?.avgTicketResolution || 0}m`,
      "Target: 30m",
      (systemStats?.performance?.avgTicketResolution || 0) <= 30 ? "✓" : "✗",
    ],
    [
      "Completion Rate",
      `${
        systemStats?.overview?.totalTickets > 0
          ? ((systemStats?.ticketDistribution?.completed || 0) / systemStats?.overview?.totalTickets * 100).toFixed(2)
          : 0
      }%`,
      "Target: 85%",
      (systemStats?.ticketDistribution?.completed || 0) / (systemStats?.overview?.totalTickets || 1) >= 0.85
        ? "✓"
        : "✗",
    ],
  ];

  perfMetrics.forEach(([metric, value, target, status]) => {
    pdf.text(`${metric}: ${value}`, margin, yPosition);
    pdf.text(`${target} ${status}`, margin + contentWidth / 2, yPosition);
    yPosition += 6;
  });

  // Peak Usage Hours
  if (systemStats?.performance?.peakUsageHours?.length > 0) {
    yPosition += 8;
    checkPageBreak(40);
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(12);
    pdf.text("PEAK USAGE HOURS", margin, yPosition);
    yPosition += 8;

    pdf.setFont(undefined, "normal");
    pdf.setFontSize(9);

    systemStats.performance.peakUsageHours.slice(0, 5).forEach((hour) => {
      pdf.text(`${hour.hour}:00 - ${hour.ticketCount} tickets`, margin, yPosition);
      yPosition += 5;
    });
  }

  // Footer
  pdf.setTextColor(128, 128, 128);
  pdf.setFontSize(8);
  pdf.text(
    `Page ${pdf.internal.getCurrentPageInfo().pageNumber}`,
    pageWidth / 2,
    pdf.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  const fileName = `Q-Smart_Report_${new Date().getTime()}.pdf`;
  pdf.save(fileName);
};

/**
 * Generate comprehensive report summary
 */
export const generateReportSummary = (systemStats, users, queues) => {
  return {
    generatedAt: new Date().toISOString(),
    systemOverview: {
      totalUsers: systemStats?.overview?.totalUsers || 0,
      totalQueues: systemStats?.overview?.totalQueues || 0,
      totalTickets: systemStats?.overview?.totalTickets || 0,
      activeTickets: systemStats?.overview?.activeTickets || 0,
    },
    performance: {
      uptime: `${systemStats?.performance?.systemUptime || 99.8}%`,
      avgResolutionTime: `${systemStats?.performance?.avgTicketResolution || 0}m`,
    },
    userStats: {
      totalCount: users.length,
      byRole: systemStats?.userDistribution || {},
    },
    queueStats: {
      totalQueues: queues.length,
      avgUtilization:
        queues.length > 0
          ? (
              queues.reduce((sum, q) => {
                const capacity = q.capacity || 50;
                return sum + ((q.totalTickets || 0) / capacity) * 100;
              }, 0) / queues.length
            ).toFixed(2)
          : 0,
    },
    ticketDistribution: systemStats?.ticketDistribution || {},
  };
};

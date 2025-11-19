# Strategic Reporting - Quick Reference Guide

## What Data is Included in Reports?

### Always Included
✓ System overview (users, queues, tickets)
✓ User distribution by role
✓ Ticket status breakdown
✓ System performance metrics
✓ Peak usage hours
✓ Queue utilization rates
✓ User account details
✓ SLA compliance status

## Report Format Comparison

| Feature | Excel | PDF | JSON |
|---------|-------|-----|------|
| **Best For** | Data analysis, spreadsheets | Management presentations | API integration |
| **Sheets/Sections** | 4 sheets | 6 sections | Single object |
| **User Directory** | ✓ Complete | ✗ Summary only | ✗ Counts only |
| **Queue Details** | ✓ Full metrics | ✓ Top 10 | ✓ Summary |
| **Visual Styling** | Basic | Professional | N/A |
| **File Size** | Small | Medium | Smallest |
| **Charts/Graphs** | Basic bars | Formatted bars | No |

## Key Metrics Explained

### System Uptime
- Percentage of time system is operational
- Target: 99.5%
- Green if ≥ 99.5%, Red if below

### Avg Resolution Time
- Minutes to complete average ticket
- Target: 30 minutes
- Green if ≤ 30m, Red if above

### Completion Rate
- Percentage of tickets marked completed
- Target: 85%
- Green if ≥ 85%, Red if below

### Queue Utilization
- Percentage: (Total Tickets / Capacity) × 100
- Helps identify over/under capacity queues
- Monitor trends to adjust capacity

## Step-by-Step: Exporting Data

### Export Excel Report
1. Go to Admin Dashboard
2. Click "📄 Strategic Reports" tab
3. In Excel card, click "📥 Download Excel (.xlsx)"
4. Opens in Excel, Google Sheets, Numbers, etc.
5. File named: `Q-Smart_Report_[timestamp].xlsx`

### Export PDF Report
1. Go to Admin Dashboard
2. Click "📄 Strategic Reports" tab
3. In PDF card, click "📄 Download PDF (.pdf)"
4. Opens in PDF reader
5. File named: `Q-Smart_Report_[timestamp].pdf`

### Export JSON Summary
1. Go to Admin Dashboard
2. Click "📄 Strategic Reports" tab
3. In Summary card, click "📋 Download Summary (.json)"
4. Opens in text editor or can import into tools
5. File named: `Q-Smart_Summary_[timestamp].json`

## Common Tasks

### Task: Find Number of Active Students
1. Export Excel report
2. Open "User Details" sheet
3. Filter Role column = "student"
4. Count rows with Status = "Active"

### Task: Check Queue Capacity Issues
1. Export Excel report
2. Open "Queue Performance" sheet
3. Sort by "Utilization %" column
4. Review queues over 80% utilization

### Task: Monitor System Health
1. Check PDF report
2. Look at Performance Metrics section
3. Note which metrics have ✓ (met) vs ✗ (below target)
4. Track trends across multiple reports

### Task: Share Results with Management
1. Export PDF report
2. Email PDF file
3. Includes all key metrics and summary
4. Professional formatting ready to present

### Task: Integrate with External System
1. Export JSON summary
2. Parse JSON file
3. Extract needed metrics
4. Integrate into external dashboard/tool

## Report Sheets Explained (Excel)

### Sheet 1: Executive Summary
Contains KPIs and high-level metrics for quick overview.

**Top Section:**
- Generated date/time
- Total Users, Queues, Tickets

**User Distribution:**
- Count by role with percentages
- Student, Teacher, Parent, Admin breakdowns

**Ticket Distribution:**
- Count by status with percentages
- Pending, In-Progress, Completed, Cancelled

**Performance Metrics:**
- System Uptime with target
- Avg Resolution Time with target
- Completion Rate with target

**Peak Usage Hours:**
- Hour and ticket count for top periods

### Sheet 2: User Details
Complete user directory with all account information.

**Columns:**
- ID (User database ID)
- Name
- Email
- Role (student/teacher/parent/admin)
- Phone
- Status (Active/Inactive)
- Joined Date

**Use for:**
- Audience lists
- Contact information
- User management audits

### Sheet 3: Queue Performance
Performance analysis per queue.

**Columns:**
- Queue Name
- Subject/Service Type
- Status (active/inactive)
- Capacity (max tickets)
- Total Tickets
- Active Tickets
- Utilization % (calculated)

**Use for:**
- Capacity planning
- Identifying bottlenecks
- Load balancing analysis

### Sheet 4: Performance Metrics
System-wide performance tracking.

**Metrics:**
- System Uptime (% with target)
- Avg Ticket Resolution Time (minutes with target)
- Completion Rate (% with target)

**Peak Usage Hours:**
- Hour
- Ticket Count

**Use for:**
- SLA tracking
- Performance monitoring
- Trend analysis

## PDF Report Structure

### Header
- Title: Q-SMART STRATEGIC REPORT
- Generated timestamp
- Color-coded for visual appeal

### Executive Summary
Quick stats: Total Users, Queues, Tickets, Uptime, Resolution Time

### User Distribution
Bar chart showing users by role with percentages

### Ticket Status Distribution
List of ticket statuses with counts and percentages

### Queue Performance Summary
Top 10 queues with:
- Name, Subject, Status
- Capacity and active tickets
- Utilization percentage

### System Performance Metrics
Table showing:
- Metric name
- Actual value
- Target value
- Status (✓ or ✗)

### Peak Usage Hours
List of busiest hours and ticket counts

### Footer
Page number and professional formatting

## JSON Summary Structure

```json
{
  "generatedAt": "2024-01-15T10:30:00Z",
  "systemOverview": {
    "totalUsers": 150,
    "totalQueues": 7,
    "totalTickets": 2500,
    "activeTickets": 45
  },
  "performance": {
    "uptime": "99.8%",
    "avgResolutionTime": "25m"
  },
  "userStats": {
    "totalCount": 150,
    "byRole": {
      "student": 120,
      "teacher": 20,
      "parent": 8,
      "admin": 2
    }
  },
  "queueStats": {
    "totalQueues": 7,
    "avgUtilization": "65.43"
  },
  "ticketDistribution": {
    "pending": 30,
    "in_progress": 15,
    "completed": 2400,
    "cancelled": 55
  }
}
```

## Tips & Tricks

1. **Schedule Reports** - Export monthly for trend tracking
2. **Compare Metrics** - Export multiple times to spot trends
3. **Use PDF for Presentations** - Professional formatting included
4. **Use Excel for Analysis** - Filter, sort, pivot tables
5. **Archive Reports** - Keep for compliance and audit trails
6. **Share Selectively** - PDF includes all sensitive data
7. **Timing Matters** - Export during peak hours for accurate peak hour data
8. **Check Recent Data** - Refresh dashboard before exporting for latest data

## When Report Data Updates

- Data refreshes every 30 seconds in dashboard
- Reports show snapshot at generation time
- Timestamps included in all exports
- Historical tracking requires multiple exports

## File Locations

After exporting, files are downloaded to your browser's default download folder:
- Windows: `C:\Users\[Username]\Downloads\`
- Mac: `/Users/[Username]/Downloads/`
- Linux: `/home/[Username]/Downloads/`

Files are timestamped for easy organization:
- `Q-Smart_Report_1705310400000.xlsx`
- `Q-Smart_Report_1705310400000.pdf`
- `Q-Smart_Summary_1705310400000.json`

## Support

If reports don't generate:
1. Ensure Admin Dashboard has fully loaded
2. Check browser console (F12) for errors
3. Try refreshing dashboard first
4. Verify you have admin permissions
5. Check available disk space

## Version Info

- Excel Reports: Generated with XLSX library
- PDF Reports: Generated with jsPDF library
- JSON Reports: Native JavaScript JSON export
- Last Updated: 2024

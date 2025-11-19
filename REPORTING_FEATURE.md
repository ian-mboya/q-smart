# Strategic Reporting Feature

## Overview

The Q-Smart Admin Dashboard now includes a comprehensive strategic reporting functionality that allows administrators to export detailed system analytics in multiple formats (PDF, Excel, JSON Summary).

## Features

### 1. **Excel Report (.xlsx)**
- Multi-sheet workbook with organized data
- **Sheets Included:**
  - **Executive Summary Dashboard** - High-level KPIs and system metrics
  - **User Details** - Complete user directory with roles, contact info, and status
  - **Queue Performance** - Queue utilization, capacity, and ticket metrics
  - **Performance Metrics** - System uptime, resolution times, and SLA compliance

### 2. **PDF Report (.pdf)**
- Professionally formatted with styled headers and visual elements
- **Sections Included:**
  - Executive Summary with key metrics
  - User Distribution with visual progress bars
  - Ticket Status Distribution analysis
  - Queue Performance Summary (top 10 queues)
  - System Performance Metrics with SLA tracking
  - Peak Usage Hours analysis
  - Page numbering and timestamp

### 3. **Summary Report (.json)**
- Lightweight JSON format for integration with other systems
- **Contains:**
  - Generated timestamp
  - System Overview metrics
  - Performance indicators
  - User statistics by role
  - Queue statistics with average utilization
  - Ticket distribution

## Data Points Included

### System Overview
- Total Users
- Total Queues
- Total Tickets Created
- Active Tickets
- Completed Tickets

### User Analytics
- User count by role (Students, Teachers, Parents, Admins)
- User distribution percentages
- Active/Inactive user status
- Registration dates

### Queue Metrics
- Queue names and subjects
- Queue capacity and utilization percentage
- Total tickets per queue
- Active tickets per queue
- Queue status (active/inactive)

### Performance Metrics
- System Uptime (%)
- Average Ticket Resolution Time (minutes)
- Ticket Completion Rate (%)
- Peak Usage Hours with ticket counts
- SLA Compliance Status

### Ticket Analytics
- Ticket distribution by status (pending, in-progress, completed, etc.)
- Completion percentages
- Status-based statistics

## How to Use

### Accessing the Reporting Section

1. Navigate to the Admin Dashboard
2. Click on the **📄 Strategic Reports** tab
3. Select your desired report format

### Generating Reports

#### Excel Report
1. Click **📥 Download Excel (.xlsx)**
2. A multi-sheet workbook will be downloaded
3. Format: `Q-Smart_Report_{timestamp}.xlsx`

#### PDF Report
1. Click **📄 Download PDF (.pdf)**
2. A styled PDF document will be downloaded
3. Format: `Q-Smart_Report_{timestamp}.pdf`
4. Include page numbers and timestamps

#### Summary Report
1. Click **📋 Download Summary (.json)**
2. A JSON file will be downloaded with key metrics
3. Format: `Q-Smart_Summary_{timestamp}.json`

## Report Preview

The reporting dashboard displays a live preview of data that will be included in the reports:

- **System Overview** - Current user count, queue count, ticket metrics
- **Performance Metrics** - Uptime, resolution time, completion rate, peak hours
- **User Distribution** - User count breakdown by role
- **Ticket Distribution** - Ticket status breakdown

## Technical Implementation

### Files Modified/Created

1. **New File: `src/services/reportingService.js`**
   - `generateExcelReport()` - Creates multi-sheet Excel workbook
   - `generatePDFReport()` - Generates styled PDF document
   - `generateReportSummary()` - Creates JSON summary object

2. **Updated: `src/Pages/AdminDashboard.jsx`**
   - Added import for reporting service
   - Added reporting handlers: `handleExportExcel()`, `handleExportPDF()`, `handleExportSummary()`
   - Added `ReportingSection` component
   - Added new "Strategic Reports" tab

3. **Updated: `src/Pages/AdminDashboard.css`**
   - Added styling for reporting section
   - `.reporting-section` - Main container
   - `.report-formats` - Format card grid
   - `.format-card` - Individual report format cards
   - `.report-preview` - Data preview section
   - `.report-info` - Report information cards
   - Responsive design for mobile devices

### Dependencies

- **xlsx** (SheetJS) - For Excel file generation
- **jspdf** - For PDF file generation
- **html2pdf.js** - For HTML to PDF conversion

Install with:
```bash
npm install xlsx jspdf html2pdf.js
```

## Report Contents Details

### Executive Summary
- System overview statistics
- User and queue distribution
- Performance metrics with targets
- Peak usage hours
- Completion rates and SLA compliance

### User Management
- Complete user directory
- User roles and status
- Contact information
- Account creation dates
- User distribution analysis

### Queue Performance
- Queue names and descriptions
- Capacity and utilization metrics
- Ticket counts (total and active)
- Queue status
- Performance per queue

### System Metrics
- Uptime statistics
- Ticket resolution times
- Completion rate percentage
- Peak hour analysis
- Hourly usage patterns

## SLA Tracking

Reports include SLA compliance indicators:
- **System Uptime Target:** 99.5%
- **Avg Resolution Time Target:** 30 minutes
- **Completion Rate Target:** 85%

Status indicators show ✓ (Met) or ✗ (Below) target for each metric.

## Use Cases

1. **Management Reports** - Use PDF reports for executive presentations
2. **Data Analysis** - Use Excel reports for detailed analytics and trending
3. **System Integration** - Use JSON summaries to feed metrics to other systems
4. **Compliance Documentation** - Maintain SLA documentation
5. **Performance Monitoring** - Track system metrics over time
6. **User Onboarding** - Provide stakeholders with user distribution reports

## Best Practices

1. **Regular Exports** - Schedule regular report generation for trend analysis
2. **Data Archiving** - Store reports for historical comparison
3. **Stakeholder Communication** - Use PDF reports for presentations
4. **Detailed Analysis** - Use Excel sheets for in-depth analytics
5. **API Integration** - Use JSON summaries for programmatic access to metrics

## Troubleshooting

### Report won't generate
- Ensure system stats are loaded (wait for dashboard to finish loading)
- Check browser console for errors
- Verify all required data is present

### Excel file is empty
- System stats may not be properly loaded
- Check network requests in browser DevTools
- Refresh the dashboard and try again

### PDF styling looks incorrect
- Ensure adequate margin space
- Check if all data is populated before export
- Large datasets may need multiple pages

## Future Enhancements

- Scheduled automated report generation
- Email delivery of reports
- Custom report templates
- Chart visualizations in PDF
- Real-time data refresh during export
- Multi-date range comparisons
- User-specific filtered reports
- Report annotations and notes

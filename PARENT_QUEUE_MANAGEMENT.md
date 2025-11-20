# Parent Queue Management Guide

## Features Implemented

### 1. Join Queue for Child
Parents can enroll their child in available queues (teacher Q&A sessions).

**Flow:**
1. Parent clicks on a child → "View Details" button
2. Child Detail Modal opens → "Join Queue" button
3. Modal fetches available queues from backend
4. Parent selects a queue and confirms
5. Child is added to the queue and receives a ticket
6. Dashboard refreshes to show the ticket

**API Endpoints Used:**
- `GET /api/queues` - Fetch all available queues
- `POST /api/parent/children/:childId/join-queue/:queueId` - Join queue for child

**UI Components:**
- ChildDetailModal - Shows child info with "Join Queue" button
- JoinQueueModal - Lists available queues with join buttons

### 2. Cancel Ticket/Queue
Parents can cancel their child's queue ticket/enrollment.

**Flow:**
1. Parent navigates to "Family Tickets" tab
2. Sees all tickets created by their children
3. Clicks "Cancel" button on pending tickets
4. Confirms cancellation in popup
5. Ticket is cancelled and removed from the queue
6. Dashboard refreshes to update ticket list

**API Endpoints Used:**
- `PUT /api/tickets/:id/cancel` - Cancel a ticket

**UI Components:**
- FamilyTicketsSection - Shows all family tickets with cancel/contact options

### 3. View Queue Details
When browsing available queues, parents see:
- Queue name
- Teacher name
- Current number of students waiting
- "Join" button to enroll child

## How to Use

### Step 1: Select a Child
On the Parent Dashboard:
1. Click on "My Children" tab
2. Click "View Details" on a child's card

### Step 2: Join Queue
In the Child Detail Modal:
1. Click "Join Queue" button
2. Modal shows all available queues with details:
   - Queue name
   - Teacher name
   - Number of waiting students
3. Click "Join" next to desired queue
4. Confirmation notification appears
5. Dashboard refreshes - new ticket appears in "Family Tickets" tab

### Step 3: Manage Tickets
In the "Family Tickets" tab:
1. View all tickets created by your children
2. For each ticket, see:
   - Child name
   - Queue/teacher name
   - Status (pending/completed/cancelled)
   - Created date
3. For pending tickets:
   - Click "Cancel" to remove from queue
   - Click "Contact Teacher" to email teacher

## Data Flow

### Join Queue Flow
```
Parent clicks "Join Queue"
    ↓
Backend fetches available queues
    ↓
Parent selects queue from modal
    ↓
POST /api/parent/children/:childId/join-queue/:queueId
    ↓
Backend creates Ticket document with:
  - student: child ID
  - queue: queue ID
  - status: 'waiting'
    ↓
Frontend refreshes parent data
    ↓
New ticket appears in Family Tickets
```

### Cancel Ticket Flow
```
Parent clicks Cancel on ticket
    ↓
Confirmation popup appears
    ↓
PUT /api/tickets/:ticketId/cancel
    ↓
Backend updates ticket status to 'cancelled'
    ↓
Frontend refreshes parent data
    ↓
Ticket removed from active list
```

## Expected Data Structures

### Queue Object
```javascript
{
  _id: ObjectId,
  name: string,         // e.g., "Math Help Q&A"
  teacher: {
    _id: ObjectId,
    name: string,
    email: string
  },
  studentCount: number, // How many students are in queue
  isActive: boolean,
  createdAt: date
}
```

### Ticket Object
```javascript
{
  _id: ObjectId,
  student: {
    _id: ObjectId,
    name: string,
    email: string,
    grade: string
  },
  queue: {
    _id: ObjectId,
    name: string,
    teacher: {
      _id: ObjectId,
      name: string,
      email: string
    }
  },
  status: 'waiting' | 'serving' | 'completed' | 'cancelled',
  title: string,
  description: string,
  createdAt: date,
  completedAt: date (if status is completed)
}
```

## Frontend Console Debugging

When joining a queue, watch the console for these logs:

```
📋 Fetching available queues...
✅ Using response.data.data: X queues
✅ Join queue modal opened with X queues
🎫 Joining child to queue...
  Child ID: [id]
  Queue ID: [id]
✅ Join queue response: {...}
Successfully joined [child name] to queue
```

When cancelling a ticket:
```
❌ Cancelling ticket: [ticketId]
✅ Ticket cancelled: {...}
Ticket cancelled successfully
```

## Troubleshooting

### "No available queues" appears
1. Check if queues exist in database
2. Verify `/api/queues` returns data
3. Check backend console for errors
4. Ensure teacher has created queues

### Join fails with error
1. Check browser console for error message
2. Verify child ID is correct (use `_id` or `childId`)
3. Verify queue exists
4. Check backend logs for API errors
5. Ensure auth token is valid

### Ticket doesn't appear after joining
1. Refresh the page manually
2. Check if ticket was actually created (check DB)
3. Verify `getFamilyTickets` API is returning new ticket
4. Check backend logs for save errors

### Cancel doesn't work
1. Verify ticket ID is correct
2. Check if ticket status is 'waiting' (can only cancel waiting)
3. Verify `/api/tickets/:id/cancel` endpoint exists
4. Check backend error logs

## Related Files

**Frontend:**
- `src/Pages/ParentDashboard.jsx` - Main component with handlers
- `src/services/api.jsx` - API client definitions

**Backend:**
- `routes/parent.js` - Parent routes
- `routes/queues.js` - Queue routes  
- `routes/tickets.js` - Ticket routes
- `controllers/parentController.js` - Parent logic (joinQueueForChild)

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/queues` | GET | Fetch all available queues |
| `/api/queues/:id` | GET | Get specific queue details |
| `/api/parent/children/:childId/join-queue/:queueId` | POST | Join child to queue |
| `/api/tickets/:id/cancel` | PUT | Cancel a ticket |
| `/api/parent/family-tickets` | GET | Get all family tickets |

## UI Flow Diagram

```
Parent Dashboard
  ├── Family Overview
  │   └── Child Card → "View Details" → ChildDetailModal
  │                                       └── "Join Queue" → JoinQueueModal
  │                                                          └── Select Queue
  │                                                          └── POST join-queue
  │
  ├── My Children
  │   └── Child Card → "View Details" → ChildDetailModal → JoinQueueModal
  │
  └── Family Tickets
      └── Ticket Card
          ├── "Cancel" → Confirm → PUT /cancel
          └── "Contact Teacher" → Email
```

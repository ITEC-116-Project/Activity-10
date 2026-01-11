# Database Migration Required

## Changes to `event_attendees` Table

You need to update the `event_attendees` table to add the new `adminId` column and make `attendeeId` nullable.

### SQL Migration Script:

```sql
-- Add adminId column to event_attendees table
ALTER TABLE event_attendees 
ADD COLUMN adminId INT NULL;

-- Make attendeeId nullable (if not already)
ALTER TABLE event_attendees 
MODIFY COLUMN attendeeId INT NULL;

-- Add status column with default 'inactive'
ALTER TABLE event_attendees 
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'inactive';

-- Optional: Add foreign key constraint for adminId
ALTER TABLE event_attendees 
ADD CONSTRAINT fk_event_attendees_admin 
FOREIGN KEY (adminId) REFERENCES admin_ten(id) 
ON DELETE CASCADE;

-- Optional: Add index for better query performance
CREATE INDEX idx_event_attendees_adminId ON event_attendees(adminId);
```

### Table Structure After Migration:

```
event_attendees:
- id (INT, PRIMARY KEY, AUTO_INCREMENT)
- eventId (INT, NOT NULL)
- attendeeId (INT, NULL) ← Now nullable for admin registrations
- adminId (INT, NULL) ← New column for admin registrations
- attendeeName (VARCHAR, NOT NULL)
- ticketCode (VARCHAR, NOT NULL)
- status (VARCHAR, NOT NULL, default 'inactive')
- registeredAt (TIMESTAMP, NOT NULL)
```

### Notes:

1. Either `attendeeId` or `adminId` should be populated (not both)
2. Regular attendees use `attendeeId`
3. Admin users use `adminId`
4. Run this migration before testing the registration feature
5. If using TypeORM synchronization, you may need to set `synchronize: true` in your database config (development only)

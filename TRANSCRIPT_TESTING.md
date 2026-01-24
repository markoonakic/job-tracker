# Transcript Feature Testing Guide

This document outlines the manual testing steps for the transcript feature migration from application-level to round-level.

## Prerequisites

1. Backend running: `cd backend && source .venv/bin/activate && uvicorn app.main:app --reload`
2. Frontend running: `cd frontend && npm run dev`
3. Test PDF file available for upload

## Test Cases

### 1. Create New Round with Transcript

**Steps:**
1. Navigate to an application detail page
2. Click "Add Round" button
3. Fill in round details:
   - Select round type
   - Set scheduled date
   - Enter notes
4. Upload a PDF file in the "Transcript (PDF)" field
5. Enter text in "Transcript Summary" field
6. Click "Add Round"

**Expected Results:**
- Round is created successfully
- Transcript file is uploaded and associated with the round
- Transcript summary is saved
- RoundCard displays transcript section with file and summary

### 2. Edit Round to Add Transcript

**Steps:**
1. Click edit button on an existing round without a transcript
2. Upload a PDF file in the "Transcript (PDF)" field
3. Enter text in "Transcript Summary" field
4. Click "Save"

**Expected Results:**
- Transcript file is uploaded
- Transcript summary is saved
- RoundCard now shows transcript section

### 3. Preview Transcript

**Steps:**
1. Find a round with a transcript
2. Click the preview button (eye icon) in the transcript section

**Expected Results:**
- PDF opens in a new browser tab
- PDF displays correctly

### 4. Download Transcript

**Steps:**
1. Find a round with a transcript
2. Click the download button in the transcript section

**Expected Results:**
- PDF file downloads to your downloads folder
- Filename matches the original uploaded filename

### 5. Replace Transcript

**Steps:**
1. Click edit button on a round with an existing transcript
2. Upload a different PDF file
3. Update the transcript summary
4. Click "Save"

**Expected Results:**
- Old transcript file is replaced with new one
- New transcript summary is saved
- Old file is deleted from server

### 6. Delete Transcript

**Steps:**
1. Find a round with a transcript
2. Click the delete button (X icon) in the transcript section
3. Confirm deletion in the dialog

**Expected Results:**
- Transcript file is removed from the round
- Transcript summary is cleared
- File is deleted from server
- Transcript section disappears from RoundCard

### 7. Update Transcript Summary Only

**Steps:**
1. Click edit button on a round with a transcript
2. Modify only the "Transcript Summary" field (don't upload new file)
3. Click "Save"

**Expected Results:**
- Transcript summary is updated
- Existing transcript file remains unchanged

### 8. Verify DocumentSection Cleanup

**Steps:**
1. Navigate to an application detail page
2. Scroll to the "Documents" section

**Expected Results:**
- Only "CV" and "Cover Letter" rows are shown
- No "Transcript" row is visible
- No transcript summary section appears

### 9. Delete Round with Transcript

**Steps:**
1. Find a round with a transcript
2. Click delete button on the round
3. Confirm deletion

**Expected Results:**
- Round is deleted
- Transcript file is deleted from server
- No orphaned files remain

## Backend API Testing (Optional)

You can also test the API endpoints directly:

```bash
# Get authentication token first
TOKEN="your_access_token_here"

# Upload transcript
curl -X POST "http://localhost:8000/api/rounds/{round_id}/transcript" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"

# Get signed URL
curl "http://localhost:8000/api/files/rounds/{round_id}/transcript/signed?disposition=inline" \
  -H "Authorization: Bearer $TOKEN"

# Delete transcript
curl -X DELETE "http://localhost:8000/api/rounds/{round_id}/transcript" \
  -H "Authorization: Bearer $TOKEN"
```

## Database Verification (Optional)

Check that the migration worked correctly:

```bash
cd backend
source .venv/bin/activate
python -c "
from app.core.database import get_db_sync
from app.models import Application, Round

db = get_db_sync()
# Check applications table has no transcript columns
app = db.query(Application).first()
print('Application has transcript_path:', hasattr(app, 'transcript_path'))

# Check rounds table has transcript columns
round_obj = db.query(Round).first()
if round_obj:
    print('Round has transcript_path:', hasattr(round_obj, 'transcript_path'))
    print('Round has transcript_summary:', hasattr(round_obj, 'transcript_summary'))
"
```

## Cleanup

After testing, you can delete test transcript files from `backend/uploads/transcript_*.pdf`.

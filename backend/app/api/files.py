import os

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_current_user_optional
from app.core.security import create_file_token, decode_file_token
from app.models import Application, User

router = APIRouter(prefix="/api/files", tags=["files"])


class SignedUrlResponse(BaseModel):
    url: str
    expires_in: int


@router.get("/{application_id}/{doc_type}/signed", response_model=SignedUrlResponse)
async def get_signed_url(
    application_id: str,
    doc_type: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a signed URL for file access."""
    if doc_type not in ("cv", "cover-letter", "transcript"):
        raise HTTPException(status_code=400, detail="Invalid document type")

    result = await db.execute(
        select(Application)
        .where(Application.id == application_id, Application.user_id == user.id)
    )
    application = result.scalars().first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    path_map = {
        "cv": application.cv_path,
        "cover-letter": application.cover_letter_path,
        "transcript": application.transcript_path,
    }

    if not path_map.get(doc_type):
        raise HTTPException(status_code=404, detail="File not found")

    token = create_file_token(application_id, doc_type, str(user.id))
    url = f"/api/files/{application_id}/{doc_type}?token={token}"

    return SignedUrlResponse(url=url, expires_in=300)


@router.get("/{application_id}/{doc_type}")
async def get_file(
    application_id: str,
    doc_type: str,
    token: str | None = Query(None),
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Serve a file. Accepts either auth header or signed token."""
    user_id = None

    # Try token-based auth first
    if token:
        payload = decode_file_token(token)
        if payload:
            if payload.get("application_id") != application_id:
                raise HTTPException(status_code=403, detail="Token mismatch")
            if payload.get("doc_type") != doc_type:
                raise HTTPException(status_code=403, detail="Token mismatch")
            user_id = payload.get("user_id")

    # Fall back to header-based auth
    if not user_id and user:
        user_id = str(user.id)

    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    result = await db.execute(
        select(Application)
        .where(Application.id == application_id, Application.user_id == user_id)
    )
    application = result.scalars().first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    path_map = {
        "cv": application.cv_path,
        "cover-letter": application.cover_letter_path,
        "transcript": application.transcript_path,
    }

    file_path = path_map.get(doc_type)
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        file_path,
        filename=os.path.basename(file_path),
        media_type="application/octet-stream",
    )

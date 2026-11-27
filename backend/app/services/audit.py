"""
Who did what. Entries are saved in the same transaction as the change itself.
"""
from __future__ import annotations

import json

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import AuditLog, User


def client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def record(
    db: AsyncSession,
    request: Request,
    action: str,
    *,
    user: User | None = None,
    tenant_id: str | None = None,
    details: dict | None = None,
) -> None:
    db.add(
        AuditLog(
            action=action,
            user_id=user.id if user else None,
            tenant_id=tenant_id or (user.tenant_id if user else None),
            details_json=json.dumps(details, ensure_ascii=False) if details else None,
            ip_address=client_ip(request),
        )
    )

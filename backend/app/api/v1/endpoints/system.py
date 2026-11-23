import os
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from backend.app.core.logging import APP_LOG_PATH, ERROR_LOG_PATH

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/logs")
async def get_system_logs(
    log_type: str = Query("app", pattern="^(app|error)$"),
    limit: int = Query(200, ge=1, le=1000),
    search: str | None = None,
    level: str | None = None,
):
    target_path = ERROR_LOG_PATH if log_type == "error" else APP_LOG_PATH

    if not target_path.exists():
        return {
            "logType": log_type,
            "totalLines": 0,
            "logs": [],
        }

    try:
        with open(target_path, "r", encoding="utf-8", errors="replace") as f:
            lines = f.readlines()

        # Reverse to get most recent logs first
        reversed_lines = lines[::-1]
        filtered = []

        for line in reversed_lines:
            line_str = line.strip()
            if not line_str:
                continue

            if level and f"| {level.upper()}" not in line_str:
                continue

            if search and search.lower() not in line_str.lower():
                continue

            filtered.append(line_str)
            if len(filtered) >= limit:
                break

        return {
            "logType": log_type,
            "filePath": str(target_path),
            "fileSizeKb": round(target_path.stat().st_size / 1024, 2),
            "totalLines": len(lines),
            "returnedCount": len(filtered),
            "logs": filtered,
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Log faylini o'qishda xatolik: {exc}")

@router.get("/logs/download")
async def download_system_logs(
    log_type: str = Query("app", pattern="^(app|error)$"),
):
    target_path = ERROR_LOG_PATH if log_type == "error" else APP_LOG_PATH

    if not target_path.exists():
        raise HTTPException(status_code=404, detail="Log fayli mavjud emas.")

    return FileResponse(
        path=target_path,
        filename=f"chsb_{log_type}.log",
        media_type="text/plain",
    )

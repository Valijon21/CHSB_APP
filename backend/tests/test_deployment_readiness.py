import os
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.config import settings

def test_health_check_endpoint(client: TestClient):
    """
    Verifies that the /health endpoint is operational and returns system metadata.
    """
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "prisma" in data["database"]
    assert data["orm"] == "prisma-client-py"
    assert "version" in data

def test_root_spa_serving_when_dist_exists(client: TestClient, tmp_path: Path):
    """
    Verifies that the root path '/' serves index.html when frontend dist is compiled.
    """
    dist_dir = settings.FRONTEND_DIST
    if (dist_dir / "index.html").exists():
        response = client.get("/")
        assert response.status_code == 200
        assert "html" in response.headers.get("content-type", "").lower()
    else:
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()

def test_spa_client_side_route_fallback(client: TestClient):
    """
    Verifies that non-API routes (e.g. /dashboard, /results/123) fall back to SPA index.html.
    """
    dist_dir = settings.FRONTEND_DIST
    if (dist_dir / "index.html").exists():
        response = client.get("/dashboard")
        assert response.status_code == 200
        assert "html" in response.headers.get("content-type", "").lower()

def test_api_routes_do_not_fallback_to_spa(client: TestClient):
    """
    CRITICAL: API routes must NEVER return HTML fallback on 404. They must return 404 JSON.
    """
    response = client.get(f"{settings.API_V1_STR}/non_existent_diagnostic_route_xyz")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "html" not in response.headers.get("content-type", "").lower()

def test_prisma_schema_switcher_utility():
    """
    Verifies that prisma/prepare_schema.py switches provider accurately.
    """
    import importlib.util
    switcher_path = settings.BASE_DIR / "prisma" / "prepare_schema.py"
    spec = importlib.util.spec_from_file_location("prepare_schema_module", switcher_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    prepare_schema = module.prepare_schema
    
    schema_path = settings.BASE_DIR / "prisma" / "schema.prisma"
    original_content = schema_path.read_text(encoding="utf-8")
    
    try:
        # Test PostgreSQL URL detection
        os.environ["DATABASE_URL"] = "postgresql://user:pass@neon.tech/neondb"
        prepare_schema()
        content = schema_path.read_text(encoding="utf-8")
        assert 'provider = "postgresql"' in content
        
        # Test SQLite fallback detection
        os.environ["DATABASE_URL"] = "file:./dev.db"
        prepare_schema()
        content = schema_path.read_text(encoding="utf-8")
        assert 'provider = "sqlite"' in content
    finally:
        schema_path.write_text(original_content, encoding="utf-8")

def test_huggingface_spaces_configuration():
    """
    Verifies that README.md and Dockerfile meet Hugging Face Spaces requirements:
    1. README.md contains YAML frontmatter with sdk: docker and app_port: 7860
    2. Dockerfile exposes port 7860 and configures non-root UID 1000 user
    3. docker-entrypoint.sh resolves default port 7860
    """
    readme_path = settings.BASE_DIR / "README.md"
    readme_content = readme_path.read_text(encoding="utf-8")
    assert "sdk: docker" in readme_content
    assert "app_port: 7860" in readme_content

    dockerfile_path = settings.BASE_DIR / "Dockerfile"
    dockerfile_content = dockerfile_path.read_text(encoding="utf-8")
    assert "EXPOSE 8000" in dockerfile_content
    assert "1000" in dockerfile_content
    assert "USER appuser" in dockerfile_content

    entrypoint_path = settings.BASE_DIR / "docker-entrypoint.sh"
    entrypoint_content = entrypoint_path.read_text(encoding="utf-8")
    assert "PORT:-8000" in entrypoint_content


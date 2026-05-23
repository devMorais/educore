import psycopg2
from pgvector.psycopg2 import register_vector
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


def get_connection():
    conn = psycopg2.connect(settings.database_url)
    register_vector(conn)
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                status VARCHAR(50) DEFAULT 'pending',
                progress_percent INTEGER DEFAULT 0,
                pages_processed INTEGER DEFAULT 0,
                total_pages INTEGER DEFAULT 0,
                gemini_file_uri TEXT,
                file_hash VARCHAR(64),
                rag_status VARCHAR(50) DEFAULT 'pending',
                user_id INTEGER,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        """)

        # Idempotent column additions for existing deployments
        for col, typ in [
            ("progress_percent", "INTEGER DEFAULT 0"),
            ("pages_processed", "INTEGER DEFAULT 0"),
            ("total_pages", "INTEGER DEFAULT 0"),
            ("gemini_file_uri", "TEXT"),
            ("file_hash", "VARCHAR(64)"),
            ("rag_status", "VARCHAR(50) DEFAULT 'pending'"),
        ]:
            cursor.execute(f"""
                DO $$ BEGIN
                    ALTER TABLE documents ADD COLUMN IF NOT EXISTS {col} {typ};
                EXCEPTION WHEN duplicate_column THEN NULL;
                END $$;
            """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS document_chunks (
                id SERIAL PRIMARY KEY,
                document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                embedding vector(3072),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS generations (
                id SERIAL PRIMARY KEY,
                document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
                type VARCHAR(50) NOT NULL,
                content JSONB NOT NULL,
                status VARCHAR(50) DEFAULT 'completed',
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)

        # Note: vector index skipped — pgvector requires <= 2000 dims for HNSW/IVFFlat
        # but Gemini embeddings are 3072. Sequential scan is used instead,
        # which is fast enough for this scale (< 100k chunks).
        # To enable indexing: upgrade to pgvector 0.8+ with halfvec support.

        # Index on file_hash for deduplication lookups
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_documents_file_hash
            ON documents (file_hash)
            WHERE file_hash IS NOT NULL;
        """)

        conn.commit()
        logger.info("Banco de dados inicializado com sucesso!")

    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao inicializar banco: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()
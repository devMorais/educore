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
        # Ativa a extensão pgvector
        cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")

        # Tabela de documentos
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                status VARCHAR(50) DEFAULT 'pending',
                user_id INTEGER,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        """)

        # Tabela de chunks com vetor
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS document_chunks (
                id SERIAL PRIMARY KEY,
                document_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                chunk_index INTEGER NOT NULL,
                embedding vector(768),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT NOW()
            );
        """)

        # Índice HNSW para busca rápida
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS chunks_embedding_idx
            ON document_chunks
            USING hnsw (embedding vector_cosine_ops);
        """)

        # Tabela de gerações
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

        conn.commit()
        logger.info("Banco de dados inicializado com sucesso!")

    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao inicializar banco: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()
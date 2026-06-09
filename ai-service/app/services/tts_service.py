"""
Serviço de Text-to-Speech (TTS) do conteúdo PCD (BS-016).

Gera áudio (MP3) do roteiro acessível para alunos com deficiência visual ou
dificuldade de leitura. Segue o mesmo padrão da BS-015 (LIBRAS): abstração de
provedor (Strategy) + fallback + resiliência.

Provedores:
  • gtts (GRÁTIS, padrão): gTTS (Google Translate TTS) — pt-BR, sem API key,
    lida com texto longo sozinho (não exige ffmpeg/pydub).
  • google_cloud (PAGO, opcional): Google Cloud TTS (vozes WaveNet/Neural2),
    qualidade premium; ativa só com GOOGLE_TTS_API_KEY. Faz chunk (≤5000) e
    concatena os MP3.

Se o provedor escolhido falhar, cai para o gTTS (grátis). Se o backend não
conseguir gerar, o FRONT ainda tem o fallback da Web Speech API (US-019).
"""

import io
import os
import re
import base64
import hashlib
import tempfile
import logging
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


def _run_async(coro_factory):
    """
    Executa uma corrotina de forma síncrona — inclusive quando já existe um event
    loop rodando (caso das rotas async do FastAPI). Nesse caso, roda numa thread
    própria com seu próprio loop, evitando o erro 'event loop is already running'.
    """
    import asyncio
    import concurrent.futures
    try:
        asyncio.get_running_loop()
        em_loop = True
    except RuntimeError:
        em_loop = False
    if em_loop:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as ex:
            return ex.submit(lambda: asyncio.run(coro_factory())).result()
    return asyncio.run(coro_factory())


def _limpar_roteiro(texto: str) -> str:
    """
    Prepara o roteiro para a fala: remove marcações que não devem ser lidas em
    voz alta e converte as pausas em pontuação natural.
    [IMAGEM: ...] → removido | [PAUSA LONGA] → ". " | [PAUSA CURTA] → ", "
    """
    if not texto:
        return ""
    t = re.sub(r"\[IMAGEM:[^\]]*\]", " ", texto, flags=re.IGNORECASE)
    t = re.sub(r"\[PAUSA\s+LONGA\]", ". ", t, flags=re.IGNORECASE)
    t = re.sub(r"\[PAUSA\s+CURTA\]", ", ", t, flags=re.IGNORECASE)
    t = re.sub(r"\[[^\]]*\]", " ", t)            # quaisquer outros marcadores
    t = re.sub(r"\s+([.,!?;:])", r"\1", t)        # espaço antes de pontuação
    t = re.sub(r"([.!?,;:])(?:\s*[.!?,;:])+", r"\1", t)  # colapsa pontuação adjacente
    t = re.sub(r"\s+", " ", t).strip()
    return t


def _chunk(texto: str, limite: int) -> list[str]:
    """Divide o texto em pedaços ≤ limite, quebrando em fim de frase quando dá."""
    if len(texto) <= limite:
        return [texto]
    partes: list[str] = []
    atual = ""
    for frase in re.split(r"(?<=[.!?])\s+", texto):
        if len(atual) + len(frase) + 1 > limite:
            if atual:
                partes.append(atual.strip())
            atual = frase
            while len(atual) > limite:        # frase isolada > limite
                partes.append(atual[:limite])
                atual = atual[limite:]
        else:
            atual = f"{atual} {frase}".strip()
    if atual:
        partes.append(atual.strip())
    return partes


# ─────────────────────────────────────────────── Providers (Strategy)
class _TTSProvider:
    name = "base"

    def synthesize(self, text: str, voice: str | None = None) -> bytes:
        raise NotImplementedError


class _GTTSProvider(_TTSProvider):
    """gTTS (gratuito) — voz pt-BR via Google Translate, sem API key."""
    name = "gtts"

    def synthesize(self, text: str, voice: str | None = None) -> bytes:
        from gtts import gTTS  # import tardio: só carrega se este provedor for usado
        buf = io.BytesIO()
        # tld="com.br" garante o sotaque do português brasileiro
        gTTS(text=text, lang="pt", tld="com.br", slow=False).write_to_fp(buf)
        return buf.getvalue()


class _EdgeProvider(_TTSProvider):
    """edge-tts (gratuito) — vozes NEURAIS da Microsoft Edge (alta qualidade, sem key)."""
    name = "edge"

    def __init__(self, voice: str):
        self.voice = voice

    def synthesize(self, text: str, voice: str | None = None) -> bytes:
        voz = voice or self.voice
        return _run_async(lambda: self._edge_async(text, voz))

    async def _edge_async(self, text: str, voz: str) -> bytes:
        import edge_tts
        audio = b""
        comm = edge_tts.Communicate(text, voz)
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                audio += chunk["data"]
        if not audio:
            raise RuntimeError("edge-tts não retornou áudio")
        return audio


class _GoogleCloudProvider(_TTSProvider):
    """Google Cloud TTS (pago) — vozes WaveNet/Neural2 de alta qualidade."""
    name = "google_cloud"

    def __init__(self, api_key: str, voice: str, voice_fallback: str,
                 lang: str, max_chars: int):
        self.api_key = api_key
        self.voice = voice
        self.voice_fallback = voice_fallback
        self.lang = lang
        self.max_chars = max_chars

    def synthesize(self, text: str, voice: str | None = None) -> bytes:
        voz = voice or self.voice
        audio = b""
        for parte in _chunk(text, self.max_chars):
            audio += self._synth_chunk(parte, voz)
        return audio

    def _synth_chunk(self, text: str, voz: str) -> bytes:
        url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={self.api_key}"
        payload = {
            "input": {"text": text},
            "voice": {"languageCode": self.lang, "name": voz},
            "audioConfig": {"audioEncoding": "MP3"},
        }
        resp = httpx.post(url, json=payload, timeout=30.0)
        # voz indisponível/erro de voz → tenta a voz de fallback (Standard) uma vez
        if resp.status_code == 400 and voz != self.voice_fallback:
            logger.warning(f"Voz '{voz}' indisponível; tentando '{self.voice_fallback}'.")
            return self._synth_chunk(text, self.voice_fallback)
        resp.raise_for_status()
        return base64.b64decode(resp.json()["audioContent"])


class TTSService:
    """Fachada usada pelo restante do app (instância: tts_service)."""

    def _provider(self) -> _TTSProvider:
        # Escala de qualidade: google_cloud (pago) → edge (neural grátis) → gtts (grátis estável)
        escolhido = (settings.tts_provider or "edge").strip().lower()
        if escolhido == "google_cloud":
            if settings.google_tts_api_key:
                return _GoogleCloudProvider(
                    settings.google_tts_api_key,
                    settings.google_tts_voice,
                    settings.google_tts_voice_fallback,
                    settings.tts_lang,
                    settings.tts_max_chars,
                )
            logger.warning(
                "TTS_PROVIDER=google_cloud, mas GOOGLE_TTS_API_KEY não foi definido; "
                "usando edge-tts (neural, gratuito) como fallback."
            )
            return _EdgeProvider(settings.edge_tts_voice)
        if escolhido == "gtts":
            return _GTTSProvider()
        return _EdgeProvider(settings.edge_tts_voice)  # padrão: melhor qualidade grátis

    def synthesize(self, text: str, voice: str | None = None) -> bytes:
        """Gera o MP3 (bytes) do texto. Cai para o gTTS se o provedor falhar."""
        texto = _limpar_roteiro(text)
        if not texto:
            raise ValueError("Texto vazio para síntese de voz.")
        provider = self._provider()
        try:
            return provider.synthesize(texto, voice)
        except Exception as e:
            if provider.name != "gtts":
                logger.warning(f"TTS '{provider.name}' falhou ({e}); fallback para gTTS.")
                return _GTTSProvider().synthesize(texto)
            raise

    # ── Cache em disco (evita refazer a síntese do mesmo roteiro) ──
    def _cache_dir(self) -> str:
        base = settings.tts_cache_dir or os.path.join(tempfile.gettempdir(), "educore_tts")
        os.makedirs(base, exist_ok=True)
        return base

    def cache_path(self, document_id: int, texto_limpo: str) -> str:
        h = hashlib.md5(texto_limpo.encode("utf-8")).hexdigest()[:10]
        return os.path.join(self._cache_dir(), f"tts_{document_id}_{h}.mp3")

    def get_or_synthesize(self, document_id: int, text: str) -> str:
        """Retorna o caminho do MP3 (do cache ou recém-gerado)."""
        texto = _limpar_roteiro(text)
        caminho = self.cache_path(document_id, texto)
        if os.path.exists(caminho) and os.path.getsize(caminho) > 0:
            logger.info(f"TTS cache hit: doc={document_id}")
            return caminho
        audio = self.synthesize(texto)
        with open(caminho, "wb") as f:
            f.write(audio)
        logger.info(f"TTS gerado via '{self._provider().name}': doc={document_id} ({len(audio)} bytes)")
        return caminho


tts_service = TTSService()

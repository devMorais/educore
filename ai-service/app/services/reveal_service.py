"""
RevealService — Generates Reveal.js HTML presentations.

Features:
  - Pexels API: background images auto-fetched per slide topic
  - GSAP: entrance animations on slide change
  - Phosphor Icons: modern icon set via CDN
  - 11 layout types (cover, objectives, content_bullets, two_column,
    section_divider, quote_highlight, assessment, summary,
    closing, stats_numbers, timeline)
  - accent_color per slide (blue / orange / green / purple)
  - Fragments: bullet points appear step-by-step on keypress
"""

import os
import html as _h
import logging
import threading
from typing import Optional

import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

# ── Palette ────────────────────────────────────────────────────────────────────

_ACCENTS: dict[str, tuple[str, str]] = {
    'blue':   ('#356df1', '#1d4ed8'),
    'orange': ('#f97316', '#ea580c'),
    'green':  ('#22c55e', '#16a34a'),
    'purple': ('#8b5cf6', '#7c3aed'),
}
_DEFAULT_ACCENT = ('#356df1', '#1d4ed8')

_GRADIENTS = [
    'linear-gradient(135deg,#1e1b4b,#312e81,#1e3a5f)',
    'linear-gradient(135deg,#0f172a,#1e293b,#0d1117)',
    'linear-gradient(135deg,#134e4a,#0f766e,#0f172a)',
    'linear-gradient(135deg,#1e1b4b,#4c1d95,#0f172a)',
    'linear-gradient(135deg,#450a0a,#7f1d1d,#1a1a2e)',
    'linear-gradient(135deg,#052e16,#14532d,#0f172a)',
    'linear-gradient(135deg,#1c1917,#292524,#0c0a09)',
]

_ICONS = {
    'cover':           'ph-presentation-chart',
    'objectives':      'ph-target',
    'content_bullets': 'ph-list-bullets',
    'two_column':      'ph-columns',
    'section_divider': 'ph-arrow-circle-right',
    'quote_highlight': 'ph-quotes',
    'assessment':      'ph-question',
    'summary':         'ph-bookmark-simple',
    'closing':         'ph-check-circle',
    'stats_numbers':   'ph-chart-bar',
    'timeline':        'ph-clock-countdown',
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def _e(v) -> str:
    return _h.escape(str(v or ''))


def _ac(s: dict) -> tuple[str, str]:
    return _ACCENTS.get(s.get('accent_color', ''), _DEFAULT_ACCENT)


# ── Service ────────────────────────────────────────────────────────────────────

class RevealService:

    def __init__(self):
        self._img_cache: dict[str, str] = {}

    # ── Public API ─────────────────────────────────────────────────────────────

    def generate(self, title: str, slides: list, output_path: str) -> str:
        sections = [
            self._section(s, title, i, len(slides))
            for i, s in enumerate(slides)
        ]
        html = _TEMPLATE.replace('__TITLE__', _e(title)).replace(
            '__SLIDES__', '\n'.join(sections)
        )
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html)
        threading.Timer(600, self._rm, args=[output_path]).start()
        return output_path

    # ── Pexels image fetch ─────────────────────────────────────────────────────

    def _pexels(self, query: str) -> Optional[str]:
        key = settings.pexels_api_key
        if not key:
            return None
        ckey = query.lower().strip()[:60]
        if ckey in self._img_cache:
            return self._img_cache[ckey]
        try:
            r = httpx.get(
                'https://api.pexels.com/v1/search',
                headers={'Authorization': key},
                params={'query': query, 'orientation': 'landscape', 'per_page': 1},
                timeout=5.0,
            )
            photos = r.json().get('photos', [])
            if photos:
                url = photos[0]['src']['large2x']
                self._img_cache[ckey] = url
                return url
        except Exception as exc:
            logger.debug('Pexels [%r]: %s', query, exc)
        return None

    def _bg(self, s: dict, pt: str, idx: int, opacity: float = 0.4) -> str:
        q = (s.get('visual_suggestion') or s.get('title') or pt or 'education')
        q = q.split('.')[0][:60]
        img = self._pexels(q)
        if img:
            return (
                f'data-background-image="{img}" '
                f'data-background-opacity="{opacity}" '
                f'data-background-size="cover" '
                f'data-background-position="center"'
            )
        return f'data-background-gradient="{_GRADIENTS[idx % len(_GRADIENTS)]}"'

    # ── Footer ─────────────────────────────────────────────────────────────────

    def _footer(self, idx: int, total: int, a: str) -> str:
        if idx in (0, total - 1):
            return ''
        return (
            '<div class="ec-footer">'
            '<span class="ec-footer__brand">EduCore</span>'
            f'<span class="ec-footer__page" style="color:{a}">{idx + 1} / {total}</span>'
            '</div>'
        )

    # ── Section dispatcher ─────────────────────────────────────────────────────

    def _section(self, s: dict, pt: str, idx: int, total: int) -> str:
        layout = (s.get('layout') or 'content_bullets').lower()
        if layout in ('cover', 'closing'):
            return self._cover(s, pt, idx, total)
        if layout == 'section_divider':
            return self._divider(s, pt, idx, total)
        if layout == 'two_column':
            return self._two_col(s, pt, idx, total)
        if layout == 'quote_highlight':
            return self._quote(s, pt, idx, total)
        if layout == 'assessment':
            return self._assessment(s, pt, idx, total)
        if layout == 'stats_numbers':
            return self._stats(s, pt, idx, total)
        if layout == 'timeline':
            return self._timeline(s, pt, idx, total)
        # objectives, content_bullets, summary → bullets
        return self._bullets(s, pt, idx, total)

    # ── Cover / Closing ────────────────────────────────────────────────────────

    def _cover(self, s: dict, pt: str, idx: int, total: int) -> str:
        a, ad  = _ac(s)
        title  = _e(s.get('title') or pt)
        sub    = _e(s.get('subtitle') or '')
        et     = s.get('estimated_time_minutes') or (total * 2)
        icon   = _ICONS.get((s.get('layout') or 'cover').lower(), 'ph-presentation-chart')
        bg     = self._bg(s, pt, idx, 0.35)
        sub_h  = f'<p class="ec-cover__sub fragment fade-up">{sub}</p>' if sub else ''
        return (
            f'<section class="ec-cover" {bg}>'
            f'<div class="ec-cover__veil" style="background:linear-gradient(160deg,{a}1a 0%,rgba(0,0,0,.72) 100%)"></div>'
            f'<div class="ec-cover__body">'
            f'<div class="ec-badge fragment fade-up" style="border-color:{a};color:{a}">'
            f'<i class="ph {icon}"></i> Apresentação EduCore</div>'
            f'<h1 class="ec-cover__h1 fragment fade-up">{title}</h1>'
            f'{sub_h}'
            f'<div class="ec-cover__meta fragment fade-up">'
            f'<span><i class="ph ph-stack"></i> {total} slides</span>'
            f'<span><i class="ph ph-clock"></i> ~{et} min</span>'
            f'</div></div>'
            f'<div class="ec-cover__bar" style="background:linear-gradient(90deg,{a},{ad})"></div>'
            f'</section>'
        )

    # ── Section divider ────────────────────────────────────────────────────────

    def _divider(self, s: dict, pt: str, idx: int, total: int) -> str:
        a, ad = _ac(s)
        title = _e(s.get('title') or '')
        sub   = _e(s.get('subtitle') or '')
        bg    = self._bg(s, pt, idx, 0.45)
        sub_h = f'<p class="ec-divider__sub fragment fade-up">{sub}</p>' if sub else ''
        return (
            f'<section class="ec-divider has-dark-background" {bg}>'
            f'<div class="ec-divider__veil" style="background:linear-gradient(135deg,{a}cc,{ad}88)"></div>'
            f'<div class="ec-divider__body">'
            f'<div class="ec-divider__line fragment fade-up" style="background:{a}"></div>'
            f'<h2 class="ec-divider__h2 fragment fade-up">{title}</h2>'
            f'{sub_h}'
            f'</div></section>'
        )

    # ── Content bullets ────────────────────────────────────────────────────────

    def _bullets(self, s: dict, pt: str, idx: int, total: int) -> str:
        a, _  = _ac(s)
        title = _e(s.get('title') or '')
        items = s.get('content') or []
        layout = (s.get('layout') or 'content_bullets').lower()
        icon  = _ICONS.get(layout, 'ph-list-bullets')
        bg    = self._bg(s, pt, idx, 0.07)
        li_html = ''.join(
            f'<li class="fragment fade-left">'
            f'<span class="ec-dot" style="background:{a}"><i class="ph ph-caret-right-bold"></i></span>'
            f'{_e(it)}</li>'
            for it in items[:8]
        )
        return (
            f'<section class="ec-slide" {bg}>'
            f'<div class="ec-inner">'
            f'<div class="ec-head">'
            f'<div class="ec-head__icon fragment fade-right" style="background:{a}22;color:{a}">'
            f'<i class="ph {icon}"></i></div>'
            f'<h2 class="ec-head__h2 fragment fade-right" style="color:{a}">{title}</h2>'
            f'</div>'
            f'<ul class="ec-list">{li_html}</ul>'
            f'</div>'
            f'{self._footer(idx, total, a)}'
            f'</section>'
        )

    # ── Two column ─────────────────────────────────────────────────────────────

    def _two_col(self, s: dict, pt: str, idx: int, total: int) -> str:
        a, _  = _ac(s)
        title = _e(s.get('title') or '')
        cols  = s.get('columns') or {}
        left  = cols.get('left') or s.get('content', [])[:4]
        right = cols.get('right') or s.get('content', [])[4:]
        bg    = self._bg(s, pt, idx, 0.07)

        def col_items(lst):
            return ''.join(
                f'<li class="fragment fade-up">'
                f'<i class="ph ph-check" style="color:{a}"></i>{_e(it)}</li>'
                for it in lst[:5]
            )

        return (
            f'<section class="ec-slide" {bg}>'
            f'<div class="ec-inner">'
            f'<h2 class="ec-two__h2 fragment fade-down" style="color:{a}">{title}</h2>'
            f'<div class="ec-two__grid">'
            f'<div class="ec-col fragment fade-right" style="border-color:{a}33">'
            f'<ul class="ec-col__ul">{col_items(left)}</ul></div>'
            f'<div class="ec-col fragment fade-left" style="border-color:{a}33">'
            f'<ul class="ec-col__ul">{col_items(right)}</ul></div>'
            f'</div></div>'
            f'{self._footer(idx, total, a)}'
            f'</section>'
        )

    # ── Quote ──────────────────────────────────────────────────────────────────

    def _quote(self, s: dict, pt: str, idx: int, total: int) -> str:
        a, _  = _ac(s)
        title = _e(s.get('title') or '')
        quote = _e(s.get('quote') or (s.get('content') or [''])[0])
        src   = _e(s.get('subtitle') or '')
        bg    = self._bg(s, pt, idx, 0.12)
        src_h = (
            f'<cite class="ec-quote__src fragment fade-up" style="color:{a}">— {src}</cite>'
            if src else ''
        )
        return (
            f'<section class="ec-slide ec-quote-slide" {bg}>'
            f'<div class="ec-quote__body">'
            f'<div class="ec-quote__mark fragment fade-down" style="color:{a}">'
            f'<i class="ph ph-quotes"></i></div>'
            f'<blockquote class="ec-quote__text fragment fade-up">&ldquo;{quote}&rdquo;</blockquote>'
            f'{src_h}'
            f'<p class="ec-quote__ctx fragment fade-up">{title}</p>'
            f'</div>'
            f'{self._footer(idx, total, a)}'
            f'</section>'
        )

    # ── Assessment ─────────────────────────────────────────────────────────────

    def _assessment(self, s: dict, pt: str, idx: int, total: int) -> str:
        a, _  = _ac(s)
        title = _e(s.get('title') or '')
        nums  = [
            'ph-number-circle-one', 'ph-number-circle-two', 'ph-number-circle-three',
            'ph-number-circle-four', 'ph-number-circle-five', 'ph-number-circle-six',
        ]
        bg    = self._bg(s, pt, idx, 0.07)
        items = ''.join(
            f'<div class="ec-assess__item fragment fade-up" style="border-left-color:{a}">'
            f'<i class="ph {nums[min(i, 5)]}" style="color:{a}"></i>'
            f'<span>{_e(it)}</span></div>'
            for i, it in enumerate(s.get('content', [])[:6])
        )
        return (
            f'<section class="ec-slide" {bg}>'
            f'<div class="ec-inner">'
            f'<div class="ec-assess__hdr">'
            f'<div class="ec-assess__badge fragment fade-down" style="background:{a}22;color:{a}">'
            f'<i class="ph ph-question"></i> Verificação de Aprendizagem</div>'
            f'<h2 class="ec-head__h2 fragment fade-up" style="color:{a}">{title}</h2>'
            f'</div>'
            f'<div class="ec-assess__grid">{items}</div>'
            f'</div>'
            f'{self._footer(idx, total, a)}'
            f'</section>'
        )

    # ── Stats / Numbers ────────────────────────────────────────────────────────

    def _stats(self, s: dict, pt: str, idx: int, total: int) -> str:
        a, _  = _ac(s)
        title = _e(s.get('title') or '')
        stats = list(s.get('stats') or [])
        if not stats:
            for it in s.get('content', [])[:4]:
                if '—' in it:
                    p = it.split('—', 1)
                elif ':' in it:
                    p = it.split(':', 1)
                else:
                    p = [it[:20], it[20:]]
                stats.append({'value': p[0].strip(), 'label': p[1].strip() if len(p) > 1 else ''})
        bg    = self._bg(s, pt, idx, 0.08)
        cards = ''.join(
            f'<div class="ec-stat fragment fade-up" style="border-top-color:{a}">'
            f'<div class="ec-stat__val" style="color:{a}">{_e(str(st.get("value", "")))}</div>'
            f'<div class="ec-stat__lbl">{_e(str(st.get("label", "")))}</div></div>'
            for st in stats[:4]
        )
        return (
            f'<section class="ec-slide" {bg}>'
            f'<div class="ec-inner">'
            f'<h2 class="ec-head__h2 fragment fade-down" style="color:{a}">{title}</h2>'
            f'<div class="ec-stats__grid">{cards}</div>'
            f'</div>'
            f'{self._footer(idx, total, a)}'
            f'</section>'
        )

    # ── Timeline ───────────────────────────────────────────────────────────────

    def _timeline(self, s: dict, pt: str, idx: int, total: int) -> str:
        a, _   = _ac(s)
        title  = _e(s.get('title') or '')
        events = list(s.get('events') or [])
        if not events:
            events = [{'year': '', 'desc': it} for it in s.get('content', [])[:6]]
        bg     = self._bg(s, pt, idx, 0.08)
        items  = ''
        for e in events[:6]:
            if isinstance(e, dict):
                yr   = _e(str(e.get('year', '') or ''))
                desc = _e(str(e.get('desc', '') or ''))
            else:
                yr, desc = '', _e(str(e))
            yr_h = f'<span class="ec-tl__yr" style="color:{a}">{yr}</span>' if yr else ''
            items += (
                f'<div class="ec-tl__item fragment fade-right">'
                f'<div class="ec-tl__dot" style="background:{a};box-shadow:0 0 0 4px {a}33"></div>'
                f'{yr_h}'
                f'<span class="ec-tl__desc">{desc}</span>'
                f'</div>'
            )
        return (
            f'<section class="ec-slide" {bg}>'
            f'<div class="ec-inner">'
            f'<h2 class="ec-head__h2 fragment fade-down" style="color:{a}">{title}</h2>'
            f'<div class="ec-tl">'
            f'<div class="ec-tl__line" style="background:{a}33"></div>'
            f'{items}'
            f'</div></div>'
            f'{self._footer(idx, total, a)}'
            f'</section>'
        )

    # ── Cleanup ────────────────────────────────────────────────────────────────

    def _rm(self, path: str):
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception:
            pass


reveal_service = RevealService()


# ── HTML Template ──────────────────────────────────────────────────────────────

_TEMPLATE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0">
<title>__TITLE__</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/regular/style.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/bold/style.css">
<style>
:root {
  --bg:      #0f172a;
  --surface: rgba(255,255,255,.065);
  --border:  rgba(255,255,255,.10);
  --text:    #f1f5f9;
  --muted:   #94a3b8;
  --r:       12px;
  --font:    'Inter', system-ui, -apple-system, sans-serif;
}
*, *::before, *::after { box-sizing: border-box; }
body, html { margin: 0; padding: 0; background: var(--bg); }

/* ── Reveal base ─────────────────────────────────────────── */
.reveal {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
}
.reveal .slides section {
  text-align: left;
  color: var(--text);
  font-family: var(--font);
  padding: 0;
  top: 0 !important;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.reveal h1,.reveal h2,.reveal h3 {
  font-family: var(--font);
  text-transform: none;
  letter-spacing: -.02em;
  color: inherit;
  margin: 0;
}
.reveal p,.reveal li,.reveal blockquote { font-family: var(--font); }
.reveal .progress { height: 3px; }
.reveal .controls { bottom: 10px; right: 10px; }
.reveal blockquote {
  background: transparent;
  box-shadow: none;
  width: 100%;
  text-align: center;
  border: none;
  padding: 0;
  margin: 0;
}

/* ── COVER ───────────────────────────────────────────────── */
.ec-cover {
  position: relative !important;
  justify-content: flex-end !important;
  background: var(--bg);
}
.ec-cover__veil {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.ec-cover__body {
  position: relative;
  z-index: 1;
  padding: 0 3.5rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 940px;
}
.ec-badge {
  display: inline-flex;
  align-items: center;
  gap: .45rem;
  border: 1.5px solid;
  padding: .3rem 1rem;
  border-radius: 50px;
  font-size: .78rem;
  font-weight: 600;
  backdrop-filter: blur(8px);
  background: rgba(0,0,0,.3);
  width: fit-content;
  color: inherit;
}
.ec-cover__h1 {
  font-size: clamp(2rem,4.8vw,3.4rem);
  font-weight: 900;
  line-height: 1.1;
  color: #fff !important;
  text-shadow: 0 2px 24px rgba(0,0,0,.65);
}
.ec-cover__sub {
  font-size: clamp(.95rem,1.8vw,1.3rem);
  color: rgba(255,255,255,.82);
  margin: 0;
  font-weight: 400;
}
.ec-cover__meta {
  display: flex;
  gap: 1.5rem;
  font-size: .82rem;
  color: rgba(255,255,255,.65);
  align-items: center;
  flex-wrap: wrap;
}
.ec-cover__meta span {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
}
.ec-cover__bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 4px;
  z-index: 2;
}

/* ── DIVIDER ─────────────────────────────────────────────── */
.ec-divider {
  position: relative !important;
  background: var(--bg);
}
.ec-divider__veil {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.ec-divider__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 3rem;
  gap: 1.1rem;
}
.ec-divider__line {
  width: 80px;
  height: 4px;
  border-radius: 4px;
  flex-shrink: 0;
}
.ec-divider__h2 {
  font-size: clamp(1.9rem,4vw,3rem);
  font-weight: 900;
  color: #fff !important;
  text-shadow: 0 2px 20px rgba(0,0,0,.55);
  line-height: 1.15;
  max-width: 820px;
}
.ec-divider__sub {
  font-size: clamp(.95rem,1.6vw,1.2rem);
  color: rgba(255,255,255,.8);
  max-width: 620px;
  margin: 0;
}

/* ── CONTENT SLIDES ──────────────────────────────────────── */
.ec-slide { background: var(--bg); }
.ec-inner {
  padding: 2rem 2.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  flex: 1;
  overflow: hidden;
}
.ec-head {
  display: flex;
  align-items: center;
  gap: .85rem;
  flex-shrink: 0;
}
.ec-head__icon {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.ec-head__h2 {
  font-size: clamp(1.25rem,2.4vw,1.9rem);
  font-weight: 800;
  line-height: 1.2;
}

/* ── BULLETS ─────────────────────────────────────────────── */
.ec-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: .65rem;
  flex: 1;
  overflow: hidden;
}
.ec-list li {
  display: flex;
  align-items: flex-start;
  gap: .7rem;
  font-size: clamp(.85rem,1.4vw,1.05rem);
  line-height: 1.6;
  color: var(--text);
}
.ec-dot {
  min-width: 1.45rem;
  height: 1.45rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .65rem;
  color: #fff;
  flex-shrink: 0;
  margin-top: .18rem;
}

/* ── TWO COLUMN ──────────────────────────────────────────── */
.ec-two__h2 {
  font-size: clamp(1.2rem,2.2vw,1.7rem);
  font-weight: 800;
  flex-shrink: 0;
}
.ec-two__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.ec-col {
  background: var(--surface);
  border: 1px solid;
  border-radius: var(--r);
  padding: 1.2rem 1.4rem;
  backdrop-filter: blur(8px);
  overflow: hidden;
}
.ec-col__ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: .6rem;
}
.ec-col__ul li {
  display: flex;
  align-items: flex-start;
  gap: .5rem;
  font-size: clamp(.78rem,1.2vw,.95rem);
  line-height: 1.55;
  color: var(--text);
}
.ec-col__ul i { margin-top: .18rem; flex-shrink: 0; }

/* ── QUOTE ───────────────────────────────────────────────── */
.ec-quote-slide { justify-content: center !important; }
.ec-quote__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 3rem 4rem;
  gap: 1rem;
  height: 100%;
}
.ec-quote__mark {
  font-size: 4rem;
  line-height: 1;
  opacity: .45;
}
.ec-quote__text {
  font-size: clamp(1rem,1.9vw,1.55rem);
  font-weight: 500;
  font-style: italic;
  line-height: 1.7;
  color: var(--text);
  max-width: 820px;
}
.ec-quote__src {
  font-size: .82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .1em;
  font-style: normal;
}
.ec-quote__ctx {
  font-size: .75rem;
  color: var(--muted);
  margin: 0;
}

/* ── ASSESSMENT ──────────────────────────────────────────── */
.ec-assess__hdr {
  display: flex;
  flex-direction: column;
  gap: .55rem;
  flex-shrink: 0;
}
.ec-assess__badge {
  display: inline-flex;
  align-items: center;
  gap: .5rem;
  padding: .32rem 1rem;
  border-radius: 50px;
  font-size: .77rem;
  font-weight: 700;
  width: fit-content;
}
.ec-assess__grid {
  display: flex;
  flex-direction: column;
  gap: .6rem;
  flex: 1;
  overflow: hidden;
}
.ec-assess__item {
  display: flex;
  align-items: center;
  gap: .75rem;
  padding: .6rem 1rem;
  background: var(--surface);
  border-left: 3px solid;
  border-radius: 0 var(--r) var(--r) 0;
  font-size: clamp(.78rem,1.3vw,.97rem);
  line-height: 1.5;
  color: var(--text);
  backdrop-filter: blur(6px);
}
.ec-assess__item i { font-size: 1.15rem; flex-shrink: 0; }

/* ── STATS ───────────────────────────────────────────────── */
.ec-stats__grid {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 1.15rem;
  flex: 1;
  min-height: 0;
}
.ec-stat {
  background: var(--surface);
  border-top: 3px solid;
  border-radius: var(--r);
  padding: 1.4rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  backdrop-filter: blur(8px);
  text-align: center;
}
.ec-stat__val {
  font-size: clamp(1.8rem,3.2vw,2.7rem);
  font-weight: 900;
  line-height: 1;
}
.ec-stat__lbl {
  font-size: .75rem;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .08em;
}

/* ── TIMELINE ────────────────────────────────────────────── */
.ec-tl {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: .85rem;
  padding-left: 2.2rem;
  flex: 1;
  overflow: hidden;
}
.ec-tl__line {
  position: absolute;
  left: .65rem;
  top: .7rem;
  bottom: 0;
  width: 2px;
  border-radius: 1px;
}
.ec-tl__item {
  display: flex;
  align-items: flex-start;
  gap: .85rem;
  position: relative;
}
.ec-tl__dot {
  position: absolute;
  left: -2.2rem;
  top: .35rem;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  flex-shrink: 0;
}
.ec-tl__yr {
  font-size: .8rem;
  font-weight: 700;
  min-width: 58px;
  flex-shrink: 0;
  padding-top: .05rem;
}
.ec-tl__desc {
  font-size: clamp(.78rem,1.3vw,.97rem);
  line-height: 1.55;
  color: var(--text);
}

/* ── FOOTER ──────────────────────────────────────────────── */
.ec-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: .5rem 2.5rem .7rem;
  font-size: .7rem;
  color: var(--muted);
  border-top: 1px solid var(--border);
  margin-top: auto;
  flex-shrink: 0;
}
.ec-footer__brand {
  font-weight: 700;
  letter-spacing: .07em;
  text-transform: uppercase;
  opacity: .55;
}
.ec-footer__page { font-weight: 700; }

/* ── Fragment + GSAP ─────────────────────────────────────── */
.reveal .fragment { will-change: transform, opacity; }
</style>
</head>
<body>

<div class="reveal">
  <div class="slides">
    __SLIDES__
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script>
Reveal.initialize({
  hash: true,
  progress: true,
  controls: true,
  controlsTutorial: false,
  center: false,
  transition: 'slide',
  transitionSpeed: 'default',
  backgroundTransition: 'fade',
  keyboard: true,
  touch: true,
  mouseWheel: false,
  fragments: true,
  width: 1280,
  height: 720,
  margin: 0,
  minScale: 0.1,
  maxScale: 2.0,
});

function animateIn(slide) {
  var targets = slide.querySelectorAll(
    '.ec-cover__body, .ec-divider__body, .ec-inner, .ec-quote__body'
  );
  if (!targets.length) return;
  gsap.fromTo(
    targets,
    { opacity: 0, y: 45 },
    { opacity: 1, y: 0, duration: 0.65, stagger: 0.08,
      ease: 'power3.out', clearProps: 'all' }
  );
}

Reveal.on('ready',       function(e) { animateIn(e.currentSlide); });
Reveal.on('slidechanged',function(e) { animateIn(e.currentSlide); });
</script>

</body>
</html>"""

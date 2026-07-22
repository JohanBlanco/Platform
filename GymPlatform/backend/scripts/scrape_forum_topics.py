#!/usr/bin/env python3
"""Scrape EresFitness guide pages into forum-exercise-topics.json"""

from __future__ import annotations

import json
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from urllib.parse import urljoin

import html2text
import requests
from bs4 import BeautifulSoup

CATALOG = Path(__file__).resolve().parents[1] / "src/main/resources/exercise-catalog-eresfitness.json"
OUT = Path(__file__).resolve().parents[1] / "src/main/resources/forum-exercise-topics.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
}
SESSION = requests.Session()
SESSION.headers.update(HEADERS)

EXCLUDE_IMG_RE = re.compile(
    r"(logo|favicon|icon|sprite|avatar|banner-cookie|cookie|badge|emoji|button|wp-includes)",
    re.I,
)
VIDEO_RE = re.compile(r"https://eresfitness\.com/wp-content/uploads/[^\s\"'<>]+\.mp4", re.I)
IMG_RE = re.compile(
    r"https://eresfitness\.com/wp-content/uploads/[^\s\"'<>]+\.(?:jpg|jpeg|png|webp)",
    re.I,
)

STOP_SECTIONS = (
    "te puede interesar",
    "ejercicios similares",
    "también te puede interesar",
    "relacionados",
)


def fetch(url: str, retries: int = 3) -> str | None:
    for attempt in range(retries):
        try:
            r = SESSION.get(url, timeout=30)
            if r.status_code == 200:
                return r.text
            if r.status_code in (429, 503):
                time.sleep(2 * (attempt + 1))
                continue
            return None
        except requests.RequestException:
            time.sleep(1.5 * (attempt + 1))
    return None


def meta_content(soup: BeautifulSoup, *props: str) -> str:
    for prop in props:
        tag = soup.find("meta", property=prop) or soup.find("meta", attrs={"name": prop})
        if tag and tag.get("content"):
            return tag["content"].strip()
    return ""


def pick_image(soup: BeautifulSoup, html: str, video_url: str) -> str:
    for src in (
        meta_content(soup, "og:image", "og:image:secure_url"),
        meta_content(soup, "twitter:image", "twitter:image:src"),
    ):
        if src and not EXCLUDE_IMG_RE.search(src):
            if src.startswith("//"):
                src = "https:" + src
            return src

    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or ""
        if not src:
            continue
        src = urljoin("https://eresfitness.com/", src)
        if not IMG_RE.search(src):
            continue
        if EXCLUDE_IMG_RE.search(src):
            continue
        # skip tiny/tracking
        alt = (img.get("alt") or "").lower()
        if "logo" in alt:
            continue
        return src

    for m in IMG_RE.finditer(html):
        src = m.group(0)
        if not EXCLUDE_IMG_RE.search(src):
            return src

    if video_url.endswith(".mp4"):
        return video_url[:-4] + ".jpg"
    return ""


def pick_video(html: str, catalog_video: str) -> str:
    if catalog_video and catalog_video.strip():
        return catalog_video.strip()
    m = VIDEO_RE.search(html)
    return m.group(0) if m else ""


def clean_body(soup: BeautifulSoup) -> str:
    article = (
        soup.find("article")
        or soup.select_one(".entry-content")
        or soup.select_one(".post-content")
        or soup.select_one("main")
        or soup.body
    )
    if article is None:
        return ""

    # Work on a copy subtree
    root = BeautifulSoup(str(article), "lxml")

    for sel in (
        "nav",
        "header",
        "footer",
        "aside",
        "script",
        "style",
        "noscript",
        "iframe",
        "form",
        ".sharedaddy",
        ".jp-relatedposts",
        ".related-posts",
        ".yarpp-related",
        "#toc_container",
        ".toc",
        ".ez-toc-container",
        ".breadcrumbs",
        ".cookie",
        "#cookie",
        ".cmplz-",
        ".cky-",
        ".advertisement",
        ".ads",
        ".sidebar",
        ".wp-block-yoast-faq-block",
    ):
        for el in root.select(sel):
            el.decompose()

    # Remove elements whose heading text indicates related/footer sections
    for h in root.find_all(re.compile(r"^h[1-6]$")):
        text = h.get_text(" ", strip=True).lower()
        if any(s in text for s in STOP_SECTIONS):
            # remove this heading and following siblings until next h2 or end
            sib = h.next_sibling
            while sib is not None:
                nxt = sib.next_sibling
                if getattr(sib, "name", None) and re.match(r"^h[12]$", sib.name or ""):
                    break
                if hasattr(sib, "decompose"):
                    sib.decompose()
                else:
                    try:
                        sib.extract()
                    except Exception:
                        pass
                sib = nxt
            h.decompose()

    # Also strip nodes that start with "Te puede interesar"
    for el in list(root.find_all(string=True)):
        t = str(el).strip().lower()
        if t.startswith("te puede interesar") or t.startswith("gestionar consentimiento"):
            parent = el.parent
            if parent and parent.name not in ("html", "body"):
                # remove from this element onward if it's a section wrapper
                parent.decompose()

    # Remove video/source tags (keep text)
    for el in root.find_all(["video", "source", "figure"]):
        # keep figure captions as text; drop media-only figures if empty of text
        if el.name in ("video", "source"):
            el.decompose()

    # Drop tables of metadata (Nivel / Músculo etc.) — optional keep? user asked intro+cómo+consejos
    # Keep them out for cleaner forum body
    for table in root.find_all("table"):
        rows = table.get_text(" ", strip=True).lower()
        if "músculo" in rows or "nivel" in rows or "equipo" in rows:
            table.decompose()

    converter = html2text.HTML2Text()
    converter.ignore_links = True
    converter.ignore_images = True
    converter.ignore_emphasis = False
    converter.body_width = 0
    converter.ul_item_mark = "-"
    md = converter.handle(str(root))

    # Post-process markdown
    lines = []
    skip = False
    for line in md.splitlines():
        low = line.strip().lower()
        if any(low.startswith(s) or low == f"## {s}" or low.startswith(f"## {s}") for s in STOP_SECTIONS):
            skip = True
            continue
        if skip:
            if line.startswith("## ") and not any(s in low for s in STOP_SECTIONS):
                skip = False
            else:
                continue
        if "tabla de contenidos" in low:
            continue
        if "descarga nuestra app" in low:
            continue
        if "gestionar consentimiento" in low:
            continue
        if "copyright ©" in low:
            continue
        if low in ("buscar", "- - buscar", "- buscar"):
            continue
        # drop bare mp4 urls
        if VIDEO_RE.fullmatch(line.strip()):
            continue
        lines.append(line)

    # Collapse excessive blank lines
    text = "\n".join(lines)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text


def process_entry(entry: dict) -> dict:
    name = entry["name"]
    muscle = entry["muscleGroup"]
    guide = entry.get("guideUrl") or ""
    catalog_video = (entry.get("videoUrl") or "").strip()

    result = {
        "name": name,
        "muscleGroup": muscle,
        "sourceUrl": guide,
        "imageUrl": "",
        "videoUrl": catalog_video,
        "bodyMarkdown": "",
    }

    if not guide:
        result["bodyMarkdown"] = "No se pudo obtener el contenido automáticamente."
        return result

    html = fetch(guide)
    if not html:
        result["bodyMarkdown"] = "No se pudo obtener el contenido automáticamente."
        if catalog_video.endswith(".mp4"):
            result["imageUrl"] = catalog_video[:-4] + ".jpg"
        return result

    soup = BeautifulSoup(html, "lxml")
    video = pick_video(html, catalog_video)
    image = pick_image(soup, html, video)
    body = clean_body(soup)

    if not body or len(body) < 40:
        body = "No se pudo obtener el contenido automáticamente."

    result["videoUrl"] = video
    result["imageUrl"] = image
    result["bodyMarkdown"] = body
    return result


def main() -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    entries = [e for e in catalog if e.get("guideUrl")]
    print(f"Processing {len(entries)} entries...", flush=True)

    results: list[dict | None] = [None] * len(entries)
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(process_entry, e): i for i, e in enumerate(entries)}
        done = 0
        for fut in as_completed(futures):
            i = futures[fut]
            try:
                results[i] = fut.result()
            except Exception as ex:
                e = entries[i]
                results[i] = {
                    "name": e["name"],
                    "muscleGroup": e["muscleGroup"],
                    "sourceUrl": e.get("guideUrl", ""),
                    "imageUrl": "",
                    "videoUrl": (e.get("videoUrl") or "").strip(),
                    "bodyMarkdown": "No se pudo obtener el contenido automáticamente.",
                }
                print(f"ERR {e['name']}: {ex}", flush=True)
            done += 1
            if done % 10 == 0 or done == len(entries):
                print(f"  {done}/{len(entries)}", flush=True)

    OUT.write_text(
        json.dumps(results, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    ok = sum(1 for r in results if r and "No se pudo" not in r["bodyMarkdown"])
    print(f"Wrote {len(results)} entries to {OUT} ({ok} with content)", flush=True)


if __name__ == "__main__":
    main()

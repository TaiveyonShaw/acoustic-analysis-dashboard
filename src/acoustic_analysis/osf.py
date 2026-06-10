"""OSF API client for browsing and downloading thestruct MAT files."""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass

OSF_API_BASE = "https://api.osf.io/v2"
DEFAULT_OSF_NODE_ID = "xnr9f"


@dataclass(frozen=True)
class OsfFolder:
    id: str
    name: str
    label: str


@dataclass(frozen=True)
class OsfFile:
    id: str
    name: str
    size: int
    download_url: str


class OsfError(Exception):
    pass


def _node_id(node_id: str | None = None) -> str:
    return node_id or os.getenv("OSF_NODE_ID", DEFAULT_OSF_NODE_ID)


def _folder_label(name: str) -> str:
    if name.endswith("_thestructs"):
        return name[: -len("_thestructs")]
    return name


def _get_json(url: str) -> dict:
    request = urllib.request.Request(url, headers={"Accept": "application/vnd.api+json"})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        raise OsfError(f"OSF API error ({exc.code}): {url}") from exc
    except urllib.error.URLError as exc:
        raise OsfError(f"Could not reach OSF: {exc.reason}") from exc


def _collect_pages(first_url: str) -> list[dict]:
    items: list[dict] = []
    url: str | None = first_url
    while url:
        payload = _get_json(url)
        items.extend(payload.get("data", []))
        url = payload.get("links", {}).get("next")
    return items


def list_folders(node_id: str | None = None) -> list[OsfFolder]:
    node = _node_id(node_id)
    url = f"{OSF_API_BASE}/nodes/{node}/files/osfstorage/"
    entries = _collect_pages(url)
    folders: list[OsfFolder] = []
    for entry in entries:
        attrs = entry.get("attributes", {})
        if attrs.get("kind") != "folder":
            continue
        name = attrs.get("name", "")
        folders.append(OsfFolder(id=entry["id"], name=name, label=_folder_label(name)))
    folders.sort(key=lambda folder: folder.label)
    return folders


def list_mat_files(folder_id: str, *, node_id: str | None = None) -> list[OsfFile]:
    node = _node_id(node_id)
    url = f"{OSF_API_BASE}/nodes/{node}/files/osfstorage/{folder_id}/"
    entries = _collect_pages(url)
    files: list[OsfFile] = []
    for entry in entries:
        attrs = entry.get("attributes", {})
        if attrs.get("kind") != "file":
            continue
        name = attrs.get("name", "")
        if not name.lower().endswith(".mat"):
            continue
        download_url = entry.get("links", {}).get("download")
        if not download_url:
            continue
        files.append(
            OsfFile(
                id=entry["id"],
                name=name,
                size=int(attrs.get("size") or 0),
                download_url=download_url,
            )
        )
    files.sort(key=lambda file: file.name.lower())
    return files


def download_file(download_url: str) -> bytes:
    url = _direct_download_url(download_url)
    request = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(request, timeout=120) as response:
            return response.read()
    except urllib.error.HTTPError as exc:
        raise OsfError(f"OSF download failed ({exc.code})") from exc
    except urllib.error.URLError as exc:
        raise OsfError(f"Could not download file: {exc.reason}") from exc


def _direct_download_url(download_url: str) -> str:
    parsed = urllib.parse.urlparse(download_url)
    query = urllib.parse.parse_qs(parsed.query)
    query["direct"] = [""]
    return urllib.parse.urlunparse(
        (
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            urllib.parse.urlencode(query, doseq=True),
            parsed.fragment,
        )
    )

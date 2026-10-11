"""Compare generated offline assets in debug APKs and existing signed releases."""
import hashlib
import json
from pathlib import Path
from zipfile import ZipFile

root = Path(__file__).resolve().parent.parent
repos = {"atelier": "Q-Atelier-App", "maison": "Q-Maison-App", "carnet": "Q-Carnet-App"}
report_path = root / "reviews/native-apk-asset-results.json"
report = json.loads(report_path.read_text(encoding="utf-8"))

def digest(data):
    return hashlib.sha256(data.replace(b"\r\n", b"\n")).hexdigest()

for row in report["results"]:
    source = root.parent / repos[row["product"]] / "app/src/main/assets/offline.html"
    with ZipFile(root.parent / row["apk"]) as apk:
        actual = apk.read("assets/offline.html")
    row["offlineSha256"] = hashlib.sha256(actual).hexdigest()
    row["normalizedOfflineSha256"] = digest(actual)
    row["generatedSourceSha256"] = digest(source.read_bytes())
    row["matchesCanonical"] = digest(actual) == digest(source.read_bytes())
    if row["kind"] == "current-debug-build" and not row["matchesCanonical"]:
        raise SystemExit(f"Debug asset mismatch: {row['product']}")

report["scope"] = "Exact embedded offline assets in three rebuilt debug APKs. Generated sources are checked by the scoped canonical sync gate. Line endings are normalized for content comparison. Existing signed releases are observed separately and remain unchanged."
report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps([{k: row[k] for k in ("product", "kind", "matchesCanonical")} for row in report["results"]]))

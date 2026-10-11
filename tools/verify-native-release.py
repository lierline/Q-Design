"""Inspect actual unsigned Android releases. Does not certify installation or signing."""
import hashlib
import json
import os
import re
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path
from zipfile import ZipFile

root = Path(__file__).resolve().parent.parent
workspace = root.parent
sdk = Path(os.environ["USERPROFILE"]) / ".bubblewrap/android_sdk"
aapt = sdk / "build-tools/36.1.0/aapt2.exe"
rules = json.loads((root / "patterns/native-text-rules.json").read_text(encoding="utf-8"))
strategy = {"simple": 0, "high-quality": 1, "balanced": 2}[rules["androidHintBreakStrategy"]]

def digest(data):
    return hashlib.sha256(data.replace(b"\r\n", b"\n")).hexdigest()

results = []
for product, repo in (("atelier", "Q-Atelier-App"), ("maison", "Q-Maison-App"), ("carnet", "Q-Carnet-App")):
    app = workspace / repo
    canonical = (root / f"dist/q-design.native-offline.{product}.html").read_bytes()
    source = (app / "app/src/main/assets/offline.html").read_bytes()
    assert digest(canonical) == digest(source), f"Native source drift: {product}"
    resource = app / "app/src/main/res/values/q_design_typography.xml"
    assert digest(resource.read_bytes()) == digest((root / f"dist/q-design.native-typography.{product}.xml").read_bytes())
    palette_resource = app / "app/src/main/res/values/q_design_palette.xml"
    canonical_palette = root / f"dist/q-design.native-palette.{product}.xml"
    assert digest(palette_resource.read_bytes()) == digest(canonical_palette.read_bytes()), f"Native palette drift: {product}"
    lint = ET.parse(app / "app/build/reports/lint-results-release.xml")
    issues = lint.getroot().findall("issue")
    errors = [i for i in issues if i.get("severity") in ("Error", "Fatal")]
    warnings = [i for i in issues if i.get("severity") == "Warning"]
    assert not errors, f"Android release lint errors: {product}"
    artifacts = []
    for kind, relative, entry in (
        ("unsigned-apk", "app/build/outputs/apk/release/app-release-unsigned.apk", "assets/offline.html"),
        ("unsigned-aab", "app/build/outputs/bundle/release/app-release.aab", "base/assets/offline.html"),
    ):
        file = app / relative
        with ZipFile(file) as archive:
            embedded = archive.read(entry)
        assert digest(embedded) == digest(canonical), f"Release offline asset mismatch: {product}/{kind}"
        artifacts.append({"kind": kind, "path": file.relative_to(workspace).as_posix(), "sha256": hashlib.sha256(file.read_bytes()).hexdigest(), "embeddedOfflineSha256": digest(embedded), "matchesCanonical": True})
    dump = subprocess.run([str(aapt), "dump", "resources", str(app / "app/build/outputs/apk/release/app-release-unsigned.apk")], capture_output=True, text=True, check=True).stdout
    match = re.search(r"integer/qd_native_hint_break_strategy\s*\n\s*\(\) (\d+)\b", dump)
    assert match and int(match.group(1)) == strategy, f"Compiled central break strategy mismatch: {product}"
    compiled_backgrounds = {}
    for color in ET.parse(canonical_palette).getroot().findall("color"):
        name, expected = color.get("name"), color.text.strip().lower().replace("#", "#ff")
        compiled = re.search(r"color/" + re.escape(name) + r"\s*\n\s*\(\) (#[0-9a-fA-F]{8})\b", dump)
        assert compiled and compiled.group(1).lower() == expected, f"Compiled central canvas mismatch: {product}/{name}"
        compiled_backgrounds[name] = compiled.group(1).lower()
    assert re.search(r"color/app_bg\s*\n\s*\(\) @color/qd_native_bg_light\s*\n\s*\(night\) @color/qd_native_bg_dark\b", dump), f"Compiled day/night canvas consumer mismatch: {product}"
    assert re.search(r"color/splash_light\s*\n\s*\(\) @color/qd_native_bg_light\b", dump), f"Compiled startup canvas consumer mismatch: {product}"
    compiled_native_aliases = {}
    for name in ("ic_bg", "loading_accent", "loading_accent_bright", "muted_on_dark", "launch_glint", "muted_on_light"):
        target = "qd_native_" + name
        assert re.search(r"color/" + re.escape(name) + r"\s*\n\s*\(\) @color/" + re.escape(target) + r"\b", dump), f"Compiled native role consumer mismatch: {product}/{name}"
        assert target in compiled_backgrounds, f"Missing compiled native role: {product}/{target}"
        compiled_native_aliases[name] = target
    package = "qatelier" if product == "atelier" else product
    launch = app / f"app/src/main/java/app/medqraft/{package}/LaunchView.java"
    results.append({"product": product, "artifacts": artifacts, "lintErrors": len(errors), "lintWarnings": len(warnings), "compiledHintBreakStrategy": int(match.group(1)), "compiledBackgrounds": {k: v for k, v in compiled_backgrounds.items() if k in ("qd_native_bg_light", "qd_native_bg_dark")}, "compiledPaletteColors": compiled_backgrounds, "compiledNativeAliases": compiled_native_aliases, "compiledPaletteArtifact": "unsigned-apk", "compiledBackgroundsArtifact": "unsigned-apk", "startupSourceSha256": digest(launch.read_bytes()), "resourceSourceSha256": digest(resource.read_bytes()), "paletteSourceSha256": digest(palette_resource.read_bytes()), "signed": False, "installedRuntimeReviewed": False})
report = {"version": 1, "scope": "Actual unsigned release APK and AAB offline assets, compiled APK Android hint strategy, shared canvas, startup role colors and aliases, and release lint. AAB compiled color resources are not independently decoded here. Existing signed distribution files are unchanged. Installation, device rendering, other native visual parameters and iOS compilation remain unverified.", "results": results}
(root / "reviews/native-release-build-results.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps([{k: r[k] for k in ("product", "lintErrors", "lintWarnings", "compiledHintBreakStrategy", "signed", "installedRuntimeReviewed")} for r in results]))

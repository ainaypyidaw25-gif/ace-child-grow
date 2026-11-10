#!/usr/bin/env python3
"""Read-only permission gate for the current parent-only Android release.

Uses Python's XML parser, not text matching. Bundle mode inspects every module
manifest dumped by bundletool from the candidate AAB. No permission is added.
"""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
import zipfile

ANDROID = "{http://schemas.android.com/apk/res/android}"
# Network status is used by @capacitor/network; it is not location/LAN access.
ALLOWED = {"android.permission.INTERNET", "android.permission.ACCESS_NETWORK_STATE"}
INTERNAL_RECEIVER_PERMISSION = "mm.com.acegroup.acechildgrow.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"
PERMISSION_TAGS = {"uses-permission", "uses-permission-sdk-23", "uses-permission-sdk-m"}


def inspect_manifest(xml, label, require_sdk=False):
    if "<!DOCTYPE" in xml.upper() or "<!ENTITY" in xml.upper():
        raise ValueError(f"{label}: DTD/entity declarations are not accepted")
    root = ET.fromstring(xml)
    if root.tag != "manifest":
        raise ValueError(f"{label}: expected manifest root")
    permissions = []
    for item in root:
        if item.tag in PERMISSION_TAGS:
            name = item.get(ANDROID + "name")
            if not name or "${" in name:
                raise ValueError(f"{label}: missing or unresolved permission name")
            permissions.append(name)
    sdks = root.findall("uses-sdk")
    target = sdks[0].get(ANDROID + "targetSdkVersion") if len(sdks) == 1 else None
    allowed = set(ALLOWED)
    # AndroidX can merge this app-owned receiver guard. Accept it only when its
    # declaration is signature-protected; it grants no access to user data.
    definitions = [item for item in root.findall("permission")
                   if item.get(ANDROID + "name") == INTERNAL_RECEIVER_PERMISSION]
    if len(definitions) == 1 and definitions[0].get(ANDROID + "protectionLevel") in {
        "signature", "2", "0x2", "0x00000002",
    }:
        allowed.add(INTERNAL_RECEIVER_PERMISSION)
    unexpected = sorted(set(permissions) - allowed)
    sdk_ok = not require_sdk or (len(sdks) == 1 and target == "36")
    return {
        "manifest": label,
        "permissions": sorted(set(permissions)),
        "unexpectedPermissions": unexpected,
        "targetSdk": target,
        "pass": not unexpected and sdk_ok,
    }


def bundle_modules(bundle):
    with zipfile.ZipFile(bundle) as archive:
        names = archive.namelist()
    manifests = [name for name in names if name.endswith("/manifest/AndroidManifest.xml")]
    if len(manifests) != len(set(manifests)):
        raise ValueError("Duplicate module manifests in AAB")
    modules = []
    for name in manifests:
        match = re.fullmatch(r"([A-Za-z0-9_]+)/manifest/AndroidManifest\.xml", name)
        if not match:
            raise ValueError("Unexpected module manifest path")
        modules.append(match.group(1))
    if "base" not in modules:
        raise ValueError("AAB base manifest is missing")
    return sorted(modules)


def audit_bundle(bundle, bundletool):
    bundle = Path(bundle).resolve(strict=True)
    bundletool = Path(bundletool).resolve(strict=True)
    checks = []
    for module in bundle_modules(bundle):
        result = subprocess.run(
            ["java", "-jar", str(bundletool), "dump", "manifest",
             f"--bundle={bundle}", f"--module={module}"],
            capture_output=True, text=True, check=True, timeout=60,
        )
        checks.append(inspect_manifest(result.stdout, module, require_sdk=module == "base"))
    with bundle.open("rb") as stream:
        digest = hashlib.file_digest(stream, "sha256").hexdigest()
    return {"scope": "candidate-aab-permissions", "sha256": digest,
            "pass": all(check["pass"] for check in checks), "checks": checks}


def audit_source(directory):
    paths = sorted(Path(directory).glob("*/AndroidManifest.xml"))
    if not any(path.parent.name == "main" for path in paths):
        raise ValueError("Main source manifest is missing")
    checks = [inspect_manifest(path.read_text(), str(path)) for path in paths]
    return {"scope": "source-only-not-release-readiness",
            "pass": all(check["pass"] for check in checks), "checks": checks}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--source", metavar="APP_SRC_DIRECTORY")
    mode.add_argument("--bundle")
    parser.add_argument("--bundletool")
    args = parser.parse_args()
    try:
        if args.source:
            if args.bundletool:
                raise ValueError("--bundletool requires --bundle")
            report = audit_source(args.source)
        else:
            if not args.bundletool:
                raise ValueError("--bundletool is required for AAB inspection")
            report = audit_bundle(args.bundle, args.bundletool)
        print(json.dumps(report, indent=2))
        return 0 if report["pass"] else 2
    except (ValueError, ET.ParseError, OSError, zipfile.BadZipFile,
            subprocess.SubprocessError) as error:
        # Do not echo subprocess stderr, manifest content or environment values.
        print(json.dumps({"pass": False, "error": type(error).__name__}))
        return 1


if __name__ == "__main__":
    sys.exit(main())

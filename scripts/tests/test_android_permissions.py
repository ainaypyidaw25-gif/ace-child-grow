import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import zipfile

SCRIPT = Path(__file__).resolve().parents[1] / "check-android-permissions.py"
spec = importlib.util.spec_from_file_location("android_permissions", SCRIPT)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def manifest(body="", sdk="36"):
    return (f'<manifest xmlns:a="http://schemas.android.com/apk/res/android">'
            f'<uses-sdk a:targetSdkVersion="{sdk}"/>{body}</manifest>')


class PermissionGateTests(unittest.TestCase):
    def test_network_status_and_internet_are_allowed(self):
        xml = manifest('<uses-permission a:name="android.permission.INTERNET"/>'
                       '<uses-permission a:name="android.permission.ACCESS_NETWORK_STATE"/>')
        self.assertTrue(gate.inspect_manifest(xml, "base", True)["pass"])

    def test_sensitive_permissions_block_including_sdk_scoped_entries(self):
        for tag in gate.PERMISSION_TAGS:
            for permission in ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION",
                               "ACCESS_LOCAL_NETWORK", "READ_CONTACTS", "READ_CALL_LOG",
                               "MANAGE_EXTERNAL_STORAGE", "CAMERA", "RECORD_AUDIO"]:
                with self.subTest(tag=tag, permission=permission):
                    xml = manifest(f'<{tag} a:name="android.permission.{permission}" a:maxSdkVersion="35"/>')
                    self.assertFalse(gate.inspect_manifest(xml, "feature", False)["pass"])

    def test_comments_do_not_count_and_entities_cannot_hide_permissions(self):
        self.assertTrue(gate.inspect_manifest(manifest(
            '<!-- <uses-permission a:name="android.permission.CAMERA"/> -->'), "base", True)["pass"])
        self.assertFalse(gate.inspect_manifest(manifest(
            '<uses-permission a:name="android.permission.CAM&#69;RA"/>'), "base", True)["pass"])
        with self.assertRaises(ValueError):
            gate.inspect_manifest('<!DOCTYPE manifest><manifest/>', "base")

    def test_invalid_missing_or_unresolved_names_fail(self):
        for xml in ['<manifest>', '<wrong/>', manifest('<uses-permission/>'),
                    manifest('<uses-permission a:name="${permission}"/>')]:
            with self.subTest(xml=xml), self.assertRaises((ValueError, gate.ET.ParseError)):
                gate.inspect_manifest(xml, "base", True)

    def test_base_requires_exact_reviewed_sdk(self):
        for xml in ['<manifest/>', manifest(sdk="37"), manifest(sdk="")]:
            self.assertFalse(gate.inspect_manifest(xml, "base", True)["pass"])

    def test_androidx_receiver_guard_requires_signature_protection(self):
        name = gate.INTERNAL_RECEIVER_PERMISSION
        for protection, expected in [("signature", True), ("0x00000002", True), ("normal", False)]:
            xml = manifest(f'<permission a:name="{name}" a:protectionLevel="{protection}"/>'
                           f'<uses-permission a:name="{name}"/>')
            self.assertEqual(gate.inspect_manifest(xml, "base", True)["pass"], expected)
        self.assertFalse(gate.inspect_manifest(manifest(f'<uses-permission a:name="{name}"/>'), "base", True)["pass"])

    def test_feature_permission_is_audited_and_hash_is_bound(self):
        with tempfile.TemporaryDirectory() as directory:
            bundle = Path(directory) / "test.aab"
            tool = Path(directory) / "bundletool.jar"
            tool.touch()
            with zipfile.ZipFile(bundle, "w") as archive:
                for module in ["base", "feature"]:
                    archive.writestr(f"{module}/manifest/AndroidManifest.xml", b"binary")
            outputs = [manifest(), manifest('<uses-permission a:name="android.permission.CAMERA"/>')]
            with patch.object(gate.subprocess, "run", side_effect=[
                subprocess.CompletedProcess([], 0, stdout=xml) for xml in outputs
            ]) as run:
                report = gate.audit_bundle(bundle, tool)
            self.assertFalse(report["pass"])
            self.assertEqual(len(report["sha256"]), 64)
            self.assertEqual(run.call_count, 2)
            self.assertIn("--module=feature", run.call_args.args[0])

    def test_missing_base_or_invalid_archive_fails(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "bad.aab"
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr("feature/manifest/AndroidManifest.xml", b"binary")
            with self.assertRaises(ValueError):
                gate.bundle_modules(path)
            path.write_text("not a zip")
            with self.assertRaises(zipfile.BadZipFile):
                gate.bundle_modules(path)

    def test_bundletool_failure_does_not_pass(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "test.aab"
            with zipfile.ZipFile(path, "w") as archive:
                archive.writestr("base/manifest/AndroidManifest.xml", b"binary")
            with patch.object(gate.subprocess, "run", side_effect=subprocess.CalledProcessError(1, "java")):
                with self.assertRaises(subprocess.CalledProcessError):
                    gate.audit_bundle(path, SCRIPT)

    def test_source_is_not_artifact_evidence_and_overlays_are_checked(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaises(ValueError):
                gate.audit_source(root)
            for flavor, xml in [("main", manifest()), ("release", manifest(
                    '<uses-permission a:name="android.permission.CAMERA"/>'))]:
                (root / flavor).mkdir()
                (root / flavor / "AndroidManifest.xml").write_text(xml)
            report = gate.audit_source(root)
            self.assertFalse(report["pass"])
            self.assertEqual(report["scope"], "source-only-not-release-readiness")


if __name__ == "__main__":
    unittest.main()

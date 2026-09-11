#!/usr/bin/env python3
"""Generate an upload keystore (once), patch release signing, copy the AAB."""

from __future__ import annotations

import secrets
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CRED = ROOT / "credentials"
KEYSTORE = CRED / "upload.jks"
PROPS = CRED / "keystore.properties"
AAB_SRC = ROOT / "android" / "app" / "build" / "outputs" / "bundle" / "release" / "app-release.aab"
AAB_DEST = Path(__file__).resolve().parent / "aab" / "life2price-1.0.0.aab"
ALIAS = "upload"
DNAME = "CN=by.bnd.life2price,OU=bnd,O=bnd,L=Unknown,ST=Unknown,C=RU"
BUILD_GRADLE = ROOT / "android" / "app" / "build.gradle"

RELEASE_SIGNING = """
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
"""

LOAD_PROPS = """
def keystorePropertiesFile = rootProject.file("../credentials/keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

"""


def run(cmd: list[str], **kwargs) -> None:
    redacted: list[str] = []
    hide_next = False
    for arg in cmd:
        if hide_next:
            redacted.append("***")
            hide_next = False
            continue
        if arg in ("-storepass", "-keypass"):
            redacted.append(arg)
            hide_next = True
            continue
        redacted.append(arg)
    print("+", " ".join(redacted), flush=True)
    subprocess.run(cmd, check=True, **kwargs)


def ensure_keystore() -> None:
    CRED.mkdir(parents=True, exist_ok=True)
    if KEYSTORE.exists() and PROPS.exists():
        print(f"reusing {KEYSTORE}")
        return
    password = secrets.token_urlsafe(24)
    run(
        [
            "keytool",
            "-genkeypair",
            "-v",
            "-storetype",
            "JKS",
            "-keyalg",
            "RSA",
            "-keysize",
            "2048",
            "-validity",
            "10000",
            "-alias",
            ALIAS,
            "-keystore",
            str(KEYSTORE),
            "-dname",
            DNAME,
            "-storepass",
            password,
            "-keypass",
            password,
        ]
    )
    PROPS.write_text(
        "\n".join(
            [
                f"storePassword={password}",
                f"keyPassword={password}",
                f"keyAlias={ALIAS}",
                f"storeFile={KEYSTORE.resolve()}",
                "",
            ]
        ),
        encoding="utf-8",
    )
    PROPS.chmod(0o600)
    KEYSTORE.chmod(0o600)
    print(f"wrote {KEYSTORE} and {PROPS} (gitignored)")


def patch_signing() -> None:
    text = BUILD_GRADLE.read_text(encoding="utf-8")
    if "keystoreProperties['storeFile']" in text:
        print("signing already patched")
        return
    if "signingConfigs {" not in text:
        raise SystemExit("android/app/build.gradle has no signingConfigs block")
    if LOAD_PROPS.strip() not in text:
        text = text.replace("android {\n", "android {" + LOAD_PROPS, 1)
    text = text.replace(
        """        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }""",
        """        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
"""
        + RELEASE_SIGNING
        + "    }",
        1,
    )
    text = text.replace(
        """        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug""",
        """        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.release""",
        1,
    )
    BUILD_GRADLE.write_text(text, encoding="utf-8")
    print(f"patched {BUILD_GRADLE}")


def copy_aab() -> None:
    if not AAB_SRC.exists():
        raise SystemExit(f"missing {AAB_SRC}")
    AAB_DEST.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(AAB_SRC, AAB_DEST)
    print(f"copied {AAB_DEST} ({AAB_DEST.stat().st_size} bytes)")


def main() -> int:
    cmd = sys.argv[1] if len(sys.argv) > 1 else "all"
    if cmd in ("keystore", "all"):
        ensure_keystore()
    if cmd in ("patch", "all"):
        patch_signing()
    if cmd in ("copy", "all"):
        copy_aab()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

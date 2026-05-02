#!/usr/bin/env bash
#
# Download and install the veraPDF CLI into ./tools/verapdf so subsequent
# `pnpm verapdf:ci` invocations can validate fixture PDFs against PDF/A and
# PDF/UA profiles.
#
# veraPDF stopped publishing version-pinned installer ZIPs at the canonical
# software.verapdf.org/releases path; the only stable URL today is the
# unversioned rolling installer. We log the resolved version after install
# so CI runs are still auditable.

set -euo pipefail

INSTALL_DIR="${VERAPDF_DIR:-tools/verapdf}"
TARBALL="verapdf-installer.zip"
URL="https://software.verapdf.org/releases/verapdf-installer.zip"

if command -v verapdf >/dev/null 2>&1; then
  echo "veraPDF already on \$PATH — skipping install"
  exit 0
fi

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

echo "→ downloading $URL"
curl -fsSL -o "$TARBALL" "$URL"
unzip -oq "$TARBALL"

# The current installer ships in a versioned directory like
# `verapdf-greenfield-1.30.1/` with the IzPack jar named
# `verapdf-izpack-installer-<version>.jar`. Resolve both dynamically so
# we don't break again when veraPDF bumps the version.
SRC_DIR="$(find . -maxdepth 1 -type d -name 'verapdf-*' | head -n1)"
INSTALLER_JAR="$(find "$SRC_DIR" -maxdepth 1 -name 'verapdf-izpack-installer-*.jar' | head -n1)"

# The installer is interactive by default; run it in `auto` mode with a
# one-line config so CI never blocks on a prompt.
INSTALL_DEST="$(pwd)/install"
cat > install.xml <<EOF
<AutomatedInstallation langpack="eng">
  <com.izforge.izpack.panels.UserInputPanel id="userInputPanel">
    <userInput>
      <entry key="installation.type" value="full"/>
    </userInput>
  </com.izforge.izpack.panels.UserInputPanel>
  <com.izforge.izpack.panels.target.TargetPanel id="targetPanel">
    <installpath>$INSTALL_DEST</installpath>
  </com.izforge.izpack.panels.target.TargetPanel>
  <com.izforge.izpack.panels.packs.PacksPanel id="packsPanel"/>
  <com.izforge.izpack.panels.install.InstallPanel id="installPanel"/>
  <com.izforge.izpack.panels.finish.FinishPanel id="finishPanel"/>
</AutomatedInstallation>
EOF

java -jar "$INSTALLER_JAR" install.xml

echo "$INSTALL_DEST" >> "$GITHUB_PATH"
echo "veraPDF installed at $INSTALL_DEST"
"$INSTALL_DEST/verapdf" --version || true

#!/usr/bin/env bash
#
# Download and install the veraPDF CLI into ./tools/verapdf so subsequent
# `pnpm verapdf:ci` invocations can validate fixture PDFs against PDF/A and
# PDF/UA profiles.
#
# Pinned to the latest 1.x release because veraPDF's profile semantics
# change between minor versions and we want CI to stay deterministic.

set -euo pipefail

VERSION="${VERAPDF_VERSION:-1.26.5}"
INSTALL_DIR="${VERAPDF_DIR:-tools/verapdf}"
TARBALL="verapdf-installer-${VERSION}.zip"
URL="https://software.verapdf.org/releases/verapdf-installer-${VERSION}.zip"

if command -v verapdf >/dev/null 2>&1; then
  echo "veraPDF already on \$PATH — skipping install"
  exit 0
fi

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

if [ ! -d "verapdf-installer" ]; then
  echo "→ downloading $URL"
  curl -fsSL -o "$TARBALL" "$URL"
  unzip -q "$TARBALL"
fi

# The downloaded archive ships an interactive installer; we run it in
# `auto` mode with a one-line config so CI never blocks on a prompt.
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

cd verapdf-installer-*/
java -jar verapdf-install.jar ../install.xml

echo "$INSTALL_DEST/verapdf" >> "$GITHUB_PATH"
echo "veraPDF installed at $INSTALL_DEST"

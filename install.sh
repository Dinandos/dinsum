#!/bin/bash

echo "--- DINSUM INSTALLER ---"

# 1. Snellere Node.js check & installatie
if ! command -v node &> /dev/null; then
    echo "📦 Node.js niet gevonden. Snelle installatie starten..."
    # We gebruiken de officiële snelle installer van NodeSource (Node 20 LTS)
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    echo "✅ Node.js is al aanwezig."
fi

# 2. Map bepalen (onzichtbaar in home folder)
INSTALL_DIR="$HOME/.dinsum"

# 3. Code ophalen
if [ -d "$INSTALL_DIR" ]; then
    echo "🔄 Tool updaten..."
    cd "$INSTALL_DIR" && git fetch origin && git reset --hard origin/main
else
    echo "🚀 Tool downloaden..."
    git clone https://github.com/JOUW_GEBRUIKERSNAAM/my-boilerplate-tool.git "$INSTALL_DIR"
fi

# 4. Installeren zonder overbodige extra's
cd "$INSTALL_DIR"
npm install --no-audit --no-fund --quiet
npm link --force

echo "--------------------------------------------------"
echo "Done! Typ 'dinsum' om te beginnen."
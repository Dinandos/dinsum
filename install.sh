#!/bin/bash

echo "--- DINSUM INSTALLER ---"

# 1. Node.js installatie (indien nodig)
if ! command -v node &> /dev/null; then
    echo "📦 Node.js installeren..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# 2. Definieer de installatiemap
INSTALL_DIR="$HOME/.dinsum"

# 3. Code ophalen of updaten
if [ -d "$INSTALL_DIR" ]; then
    echo "🔄 Tool updaten in $INSTALL_DIR..."
    cd "$INSTALL_DIR" || exit
    git fetch origin
    git reset --hard origin/main
else
    echo "🚀 Tool downloaden naar $INSTALL_DIR..."
    git clone https://github.com/Dinandos/dinsum.git "$INSTALL_DIR"
    cd "$INSTALL_DIR" || exit
fi

# 4. Installeren ZONDER bestanden achter te laten in de huidige map
echo "🛠️ Dependencies installeren..."
# --prefix zorgt ervoor dat npm alleen in de .dinsum map werkt
npm install --prefix "$INSTALL_DIR" --no-audit --no-fund --quiet

# 5. Linken van het commando
npm link --force --quiet

# 6. Schoonmaken: verwijder eventuele per ongeluk aangemaakte files in de huidige map
rm -f package-lock.json 2>/dev/null

echo "--------------------------------------------------"
echo "✅ Klaar! Je kunt nu overal 'dinsum' typen."
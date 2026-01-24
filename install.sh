#!/bin/bash

# Update en installeer Node.js als het ontbreekt
if ! command -v node &> /dev/null; then
    echo "📦 Node.js installeren..."
    sudo apt-get install nodejs npm -y
fi

# Map bepalen voor installatie
INSTALL_DIR="$HOME/.dinsum"

# Als de map al bestaat, update hem. Anders: clone hem.
if [ -d "$INSTALL_DIR" ]; then
    echo "🔄 Tool updaten..."
    cd $INSTALL_DIR && git pull
else
    echo "🚀 Tool downloaden van GitHub..."
    # VERVANG DEZE URL DOOR JOUW EIGEN REPO URL
    git clone https://github.com/Dinandos/dinsum.git $INSTALL_DIR
fi

# Installeer de tool globaal op het systeem
cd $INSTALL_DIR
npm install
sudo npm link --force

echo "✅ Klaar! Je kunt nu 'dinsum' gebruiken."
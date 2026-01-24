#!/bin/bash

# Kleuren definiëren volgens COLOR_SCHEME.md
# Groen = Succes, Rood = Fail, Grijs = Comment, Blauw = Status, Oranje = AccentColor
GREEN='\033[0;32m'      # Succes
BOLD_GREEN='\033[1;32m' # Succes (bold)
RED='\033[0;31m'        # Fail
BOLD_RED='\033[1;31m'   # Fail (bold)
GRAY='\033[0;90m'       # Comment
BLUE='\033[0;34m'       # Status
BOLD_BLUE='\033[1;34m'  # Status (bold)
ORANGE='\033[0;33m'     # AccentColor
BOLD_ORANGE='\033[1;33m' # AccentColor (bold)
NC='\033[0m'            # No Color

echo -e "${BOLD_ORANGE}\n--- DINSUM UNINSTALLER ---${NC}\n"

# Definieer de installatiemap (hetzelfde als in install.sh)
INSTALL_DIR="$HOME/.dinsum"

echo -e "${NC}Dit zal dinsum volledig verwijderen:"
echo -e "${GRAY}  - Installatie directory: ${INSTALL_DIR}"
echo -e "${GRAY}  - npm link verwijderen\n"

# Vraag om bevestiging
echo -ne "${BOLD_ORANGE}Weet je zeker dat je dinsum wilt verwijderen? (y/N): ${NC}"
read -r response

# Check of het antwoord ja is (y, Y, yes, Yes, etc.)
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo -e "${RED}\n❌ Uninstall geannuleerd.${NC}\n"
    exit 0
fi

echo -e "\n"

# 1. Verwijder npm link
echo -e "${GRAY}1. Verwijderen van npm link...${NC}"
# We gebruiken || true om te voorkomen dat het script stopt als de link niet bestaat
# 2>/dev/null onderdrukt warnings als het pakket niet gevonden wordt
if npm unlink -g dinsum 2>/dev/null || true; then
    echo -e "${GREEN}✅ npm link verwijderd.${NC}\n"
else
    echo -e "${ORANGE}⚠️  Kon npm link niet verwijderen (mogelijk al weg).${NC}\n"
fi

# 2. Verwijder installatie directory
echo -e "${GRAY}2. Verwijderen van installatie directory (${INSTALL_DIR})...${NC}"
if [ -d "$INSTALL_DIR" ]; then
    rm -rf "$INSTALL_DIR"
    if [ ! -d "$INSTALL_DIR" ]; then
        echo -e "${GREEN}✅ Installatie directory verwijderd.${NC}\n"
    else
        echo -e "${RED}❌ Kon directory niet verwijderen. Controleer rechten.${NC}\n"
        exit 1
    fi
else
    echo -e "${ORANGE}⚠️  Installatie directory bestaat niet of is al verwijderd.${NC}\n"
fi

echo -e "${GREEN}✅ dinsum is volledig verwijderd!${NC}\n"
echo -e "${GRAY}Bedankt voor het gebruik van dinsum. Tot ziens! 👋${NC}\n"
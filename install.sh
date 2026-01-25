#!/bin/bash

# De gewenste versie bepalen (pakt het eerste argument, anders 'main')
VERSION=${1:-main}

# Kleuren definiëren volgens COLOR_SCHEME.md
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

echo -e "${BOLD_BLUE}\n--- DINSUM INSTALLER (Versie: $VERSION) ---${NC}\n"

# Check of dinsum al geïnstalleerd is
if command -v dinsum &> /dev/null && [ "$VERSION" == "main" ]; then
    echo -e "${BOLD_ORANGE}⚠️  dinsum is al geïnstalleerd op deze machine!${NC}"
    echo -e "${GRAY}Gebruik in plaats daarvan: ${BOLD_ORANGE}dinsum update${NC}"
    echo -e "${GRAY}Dit zorgt ervoor dat je de nieuwste versie krijgt zonder opnieuw te installeren.${NC}\n"
    exit 0
fi

# 1. Node.js installatie (indien nodig)
if ! command -v node &> /dev/null; then
    echo -e "${BLUE}📦 Node.js installeren...${NC}"
    if curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs; then
        echo -e "${GREEN}✅ Node.js geïnstalleerd.${NC}\n"
    else
        echo -e "${RED}❌ Node.js installatie mislukt.${NC}\n"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Node.js is al geïnstalleerd.${NC}\n"
fi

# 2. Definieer de installatiemap
INSTALL_DIR="$HOME/.dinsum"

# 3. Code ophalen of updaten naar specifieke versie
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${BLUE}🔄 Tool instellen op versie ${VERSION} in ${INSTALL_DIR}...${NC}"
    cd "$INSTALL_DIR" || exit
    git fetch --all --quiet
    if git checkout "$VERSION" --quiet && git pull origin "$VERSION" --quiet 2>/dev/null; then
        echo -e "${GREEN}✅ Code omgezet naar versie: $VERSION.${NC}\n"
    else
        # Als pull faalt (bijv. bij een Tag), is checkout vaak al genoeg
        echo -e "${GREEN}✅ Code staat nu op: $VERSION.${NC}\n"
    fi
else
    echo -e "${BLUE}🚀 Tool downloaden (versie: ${VERSION}) naar ${INSTALL_DIR}...${NC}"
    if git clone --branch "$VERSION" https://github.com/Dinandos/dinsum.git "$INSTALL_DIR"; then
        cd "$INSTALL_DIR" || exit
        echo -e "${GREEN}✅ Code gedownload.${NC}\n"
    else
        echo -e "${RED}❌ Downloaden van versie $VERSION mislukt. Bestaat de tag/branch wel?${NC}\n"
        exit 1
    fi
fi

# 4. Installeren ZONDER bestanden achter te laten in de huidige map
echo -e "${BLUE}🛠️  Dependencies installeren...${NC}"
if npm install --prefix "$INSTALL_DIR" --no-audit --no-fund --quiet; then
    echo -e "${GREEN}✅ Dependencies geïnstalleerd.${NC}\n"
else
    echo -e "${RED}❌ Dependencies installeren mislukt.${NC}\n"
    exit 1
fi

# 5. Linken van het commando
echo -e "${BLUE}🔗 dinsum commando linken...${NC}"
if npm link --force --quiet; then
    echo -e "${GREEN}✅ Commando gelinkt.${NC}\n"
else
    echo -e "${RED}❌ Commando linken mislukt.${NC}\n"
    exit 1
fi

# 6. Schoonmaken
rm -f package-lock.json 2>/dev/null

echo -e "${BOLD_GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD_GREEN}✅ Klaar! Versie ${BOLD_ORANGE}$VERSION${BOLD_GREEN} is nu actief.${NC}"
echo -e "${BOLD_GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
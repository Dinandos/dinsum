# Kleurenschema voor dinsum

Dit document beschrijft het kleurenschema dat gebruikt wordt in alle dinsum bestanden voor consistente gebruikerservaring.

## Kleurlogica

### 🟢 Groen = Succes
- Gebruik voor: succesvolle acties, bevestigingen, voltooide taken
- Voorbeelden: "✅ Installatie voltooid", "✅ Update gelukt"
- **JavaScript (Chalk)**: `chalk.green` of `chalk.bold.green`
- **Bash**: `GREEN='\033[0;32m'` of `BOLD_GREEN='\033[1;32m'`

### 🔴 Rood = Fail
- Gebruik voor: fouten, mislukte acties, waarschuwingen over problemen
- Voorbeelden: "❌ Installatie mislukt", "❌ Fout tijdens update"
- **JavaScript (Chalk)**: `chalk.red` of `chalk.bold.red`
- **Bash**: `RED='\033[0;31m'` of `BOLD_RED='\033[1;31m'`

### ⚪ Grijs = Comment
- Gebruik voor: uitleg, commentaar, secundaire informatie, stappen
- Voorbeelden: "1. Controleren van internetverbinding...", "Dit zorgt ervoor dat..."
- **JavaScript (Chalk)**: `chalk.gray`
- **Bash**: `GRAY='\033[0;90m'`

### 🔵 Blauw = Status
- Gebruik voor: status updates, acties die worden uitgevoerd, hoofdtitels
- Voorbeelden: "--- DINSUM UPDATE ---", "📦 Node.js installeren..."
- **JavaScript (Chalk)**: `chalk.blue` of `chalk.bold.blue`
- **Bash**: `BLUE='\033[0;34m'` of `BOLD_BLUE='\033[1;34m'`

### 🟠 Oranje = AccentColor
- Gebruik voor: belangrijke accenten, waarschuwingen, highlights, commando's
- Voorbeelden: "⚠️ dinsum is al geïnstalleerd", "dinsum update"
- **JavaScript (Chalk)**: `chalk.hex('#FFA500')` of `chalk.bold.hex('#FFA500')`
- **Bash**: `ORANGE='\033[0;33m'` of `BOLD_ORANGE='\033[1;33m'`

## Implementatie voor JavaScript (Chalk)

```javascript
import chalk from 'chalk';

// Kleuren definiëren volgens het kleurenschema
const green = chalk.green;           // Succes
const boldGreen = chalk.bold.green;  // Succes (bold)
const red = chalk.red;               // Fail
const boldRed = chalk.bold.red;      // Fail (bold)
const gray = chalk.gray;             // Comment
const blue = chalk.blue;             // Status
const boldBlue = chalk.bold.blue;     // Status (bold)
const orange = chalk.hex('#FFA500'); // AccentColor
const boldOrange = chalk.bold.hex('#FFA500'); // AccentColor (bold)
```

## Implementatie voor Bash

```bash
# Kleuren definiëren volgens het kleurenschema
GREEN='\033[0;32m'      # Succes
BOLD_GREEN='\033[1;32m' # Succes (bold)
RED='\033[0;31m'        # Fail
BOLD_RED='\033[1;31m'   # Fail (bold)
GRAY='\033[0;90m'       # Comment
BLUE='\033[0;34m'       # Status
BOLD_BLUE='\033[1;34m'  # Status (bold)
ORANGE='\033[0;33m'     # AccentColor
BOLD_ORANGE='\033[1;33m' # AccentColor (bold)
NC='\033[0m'            # No Color (reset)
```

## Gebruiksvoorbeelden

### Succes (Groen)
```javascript
console.log(green("✅ Actie voltooid"));
```

### Fail (Rood)
```javascript
console.log(red("❌ Actie mislukt"));
```

### Comment (Grijs)
```javascript
console.log(gray("Dit is een uitleg"));
```

### Status (Blauw)
```javascript
console.log(blue("--- DINSUM UPDATE ---"));
```

### AccentColor (Oranje)
```javascript
console.log(orange("⚠️ Belangrijke waarschuwing"));
```

## Belangrijke regels

1. **Gebruik altijd deze kleuren** voor de juiste context
2. **Wees consistent** - gebruik dezelfde kleur voor dezelfde soort berichten
3. **Gebruik bold varianten** voor belangrijke/opvallende berichten
4. **Gebruik grijs** voor secundaire informatie en stappen
5. **Gebruik oranje** spaarzaam, alleen voor belangrijke accenten

## Toepassing in nieuwe bestanden

Bij het maken van nieuwe bestanden:
1. Kopieer de kleurdefinities uit dit document
2. Gebruik de kleuren volgens de logica hierboven
3. Houd consistentie met bestaande bestanden

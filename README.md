Hier is een korte, professionele `README.md` voor je repository. Deze legt precies uit wat de tool doet en hoe je die verschillende versies kunt installeren.

---

# 🥟 Dinsum CLI

Een krachtige, modulaire CLI-tool om razendsnel project-templates uit te rollen op je Linux-server.

## 🚀 Snelle Installatie

Gebruik het onderstaande commando om de allernieuwste versie direct te installeren:

```bash
curl -sSL https://raw.githubusercontent.com/Dinandos/dinsum/main/install.sh | sudo bash

```

### 📌 Installeren van een specifieke versie

Wil je een oudere versie (bijv. `v1.0`) installeren voor vergelijking? Gebruik dan:

```bash
curl -sSL https://raw.githubusercontent.com/Dinandos/dinsum/main/install.sh | sudo bash -s -- v1.0

```

## 🛠 Gebruik

Zodra de installatie klaar is, kun je de tool overal aanroepen:

* **Help menu**: `dinsum` of `dinsum help`
* **Template gebruiken**: `dinsum <template-naam>`
* **Updaten**: `dinsum update`
* **Versie checken**: `dinsum version`

## 📂 Structuur

* `/functions`: Bevat alle actieve commando's (JS modules).
* `/templates`: Jouw herbruikbare project-templates.
* `index.js`: De centrale "verkeersregelaar" van de tool.
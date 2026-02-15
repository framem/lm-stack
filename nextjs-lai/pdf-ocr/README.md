# PDF zu Markdown Konverter mit OCR

Extrahiert Text aus PDF-Dateien (einschließlich gescannter Dokumente) mit Tesseract OCR, optionaler LLM Vision und KI-basierter Text-Bereinigung.

## Features

- Native PDF-Text-Extraktion mit automatischer OCR-Erkennung
- Tesseract OCR mit optionalem LLM Vision Support
- KI-basierte Rechtschreibprüfung und Text-Bereinigung
- Flexible Eingabe: Ordner oder spezifische Dateien
- Test-Modus für schnelles Prototyping

## Schnellstart

```bash
# Virtual Environment aktivieren
source /home/rp-remote/github/.venv/bin/activate

# Dependencies installieren
pip install -r requirements.txt
sudo apt-get install tesseract-ocr tesseract-ocr-deu poppler-utils

# Konfiguration anpassen (optional)
cp .env.example .env
# Bearbeite .env nach Bedarf

# Alle PDFs verarbeiten
python main.py

# Test-Modus (nur erste 2 Seiten)
python main.py --test --files pdf-input/document.pdf
```

## Verwendung

```bash
# Alle PDFs im pdf-input/ Ordner verarbeiten
python main.py

# Spezifische Dateien
python main.py --files file1.pdf file2.pdf

# Test-Modus (erste 2 Seiten)
python main.py --test

# Maximale Seitenanzahl
python main.py --max-pages 5

# Hilfe
python main.py --help
```

## Konfiguration

Erstelle `.env` aus `.env.example` und passe an:

```env
LLM_API_BASE=http://localhost:1234/v1
LLM_MODEL=google/gemma-3-12b
LLM_API_KEY=not-needed
```

Weitere Einstellungen in `config.py`:
- `TESSERACT_LANG` - OCR-Sprache (Default: "deu")
- `DPI` - PDF-Auflösung (Default: 300)
- `USE_LLM_VISION` - LLM Vision aktivieren (Default: True)
- `USE_LLM_CLEANUP` - LLM Text-Cleanup (Default: True)

## Projektstruktur

```
IHK/
├── main.py              # Hauptskript
├── config.py            # Konfiguration
├── pdf_extractor.py     # PDF-Extraktion
├── ocr_processor.py     # OCR-Verarbeitung
├── text_cleanup.py      # Text-Bereinigung
├── requirements.txt     # Python-Dependencies
├── .env.example         # Konfigurationsvorlage
├── pdf-input/           # Input PDFs
└── output/              # Markdown-Ausgabe
```

## Troubleshooting

**Tesseract/Poppler fehlt:**
```bash
sudo apt-get install tesseract-ocr tesseract-ocr-deu poppler-utils
```

**LLM API nicht erreichbar:**  
Stelle sicher, dass LM Studio läuft und unter der konfigurierten URL erreichbar ist.

**Langsame Verarbeitung:**  
Deaktiviere `USE_LLM_VISION` in `config.py` für schnellere OCR.


# PDF zu Markdown Konverter mit OCR

Extrahiert Text aus PDF-Dateien (einschließlich gescannter Dokumente) mit Tesseract OCR, optionaler LLM Vision und KI-basierter Text-Bereinigung.

## Features

- Native PDF-Text-Extraktion mit automatischer OCR-Erkennung
- **3-Stufen-OCR für maximale Genauigkeit**:
  1. Tesseract OCR (schnell, zuverlässig)
  2. LLM Vision OCR (kontextbewusst, bessere Qualität)
  3. LLM-basierte Kombination & Validierung beider Ergebnisse
- KI-basierte Rechtschreibprüfung und Text-Bereinigung
- Flexible Eingabe: Ordner oder spezifische Dateien
- Test-Modus für schnelles Prototyping
- Automatische Cleanup bei Abbruch (Ctrl+C)

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
- `USE_LLM_VISION` - 3-Stufen-OCR aktivieren (Default: True)
  - `True`: Tesseract + LLM Vision + intelligente LLM-Kombination
  - `False`: Nur Tesseract OCR
- `USE_LLM_CLEANUP` - LLM Text-Cleanup (Default: True)

## Tests

Das Projekt verfügt über eine umfassende Test-Suite mit **96.75% Code-Coverage**.

### Test-Dependencies installieren

```bash
# Virtual Environment aktivieren
source /home/rp-remote/github/.venv/bin/activate

# Test-Dependencies installieren
pip install -r requirements-dev.txt
```

### Tests ausführen

```bash
# Alle Tests ausführen
pytest tests/ -v

# Mit Coverage-Report
pytest tests/ -v --cov --cov-report=term-missing

# Nur spezifische Test-Datei
pytest tests/test_pdf_extractor.py -v

# HTML Coverage-Report generieren
pytest tests/ --cov --cov-report=html
```

### Coverage-Report ansehen

Nach Ausführung mit `--cov-report=html` wird ein interaktiver Report unter `htmlcov/` erstellt:

```bash
# HTML-Report im Browser öffnen
python -m http.server --directory htmlcov
# Öffne: http://localhost:8000
```

### Test-Anforderungen

- **Mindest-Coverage:** 90% (aktuell: 96.75%)
- **Test-Module:** 5 (config, pdf_extractor, ocr_processor, text_cleanup, main)
- **Gesamt-Tests:** 61

## Projektstruktur

```
IHK/
├── main.py                  # Hauptskript
├── config.py                # Konfiguration
├── pdf_extractor.py         # PDF-Extraktion
├── ocr_processor.py         # OCR-Verarbeitung
├── text_cleanup.py          # Text-Bereinigung
├── requirements.txt         # Python-Dependencies
├── requirements-dev.txt     # Test-Dependencies
├── pytest.ini               # Pytest-Konfiguration
├── .env.example             # Konfigurationsvorlage
├── pdf-input/               # Input PDFs
├── output/                  # Markdown-Ausgabe
└── tests/                   # Test-Suite
    ├── conftest.py          # Pytest-Fixtures
    ├── test_config.py       # Config-Tests
    ├── test_pdf_extractor.py
    ├── test_ocr_processor.py
    ├── test_text_cleanup.py
    └── test_main.py
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


# GGUF Inference

```bash
# Image bauen
docker compose build gguf-inference
```

```bash
# Text generieren
docker compose run --rm gguf-inference -m gpt2-mini.gguf -p "die katze"
```

```bash
# Interaktiver Modus
docker compose run --rm gguf-inference -m gpt2-mini.gguf -i
```

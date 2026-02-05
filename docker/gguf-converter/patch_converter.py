#!/usr/bin/env python3
"""
Patch llama.cpp convert_hf_to_gguf.py to accept unknown pre-tokenizers.
This is needed for custom models with non-standard tokenizers.
"""

import sys

converter_path = "/app/llama.cpp/convert_hf_to_gguf.py"

with open(converter_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the raise NotImplementedError line and replace it with a warning + fallback
old_code = 'raise NotImplementedError("BPE pre-tokenizer was not recognized - update get_vocab_base_pre()")'
new_code = '''logger.warning(f"BPE pre-tokenizer was not recognized (hash: {chkhsh}), using 'gpt2' as fallback")
        res = "gpt2"'''

if old_code in content:
    content = content.replace(old_code, new_code)
    with open(converter_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched converter to accept unknown pre-tokenizers")
else:
    print("Converter already patched or pattern not found")
    sys.exit(0)

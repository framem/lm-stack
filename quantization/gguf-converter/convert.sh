#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

show_help() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║           HuggingFace → GGUF Converter                        ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Usage: convert.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --input DIR       Input HF model directory (default: /models/input)"
    echo "  --output FILE     Output GGUF file (default: /models/output/model.gguf)"
    echo "  --quantize TYPE   Quantization type (optional): q4_0, q4_1, q5_0, q5_1, q8_0"
    echo "  --list            List supported architectures"
    echo "  --help            Show this help"
    echo ""
    echo "Supported Architectures:"
    echo "  - GPT2LMHeadModel"
    echo "  - LlamaForCausalLM"
    echo "  - MistralForCausalLM"
    echo "  - FalconForCausalLM"
    echo "  - PhiForCausalLM"
    echo "  - Qwen2ForCausalLM"
    echo "  - GemmaForCausalLM"
    echo "  - ... and more (see llama.cpp docs)"
    echo ""
    echo "Examples:"
    echo "  # Basic conversion"
    echo "  convert.sh --input /models/input --output /models/output/model.gguf"
    echo ""
    echo "  # With quantization"
    echo "  convert.sh --input /models/input --output /models/output/model-q4.gguf --quantize q4_0"
    echo ""
}

list_architectures() {
    echo -e "${GREEN}Checking supported architectures in llama.cpp...${NC}"
    grep -E "^class \w+Model\(" /app/llama.cpp/convert_hf_to_gguf.py 2>/dev/null | \
        sed 's/class \(.*\)Model(.*/  - \1/' || \
        echo "Could not parse architectures"
}

# Default values
INPUT_DIR="/models/input"
OUTPUT_FILE="/models/output/model.gguf"
QUANTIZE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --input)
            INPUT_DIR="$2"
            shift 2
            ;;
        --output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        --quantize)
            QUANTIZE="$2"
            shift 2
            ;;
        --list)
            list_architectures
            exit 0
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Check input exists
if [ ! -d "$INPUT_DIR" ]; then
    echo -e "${RED}Error: Input directory not found: $INPUT_DIR${NC}"
    exit 1
fi

if [ ! -f "$INPUT_DIR/config.json" ]; then
    echo -e "${RED}Error: No config.json found in $INPUT_DIR${NC}"
    echo "Make sure this is a valid HuggingFace model directory"
    exit 1
fi

# Show model info
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Starting Conversion                         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Input:  ${YELLOW}$INPUT_DIR${NC}"
echo -e "Output: ${YELLOW}$OUTPUT_FILE${NC}"

# Extract architecture from config
ARCH=$(python3 -c "import json; print(json.load(open('$INPUT_DIR/config.json')).get('architectures', ['Unknown'])[0])" 2>/dev/null || echo "Unknown")
echo -e "Architecture: ${YELLOW}$ARCH${NC}"
echo ""

# Create output directory
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Run conversion
echo -e "${GREEN}Converting to GGUF...${NC}"
python3 /app/llama.cpp/convert_hf_to_gguf.py "$INPUT_DIR" --outfile "$OUTPUT_FILE"

if [ $? -ne 0 ]; then
    echo -e "${RED}Conversion failed!${NC}"
    exit 1
fi

echo -e "${GREEN}Conversion successful: $OUTPUT_FILE${NC}"

# Quantize if requested
if [ -n "$QUANTIZE" ]; then
    QUANT_OUTPUT="${OUTPUT_FILE%.gguf}-${QUANTIZE}.gguf"
    echo ""
    echo -e "${GREEN}Quantizing to $QUANTIZE...${NC}"
    /app/llama.cpp/build/bin/llama-quantize "$OUTPUT_FILE" "$QUANT_OUTPUT" "$QUANTIZE"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Quantization successful: $QUANT_OUTPUT${NC}"
    else
        echo -e "${RED}Quantization failed!${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}Done!${NC}"
echo ""

# Show file sizes
echo "Output files:"
ls -lh "$(dirname "$OUTPUT_FILE")"/*.gguf 2>/dev/null || echo "No GGUF files found"

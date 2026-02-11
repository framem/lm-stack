const express = require("express");
const fs = require("fs");
const path = require("path");
const ort = require("onnxruntime-node");

const app = express();
app.use(express.json());

const MODEL_DIR = path.resolve(__dirname, "..", "..", "dist");
const MODEL_PATH = path.join(MODEL_DIR, "melbourne_tree.onnx");
const METADATA_PATH = path.join(MODEL_DIR, "melbourne_tree_metadata.json");

let inference;
let metadata;

function loadMetadata() {
  if (!fs.existsSync(METADATA_PATH)) {
    throw new Error(`Metadata file not found at ${METADATA_PATH}`);
  }
  const raw = fs.readFileSync(METADATA_PATH, "utf8");
  return JSON.parse(raw);
}

async function prepareModel() {
  if (!fs.existsSync(MODEL_PATH)) {
    throw new Error(`ONNX model not found at ${MODEL_PATH}. Train and export the model first.`);
  }
  metadata = loadMetadata();
  inference = await ort.InferenceSession.create(MODEL_PATH);
}

function buildFeatureVector(payload) {
  if (!metadata) {
    throw new Error("Metadata not loaded");
  }
  const values = metadata.features.map((name) => {
    const rawValue = payload[name];
    if (rawValue === undefined || rawValue === null) {
      throw new Error(`Missing feature '${name}' in request body.`);
    }
    const numeric = Number(rawValue);
    if (Number.isNaN(numeric)) {
      throw new Error(`Feature '${name}' must be a numeric value.`);
    }
    return numeric;
  });
  return Float32Array.from(values);
}

app.get("/health", (_req, res) => {
  const ready = Boolean(inference && metadata);
  res.json({ status: ready ? "ok" : "initializing" });
});

app.post("/predict", async (req, res) => {
  try {
    if (!inference) {
      throw new Error("Model session not ready yet.");
    }
    const featureVector = buildFeatureVector(req.body);
    const inputTensor = new ort.Tensor("float32", featureVector, [1, featureVector.length]);
    const feeds = { [metadata.input_tensor_name]: inputTensor };
    const results = await inference.run(feeds);
    const outputName = inference.outputNames[0];
    const prediction = results[outputName].data[0];

    res.json({ prediction, features: metadata.features });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

async function bootstrap() {
  await prepareModel();
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

bootstrap().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

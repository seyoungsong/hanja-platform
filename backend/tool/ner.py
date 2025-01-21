import sys
from importlib import reload
from pathlib import Path
from typing import Dict, List, Tuple

import tool.root as sroot
import torch
import typer
from huggingface_hub import snapshot_download
from loguru import logger
from rich import pretty
from transformers import (
    AutoModelForTokenClassification,
    AutoTokenizer,
    BertForTokenClassification,
    BertTokenizerFast,
    TokenClassificationPipeline,
    pipeline,
)

# Constants
MODEL_TAG = "seyoungsong/SikuRoBERTa-NER-AJD-KLC"
MODEL_PATH = sroot.MODEL_DIR / "ner"
MAX_LENGTH = 512
NER_PREFIX = "▪"  # prefix for inline XML tags


def _iob2xml(tokens: list[str], ner_tags: list[str]) -> str:
    """Convert IOB tags to XML format."""
    assert len(tokens) == len(ner_tags), "not equal in length"

    result: list[str] = []
    open_tag: str | None = None

    for token, tag in zip(tokens, ner_tags, strict=True):
        if tag.startswith("B-"):
            if open_tag:
                result.append(f"</{open_tag}>")
            open_tag = NER_PREFIX + tag[2:]
            result.append(f"<{open_tag}>{token}")
        elif tag.startswith("I-") and open_tag:
            result.append(f"{token}")
        else:
            if open_tag:
                result.append(f"</{open_tag}>{token}")
                open_tag = None
            else:
                result.append(token)

    if open_tag:
        result.append(f"</{open_tag}>")

    return "".join(result)


def download_model(model_tag: str, model_path: str | Path) -> None:
    """Download model from HuggingFace Hub."""
    model_path = Path(model_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    snapshot_download(
        repo_id=model_tag,
        repo_type="model",
        local_dir=model_path,
        local_dir_use_symlinks=False,
    )


def load_model(model_path: str | Path, device: str = "cpu") -> Dict:
    """Load NER model and tokenizer."""
    model_path = Path(model_path)

    # Determine torch dtype based on device
    if "cuda" in device:
        torch_dtype = torch.float16
    elif "cpu" in device:
        torch_dtype = torch.float32
    else:
        raise ValueError(f"Unsupported device: {device}")

    # Find model path
    fnames = sorted(model_path.rglob("*.safetensors"))
    if len(fnames) == 0:
        logger.error(f"No model files found in {model_path}")
        return
    hface_path = fnames[0].parent

    # Load model and tokenizer
    tokenizer: BertTokenizerFast = AutoTokenizer.from_pretrained(
        hface_path, model_max_length=MAX_LENGTH
    )
    model: BertForTokenClassification = AutoModelForTokenClassification.from_pretrained(
        hface_path, device_map=device, torch_dtype=torch_dtype
    )
    model.eval()

    # Log model device
    logger.debug(f"Model device: {model.device}")

    # Create pipeline
    pipe: TokenClassificationPipeline = pipeline(
        task="ner", model=model, tokenizer=tokenizer
    )

    return {
        "model": model,
        "tokenizer": tokenizer,
        "pipe": pipe,
        "model_path": str(model_path),
        "device": device,
        "torch_dtype": torch_dtype,
    }


def _convert_to_ner_tags(text: str, pipe_result: list[dict]) -> list[str]:
    """Convert pipeline results to IOB format tags."""
    ner_tags = ["O"] * len(text)
    for p in pipe_result:
        start, end = p["start"], p["end"]
        # For 'B-' prefix, only the start position gets this tag
        ner_tags[start] = p["entity"]
        # For 'I-' prefix, all positions after the start till the end get this tag
        for i in range(start + 1, end):
            ner_tags[i] = "I" + p["entity"][1:]
    return ner_tags


def predict_batch_iob(
    texts: List[str], model_info: Dict
) -> List[Tuple[str, List[str]]]:
    """Predict NER tags for a batch of texts and return IOB tags."""
    pipe = model_info["pipe"]

    # Get predictions from model
    pipe_results = pipe(texts)

    # Convert predictions to IOB format
    results = []
    for text, pipe_result in zip(texts, pipe_results, strict=True):
        # Convert to IOB tags
        ner_tags = _convert_to_ner_tags(text, pipe_result)
        assert len(text) == len(ner_tags), "Length mismatch between text and NER tags"
        results.append((text, ner_tags))

    return results


def convert_iob_to_xml(text_iob_pairs: List[Tuple[str, List[str]]]) -> List[str]:
    """Convert IOB tags to XML format."""
    predictions = []
    for text, ner_tags in text_iob_pairs:
        prediction = _iob2xml(tokens=list(text), ner_tags=ner_tags)
        predictions.append(prediction)
    return predictions


def main():
    # Download model
    model_tag = MODEL_TAG
    model_path = MODEL_PATH
    download_model(model_tag=model_tag, model_path=model_path)

    # Load model
    device = "cpu"
    model_info = load_model(model_path=model_path, device=device)

    # Example usage
    texts = [
        "太宗高宗之世屡欲立明堂诸儒议其制度不决而止",
        "二月庚午毁乾元殿于其地作明堂以僧怀义为之使凡役数万人",
    ]

    # Get IOB predictions
    iob_results = predict_batch_iob(texts=texts, model_info=model_info)

    # Convert to XML
    xml_results = convert_iob_to_xml(iob_results)

    # Print results
    for (original, iob_tags), xml_result in zip(iob_results, xml_results):
        print(f"Original: {original}")
        print(f"XML     : {xml_result}")
        print(f"IOB tags: {iob_tags}")
        print()


if __name__ == "__main__":
    if hasattr(sys, "ps1"):
        pretty.install()
        reload(sroot)
    else:
        with logger.catch(onerror=lambda _: sys.exit(1)):
            # python -m tool.ner
            typer.run(main)

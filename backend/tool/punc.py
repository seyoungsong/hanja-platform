import json
import sys
import unicodedata
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
    pipeline,
)

MODEL_TAG = "seyoungsong/SikuRoBERTa-PUNC-AJD-KLC"
MODEL_PATH = sroot.MODEL_DIR / "punc"
MAX_LENGTH = 512


def download_model(model_tag: str, model_path: str | Path):
    model_path = Path(model_path)
    model_path.parent.mkdir(parents=True, exist_ok=True)
    snapshot_download(
        repo_id=model_tag,
        repo_type="model",
        local_dir=model_path,
        local_dir_use_symlinks=False,
    )


def load_model(model_path: str | Path, device: str = "cpu") -> Dict:
    model_path = Path(model_path)
    torch_dtype = torch.float16 if "cuda" in device else torch.float32

    # Find hface path
    fnames = sorted(model_path.rglob("*.safetensors"))
    if len(fnames) == 0:
        logger.error(f"No model files found in {model_path}")
        return
    hface_path = fnames[0].parent

    # Load model and tokenizer
    tokenizer = AutoTokenizer.from_pretrained(hface_path, model_max_length=MAX_LENGTH)
    model: BertForTokenClassification = AutoModelForTokenClassification.from_pretrained(
        hface_path, device_map=device, torch_dtype=torch_dtype
    )
    model.eval()

    # Create pipeline
    pipe = pipeline(task="ner", model=model, tokenizer=tokenizer)

    # Load label mappings
    label2id_path = hface_path / "label2id.json"
    if not label2id_path.is_file():
        label2id_path = hface_path.parent / "label2id.json"
    if not label2id_path.is_file():
        raise FileNotFoundError(
            f"label2id.json not found in {hface_path} or its parent directory"
        )

    label2id = json.loads(label2id_path.read_text(encoding="utf-8"))

    return {"model": model, "tokenizer": tokenizer, "pipe": pipe, "label2id": label2id}


def _align_predictions(
    text: str, predictions: List[dict]
) -> Tuple[List[str], List[str]]:
    words = list(text)
    labels = ["O" for _ in range(len(words))]

    for pred in predictions:
        idx = pred["end"] - 1
        labels[idx] = pred["entity"]

    return words, labels


def _reduce_punc(text: str) -> str:
    # Reduction mapping for basic punctuation
    reduce_map = {
        ",": ",",
        "-": ",",
        "/": ",",
        ":": ",",
        "|": ",",
        "·": ",",
        "、": ",",
        "?": "?",
        "!": "。",
        ".": "。",
        ";": "。",
        "。": "。",
    }

    # reduce to basic punctuation marks
    text = "".join([reduce_map.get(c, "") for c in text])

    # If no base punc was found, OTHER class is assigned.
    punc_order = "?。,"
    if len(set(text).intersection(punc_order)) == 0:
        return ""

    # inclusion criteria. more frequently represented one.
    counts = {c: text.count(c) for c in punc_order}
    max_count = max(counts.values())
    max_keys = {k for k, v in counts.items() if v == max_count}
    if len(max_keys) == 1:
        return max_keys.pop()

    # precedence order (strong to weak): question, period, comma
    for c in punc_order:
        if c in max_keys:
            return c

    # should not reach here
    raise ValueError(f"invalid segment: {text}")


def _insert_space(s1: str, chars: str) -> str:
    s2 = ""
    for c1 in s1:
        s2 += c1
        if c1 in chars:
            s2 += " "
    return s2


def predict_batch(
    texts: List[str], model_info: Dict, add_space: bool = True, reduce: bool = False
) -> List[str]:
    pipe = model_info["pipe"]
    label2id: dict = model_info["label2id"]

    # Create punctuation mapping from label2id
    label2punc = {f"B-{v}": k for k, v in label2id.items()}
    label2punc["O"] = ""

    if reduce:
        # Apply reduction with the full logic to handle complex patterns
        new_label2punc = {}
        for label, punc in label2punc.items():
            if label == "O":
                new_label2punc[label] = ""
            else:
                reduced = _reduce_punc(punc)
                new_label2punc[label] = reduced
        label2punc = new_label2punc

    # Add spaces after punctuation if requested
    if add_space:
        special_puncs = "!,:;?"
        label2punc = {k: _insert_space(v, special_puncs) for k, v in label2punc.items()}
        label2punc["O"] = ""

    # Get predictions from model
    predictions = pipe(texts)

    # Process each text
    results = []
    for text, text_predictions in zip(texts, predictions):
        words, labels = _align_predictions(text, text_predictions)

        # Build final text with punctuation
        result = ""
        for word, label in zip(words, labels):
            result += word
            punc = label2punc.get(label, "")
            result += punc

        result = result.strip()
        results.append(result)

    return results


def remove_punc(s: str) -> str:
    return "".join(c for c in s if unicodedata.category(c)[0] not in "PZ")


def main():
    # Download model
    model_tag = MODEL_TAG
    model_path = MODEL_PATH
    download_model(model_tag=model_tag, model_path=model_path)

    # Load model
    device = "cpu"
    model_info = load_model(model_path=model_path, device=device)

    # https://sillok.history.go.kr/id/kda_10010009_001
    s1 = '''○乙酉/上從上王, 田于雞山。 京畿都觀察使徐選來謁, 上王命: "自後觀察使勿見上王。" 嘗使河演諭政府、六曹曰: "主上不喜游田, 然肌膚肥重, 須當以時出遊節宣。 且文武不可偏廢, 我將與主上講武。"'''
    s2 = remove_punc(s1)
    texts = [s2]
    preds = predict_batch(texts=texts, model_info=model_info)

    print(texts[0])
    print(preds[0])

    # test
    tokenizer: BertTokenizerFast = model_info["tokenizer"]
    encoded = tokenizer.encode_plus(
        s1,
        add_special_tokens=True,
        return_attention_mask=False,
        return_token_type_ids=False,
    )

    # Get the tokens and their IDs
    tokens = tokenizer.convert_ids_to_tokens(
        encoded["input_ids"], skip_special_tokens=False
    )
    token_ids = encoded["input_ids"]
    print(list(zip(tokens, token_ids)))


if __name__ == "__main__":
    if hasattr(sys, "ps1"):
        pretty.install()
        reload(sroot)
    else:
        with logger.catch(onerror=lambda _: sys.exit(1)):
            # python -m tool.punc
            typer.run(main)

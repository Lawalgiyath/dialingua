"""Download + smoke-test NLLB-200-distilled-600M and verify the translation API
works on this transformers version. Run once to warm the HF cache."""
import sys
import time

MODEL_ID = "facebook/nllb-200-distilled-600M"


def main() -> int:
    t0 = time.time()
    print(f"[warmup] loading {MODEL_ID} (downloads ~2.5GB on first run)...", flush=True)
    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, src_lang="eng_Latn")
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_ID)
    print(f"[warmup] loaded in {time.time() - t0:.1f}s", flush=True)

    bos = tokenizer.convert_tokens_to_ids("yor_Latn")
    print(f"[warmup] yor_Latn bos id = {bos}", flush=True)
    if bos is None or bos == tokenizer.unk_token_id:
        print("[warmup] FAIL: yor_Latn token not recognised", flush=True)
        return 1

    text = "I am a good boy."
    inputs = tokenizer(text, return_tensors="pt")
    t1 = time.time()
    out = model.generate(**inputs, forced_bos_token_id=bos, max_length=128)
    result = tokenizer.batch_decode(out, skip_special_tokens=True)[0]
    print(f"[warmup] EN->YO: {text!r} -> {result!r}  ({time.time() - t1:.1f}s)", flush=True)
    print("[warmup] OK", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())

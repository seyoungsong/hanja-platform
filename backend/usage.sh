# dev
pip install "fastapi[standard]"
openssl rand -hex 16
FASTAPI_KEY=FASTAPI_KEY python -m fastapi dev src/demo_api/main.py --host 0.0.0.0 --port 7807

# api
(tmux kill-session -t demo_api || true) &&
    tmux new-session -d -s demo_api &&
    tmux send-keys -t demo_api "FASTAPI_KEY=FASTAPI_KEY conda run --no-capture-output -n mmm python -m fastapi run src/demo_api/main.py --port 7807" C-m

# vllm
(tmux kill-session -t demo_vllm || true) &&
    tmux new-session -d -s demo_vllm &&
    tmux send-keys -t demo_vllm "CUDA_VISIBLE_DEVICES=7 conda run --no-capture-output -n vllm vllm serve seyoungsong/Qwen2-7B-HanjaMT-AJD-KLC-AWQ --api-key VLLM_KEY --device cuda --dtype float16 --gpu-memory-utilization 0.8 --host 0.0.0.0 --kv-cache-dtype auto --load-format auto --max-model-len 2048 --port 7806 --seed 42 --quantization awq" C-m

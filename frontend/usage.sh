# dev
(tmux kill-session -t demo_remix || true) &&
  tmux new-session -d -s demo_remix &&
  tmux send-keys -t demo_remix "task dev" C-m

# prod
(tmux kill-session -t demo_remix || true) &&
  tmux new-session -d -s demo_remix &&
  tmux send-keys -t demo_remix "PORT=7808 task bs" C-m

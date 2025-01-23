# 🏛️ HERITAGE: Making Korean Historical Documents Accessible Through AI

Official code for the paper "HERITAGE: An End-to-End Web Platform for Processing Korean Historical Documents in Hanja". If you use this code, please cite our paper.

## Web-based Platform

You can interact with HERITAGE's web-based platform at [`https://hanja.dev`](https://hanja.dev). We encourage you to check our [demo video](https://hanja.dev/video) to get familiar with our platform.

## Neural Modules of HERITAGE for 3 NLP Tasks

HERITAGE provides three critical NLP modules for processing Korean historical documents:

1. **Punctuation Restoration (PR)**

   - Fine-tuned SikuRoBERTa model supporting three annotation modes
   - F1 scores: 88.61 on royal records, 87.76 on literary works

2. **Named Entity Recognition (NER)**

   - Fine-tuned SikuRoBERTa model recognizing Person, Location, and Misc entities
   - F1 scores: 97.53 on royal records, 83.55 on literary works

3. **Machine Translation (MT)**
   - Fine-tuned Qwen2-7B model supporting Hanja-to-Korean and Hanja-to-English translation
   - BLEU scores: 48.97 (Korean) and 33.15 (English) for royal records, 33.07 (Korean) for literary works

## Features

- Multiple annotation modes for punctuation restoration
- Color-coded entity visualization for NER
- Parallel bilingual output for MT
- Interactive glossary with Korean pronunciations and English definitions
- Comprehensive user management and annotation history tracking
- Data export functionality in JSON and Excel formats

## Deploy HERITAGE on Your Local Machine

### System Requirements

- Ubuntu 18.04 or higher
- Docker installation
- Minimum 8GB RAM for container operations and BERT model inference
- For MT functionality:
  - GPU with CUDA 12.1 or higher
  - Compute capability 7.5+
  - Minimum 11GB VRAM

### Installation Steps

1. Clone this repository
2. Install the required dependencies
3. Follow deployment instructions in the `deployment` folder

You can find more detailed deployment instructions in the [`deployment`](./deployment/README.md) folder.

## Citation

If you use our toolkit, we'd appreciate if you cite our paper:

```bibtex
@article{song2025heritage,
  title         = {HERITAGE: An End-to-End Web Platform for Processing Korean Historical Documents in Hanja},
  author        = {Seyoung Song and Haneul Yoo and Jiho Jin and Kyunghyun Cho and Alice Oh},
  year          = {2025},
  eprint        = {2501.11951},
  archiveprefix = {arXiv},
  primaryclass  = {cs.CL},
  url           = {https://arxiv.org/abs/2501.11951},
  journal       = {arXiv preprint arXiv:2501.11951}
}
```

## License

This project is licensed under the terms of the Apache License 2.0.

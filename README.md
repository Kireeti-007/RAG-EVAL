# 🧠 RAG Eval Dashboard

> **Retrieval-Augmented Generation** pipeline with an automated 4-metric
> quality evaluation system — powered by Google Gemini and ChromaDB.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)
![Streamlit](https://img.shields.io/badge/Streamlit-1.35+-FF4B4B?style=flat&logo=streamlit&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash-4285F4?style=flat&logo=google&logoColor=white)
![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector_DB-orange?style=flat)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## What This Project Does

Most RAG demos stop at "ask questions about your PDF." This one goes further.

Upload any document. Ask questions. Get grounded answers with source citations.
Then **automatically score** every answer across 4 quality dimensions using
Gemini as a judge — so you know *how good* your RAG system actually is, not
just that it returned something.

---

## Features

- **Document ingestion** — Upload PDF, TXT, or Markdown files. Each file is
  cleaned, split into overlapping chunks, embedded with Google's
  `text-embedding-004` model, and stored in a local ChromaDB vector database.

- **Grounded RAG chat** — Streaming answers from `gemini-1.5-flash` with
  inline source citations `[1]`, `[2]` mapped back to real document chunks.
  The model is explicitly instructed to use *only* retrieved context.

- **LLM-as-a-Judge evaluation** — Four automated metrics scored 0.0 → 1.0:

  | Metric | What it catches |
  |---|---|
  | **Faithfulness** | Hallucinations — facts not in the retrieved context |
  | **Answer Relevance** | Off-topic or evasive answers |
  | **Context Relevance** | Poor retrieval — irrelevant chunks returned |
  | **Completeness** | Partial answers that miss sub-questions |

- **Quality dashboard** — Interactive Plotly charts tracking score trends
  over time, per-metric averages, score distribution, and per-document
  comparisons. All results persist to disk across sessions.

---

## Architecture

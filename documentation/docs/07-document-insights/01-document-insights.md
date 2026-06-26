---
sidebar_position: 1
id: document-insights
title: Document Insights
---

# Document Insights

**Document Insights** lets you upload a batch of documents, define the questions you care about, and use AI to extract answers across every document at once. Results appear in a **spreadsheet-style matrix** — one row per document, one column per question — with status flags, detailed explanations, per-document summaries, and CSV export.

<!-- Replace the placeholder below with a screen recording of the full Document Insights workflow. -->
![Document Insights — overview](./img/feature-document-insights.gif)

---

## Creating a Document Insights Task

1. Open your project and click **"+"** next to **Tasks** in the sidebar (or from the project home page).
2. Choose **"Get insights from multiple documents"** as the task type.
3. Give the task a name and (optionally) a description, then click **Create**.

---

## Adding Documents

On the task page, click **Add Document** and upload the files you want to analyse. Supported formats include PDF, Word (.docx/.doc), Excel (.xlsx/.xls), PowerPoint (.pptx), plain text, and more.

Each uploaded document becomes one **row** in the insights grid.

---

## Defining Questions

Click **Questions** (top-right of the grid) to open the questions panel.

- Click **Add Question** and enter a title and the question text.
- Questions become **columns** in the matrix — the AI answers every question for every document.
- You can reorder questions by dragging them, and optionally attach **supporting documents** to a question for extra context.

---

## Running Generation

Use the **Generate** button and choose one of the following modes:

| Mode | Behaviour |
|------|-----------|
| **Generate New** | Fill only cells that have no answer yet. |
| **Generate All** | Regenerate all cells (overwrites existing answers). |
| **Generate Selected** | Regenerate answers only for the checked documents. |

You can also click an individual cell to regenerate a single answer.

Generation runs as a background batch job. A progress indicator appears while it is running; click **Stop** to cancel early.

---

## Reading Results

Each cell in the grid contains:

- **Answer Value** — a short, concise answer.
- **Description** — a detailed markdown explanation (click the cell to expand).
- **Status flag** — a colour-coded indicator:

| Flag | Meaning |
|------|---------|
| Info | Informational finding, no action required. |
| OK | Positive / compliant result. |
| Warning | Potential issue worth reviewing. |
| Minor Issue | Small problem identified. |
| Major Issue | Significant problem found. |
| Critical Issue | Serious non-compliance or risk. |
| N/A | Question not applicable to this document. |

Click the summary icon in the first column of a document row to view or regenerate its **overall document summary**.

---

## Exporting to CSV

Click **Export** in the header to download the full matrix as a CSV file. You can also export the results for a single document from the document detail panel.

---

## Tips

- Add a **task prompt** (in task settings) to guide all AI answers with shared context or instructions.
- Attach supporting documents to individual questions when the question requires reference material that isn't in the document itself.
- Use **Generate Selected** after editing a question to refresh only the affected rows without re-running the entire batch.

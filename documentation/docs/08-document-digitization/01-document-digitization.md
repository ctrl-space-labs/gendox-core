---
sidebar_position: 1
id: document-digitization
title: Document Digitization
---

# Document Digitization

**Document Digitization** turns scanned PDFs and office files into clean, machine-readable output **page by page**, using vision-capable LLMs instead of traditional OCR. Add an optional **JSON schema** to extract structured data in a single pass, then export all results to CSV.

Supported input formats: PDF, Word (.docx/.doc), Excel (.xlsx/.xls), PowerPoint (.pptx), plain text, Markdown, CSV, and more.

<!-- Replace the placeholder below with a screen recording of the full Document Digitization workflow. -->
![Document Digitization — overview](./img/feature-document-digitization.gif)

---

## Creating a Document Digitization Task

1. Open your project and click **"+"** next to **Tasks** in the sidebar (or from the project home page).
2. Choose **"Digitize scanned documents page-by-page"** as the task type.
3. Give the task a name and (optionally) a description, then click **Create**.

---

## Adding Documents

On the task page, click **Add Document** and upload the files you want to digitize. Each document row shows its current status:

| Status | Meaning |
|--------|---------|
| Not Digitized | No results yet. |
| Generating… | Batch job is currently running. |
| Digitized | All pages have been processed. |
| Unsupported Format | File type cannot be processed. |
| No Prompt | A prompt is required before generating. |

---

## Configuring a Document

Click on a document row to open its detail panel and configure two settings:

### Prompt

Write a plain-language instruction telling the AI what to do with each page. If left empty, the default prompt produces clean **Markdown text** from the page content.

**Example prompts:**
- *"Extract all invoice line items and totals."*
- *"Summarise this page in 3 bullet points."*
- *"Transcribe the handwritten text as accurately as possible."*

### Structure (optional)

Paste a **JSON Schema** here if you want the output to be structured JSON instead of free text. The AI will return a structured object conforming to your schema for each page.

**Example schema for invoice extraction:**
```json
{
  "type": "object",
  "properties": {
    "invoice_number": { "type": "string" },
    "date": { "type": "string" },
    "total_amount": { "type": "number" },
    "line_items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "description": { "type": "string" },
          "quantity": { "type": "number" },
          "unit_price": { "type": "number" }
        }
      }
    }
  }
}
```

---

## Page Input Mode

When adding a document you can choose how each page is sent to the model:

| Mode | When to use |
|------|-------------|
| **Use Printed Pages** (render to image) | Best for scanned documents, forms, or anything where layout and visual context matter. Each page is rendered as an image and sent to a vision-capable model. |
| **Use Extracted Text** | Best for digitally created PDFs or Office files where text can be extracted directly. Faster and cheaper than image rendering. |

---

## Running Generation

Use the **Generate** button and choose a mode:

| Mode | Behaviour |
|------|-----------|
| **Generate New** | Process only documents that have no results yet. |
| **Generate All** | Re-process all documents (overwrites existing results). |
| **Generate Selected** | Process only the checked documents. |

Generation runs as a background batch job — one LLM call per page, in parallel. A progress indicator appears while the job is running; click **Stop** to cancel.

---

## Reviewing Results

Click a document row to open the **page preview panel**, where you can scroll through each page and inspect the digitized output side by side with the original.

---

## Exporting to CSV

Click **Export** in the task header to download all results as a CSV file, with one row per page and columns for the page number, raw output, and (if structured) the extracted JSON fields.

---

## Tips

- Use the **Structure** field together with a targeted prompt to extract the same fields from hundreds of documents in one job.
- Start with **Generate Selected** on a couple of test documents to verify your prompt and schema before running the full batch.
- If a page is blank or contains only images with no relevant text, add instructions for that case in your prompt (e.g. *"If the page contains no useful content, return an empty object."*).

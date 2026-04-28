# Gendox Workspace

Workspace για να τρέχεις το Gendox Python SDK.

---

## 1. Εγκατάσταση (μόνο μια φορά)

```bash
cd gendox-workspace
./install.sh
```

Εγκαθιστά το SDK globally — δεν χρειάζεται activation ή virtual environment.

---

## 2. Ρύθμιση credentials

```bash
cp .env.example .env
```

Άνοιξε το `.env` και συμπλήρωσε τα παρακάτω:

| Variable | Τι είναι |
|---|---|
| `GENDOX_TOKEN` | Bearer token — άνοιξε Gendox στο browser → F12 → Network → copy το `Authorization` header |
| `GENDOX_API_URL` | π.χ. `https://dev-app.gendox.dev/gendox/api/v1` |
| `GENDOX_ORG_ID` | Organization UUID |
| `GENDOX_PROJECT_ID` | Project UUID |
| `GENDOX_TASK_ID` | Digitization task UUID |

---

## 3. Πρόσθεσε αρχεία

Βάλε τα αρχεία σου στον φάκελο `input/`:

```
input/
├── τιμολογιο_ιαν.pdf
└── αναφορα_q1.xlsx
```

Υποστηριζόμενοι τύποι: `.pdf` `.docx` `.doc` `.xls` `.xlsx` `.txt` `.md` `.rst`

---

## 4. Εκτέλεση

**Επιλογή Α — Python script (απλό):**

```bash
./run.sh
```

**Επιλογή Β — CLI (περισσότερες επιλογές):**

```bash
# Κανονική εκτέλεση
gendox digitize

# Σβήσε παλιά δεδομένα και ξεκίνα από την αρχή
gendox digitize --clean-task

# Μην ξαναφορτώσεις αρχεία, απλά ξανατρέξε το task
gendox digitize --skip-upload

# Export σε όλες τις μορφές (csv + markdown + json)
gendox digitize --skip-upload --export-format all

# Συνέχισε μια διακοπείσα εκτέλεση
gendox digitize --resume

# Δες όλες τις επιλογές
gendox digitize --help
```

Τα αποτελέσματα αποθηκεύονται στον φάκελο `output/` με όνομα `{document_name}_{YYYYMMDD_HHMMSS}.{ext}`.

---

## Μεταβλητές .env

| Variable | Απαιτείται | Default | Περιγραφή |
|---|---|---|---|
| `GENDOX_TOKEN` | ναι | — | Bearer token (πρέπει να αρχίζει με `Bearer `) |
| `GENDOX_API_URL` | ναι | — | API base URL |
| `GENDOX_ORG_ID` | ναι | — | Organization UUID |
| `GENDOX_PROJECT_ID` | ναι | — | Project UUID |
| `GENDOX_TASK_ID` | ναι | — | Digitization task UUID |
| `GENDOX_DOCUMENT_PROMPT` | όχι | _(κενό)_ | Prompt που επισυνάπτεται σε κάθε αρχείο |
| `GENDOX_EXPORT_FORMAT` | όχι | `csv` | `csv` / `markdown` / `json` / `all` |
| `GENDOX_CLEAN_TASK` | όχι | `false` | `true` = σβήσε παλιά nodes πριν το upload |
| `GENDOX_SKIP_UPLOAD` | όχι | `false` | `true` = παράλειψε το upload, ξανατρέξε μόνο το task |

---

## Αντιμετώπιση σφαλμάτων

| Σφάλμα | Λύση |
|---|---|
| `command not found: gendox` | Τρέξε ξανά `./install.sh` |
| `GendoxAuthError` | Το `GENDOX_TOKEN` πρέπει να αρχίζει με `Bearer ` (κεφαλαίο B, κενό μετά) |
| `GendoxTimeoutError` | Το task άργησε πολύ — ξανατρέξε με `gendox digitize --resume` |
| `GendoxAPIError` | Έλεγξε `GENDOX_API_URL`, org/project/task IDs |
| Κανένα αρχείο δεν ανέβηκε | Έλεγξε ότι ο φάκελος `input/` περιέχει αρχεία υποστηριζόμενου τύπου |

---

## Βήματα pipeline

| Βήμα | Περιγραφή |
|---|---|
| 0 | _(προαιρετικό)_ Διαγραφή παλιών DOCUMENT nodes — μόνο με `--clean-task` |
| 1 | Upload αρχείων από τον φάκελο `input/` |
| 2 | Σύνδεση αρχείων με το task |
| 3 | Split & Train — ευρετηρίαση στο vector store |
| 4 | Εκτέλεση του digitization task |
| 5 | Export αποτελεσμάτων στον φάκελο `output/` |

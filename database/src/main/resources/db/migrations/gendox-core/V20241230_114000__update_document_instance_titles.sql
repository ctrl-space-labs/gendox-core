-- Migration: Update titles for document instances with null titles


WITH updated_documents AS (
    SELECT
        id,
        remote_url,
        -- Extract the file name (after the last slash) from the URL and clean it up to be a title.
        TRIM(BOTH ' ' FROM REGEXP_REPLACE(SPLIT_PART(remote_url, '/', -1), '-([0-9]+)', ' ', 'g')) AS new_title
    FROM
        gendox_core.document_instance
    WHERE
        title IS NULL OR title = ''
)
UPDATE gendox_core.document_instance
SET
    title = updated_documents.new_title
FROM updated_documents
WHERE gendox_core.document_instance.id = updated_documents.id;

WITH updated_titles AS (
    SELECT
        id,
        title,
        -- Replace underscores and dashes with spaces, remove file extension
        REGEXP_REPLACE(
            TRIM(BOTH ' ' FROM REPLACE(REPLACE(title, '_', ' '), '-', ' ')),
            '\.[a-zA-Z0-9]+$',
            '',
            'g'
        ) AS new_title
    FROM
        gendox_core.document_instance
    WHERE
        title IS NOT NULL AND title != ''
)
UPDATE gendox_core.document_instance
SET
    title = updated_titles.new_title
FROM updated_titles
WHERE gendox_core.document_instance.id = updated_titles.id;

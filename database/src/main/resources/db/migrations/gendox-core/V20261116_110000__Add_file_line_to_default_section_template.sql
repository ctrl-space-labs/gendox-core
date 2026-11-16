-- A retrieved section names its file the way every tool does: one line with the path, when the file was
-- last modified and its id. The title stays readable inside the path.
UPDATE gendox_core.templates
SET text = replace(text,
                   'Title: ' || '$' || '{documentTitle}',
                   'File: ' || '$' || '{file}')
WHERE name = 'Default Section Template';



-- ==============================================
-- Idempotent migration to change columns to TEXT
-- ==============================================

DO $$
    BEGIN
        -- 1) gendox_core.templates.text
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
              AND table_name   = 'templates'
              AND column_name  = 'text'
              AND data_type   <> 'text'
        ) THEN
            ALTER TABLE gendox_core.templates
                ALTER COLUMN "text" TYPE text;
        END IF;

        -- 2) Possibility A: Table = integrations, column = queue_name
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
              AND table_name   = 'integrations'
              AND column_name  = 'queue_name'
              AND data_type   <> 'text'
        ) THEN
            ALTER TABLE gendox_core.integrations
                ALTER COLUMN queue_name TYPE text;
        END IF;



        -- 3) gendox_core.message_section.section_url
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
              AND table_name   = 'message_section'
              AND column_name  = 'section_url'
              AND data_type   <> 'text'
        ) THEN
            ALTER TABLE gendox_core.message_section
                ALTER COLUMN section_url TYPE text;
        END IF;

        -- 4) gendox_core.api_keys.api_key
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
              AND table_name   = 'api_keys'
              AND column_name  = 'api_key'
              AND data_type   <> 'text'
        ) THEN
            ALTER TABLE gendox_core.api_keys
                ALTER COLUMN api_key TYPE text;
        END IF;

        -- 5) gendox_core.organization_web_sites.url
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
              AND table_name   = 'organization_web_sites'
              AND column_name  = 'url'
              AND data_type   <> 'text'
        ) THEN
            ALTER TABLE gendox_core.organization_web_sites
                ALTER COLUMN url TYPE text;
        END IF;

        -- 6) gendox_core.temp_integration_file_checks.external_url
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
              AND table_name   = 'temp_integration_file_checks'
              AND column_name  = 'external_url'
              AND data_type   <> 'text'
        ) THEN
            ALTER TABLE gendox_core.temp_integration_file_checks
                ALTER COLUMN external_url TYPE text;
        END IF;

        -- 7) gendox_core.temp_integration_file_checks.remote_url
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
              AND table_name   = 'temp_integration_file_checks'
              AND column_name  = 'remote_url'
              AND data_type   <> 'text'
        ) THEN
            ALTER TABLE gendox_core.temp_integration_file_checks
                ALTER COLUMN remote_url TYPE text;
        END IF;

        -- 8) gendox_core.document_instance.external_url
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
              AND table_name   = 'document_instance'
              AND column_name  = 'external_url'
              AND data_type   <> 'text'
        ) THEN
            ALTER TABLE gendox_core.document_instance
                ALTER COLUMN external_url TYPE text;
        END IF;

        -- 9) gendox_core.document_instance.title
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'gendox_core'
              AND table_name   = 'document_instance'
              AND column_name  = 'title'
              AND data_type   <> 'text'
        ) THEN
            ALTER TABLE gendox_core.document_instance
                ALTER COLUMN title TYPE text;
        END IF;

    END $$;






DROP FUNCTION IF EXISTS gendox_core.fn_url_encode(text);

-- ===========================================
-- Function: gendox_core.fn_url_encode
-- ===========================================
-- Description:
-- A helper function to URL-encode a given input string. Replaces
-- reserved and special characters with their URL-encoded equivalents.
--
-- Parameters:
-- - input: Text to be URL-encoded.
--
-- Returns:
-- - URL-encoded text.
--
-- Usage:
--   SELECT gendox_core.fn_url_encode('example string');
-- ===========================================
CREATE OR REPLACE FUNCTION gendox_core.fn_url_encode(input text)
    RETURNS text
    LANGUAGE plpgsql
AS $$
DECLARE
    tmp text := input;
BEGIN
    tmp := replace(tmp, '%', '%25');
    tmp := replace(tmp, ' ', '%20');
    tmp := replace(tmp, '"', '%22');
    tmp := replace(tmp, '#', '%23');
    tmp := replace(tmp, '<', '%3C');
    tmp := replace(tmp, '>', '%3E');
    tmp := replace(tmp, '|', '%7C');
    tmp := replace(tmp, ':', '%3A');
    tmp := replace(tmp, '/', '%2F');
    tmp := replace(tmp, '\', '%5C');
    tmp := replace(tmp, '?', '%3F');
    tmp := replace(tmp, '&', '%26');
    tmp := replace(tmp, '=', '%3D');
    tmp := replace(tmp, '+', '%2B');
    tmp := replace(tmp, '-', '%2D');
    tmp := replace(tmp, '(', '%28');
    tmp := replace(tmp, ')', '%29');
    tmp := replace(tmp, '''', '%27');  -- apostrophe
    tmp := replace(tmp, ',', '%2C');
    RETURN tmp;
END;
$$;

DROP FUNCTION IF EXISTS gendox_core.transform_s3_to_onedrive(
    text, text, text, text, text, text, text, text, text
);

-- ===========================================
-- Function: gendox_core.transform_s3_to_onedrive
-- ===========================================
-- Description:
-- Transforms an internal S3 URL into a OneDrive/SharePoint-compatible URL.
-- Handles custom path delimiters, file extensions, and combines
-- user-defined prefixes with the S3 file path to construct the final URL.
--
-- Parameters:
-- - p_internal_url:       The S3 URL containing the file path.
-- - p_project_name:       The project-specific path to locate in the S3 URL.
-- - p_delimiter:          The custom delimiter in the S3 URL (e.g. '_!_').
-- - p_ext_in:             The file extension in the S3 URL to replace (e.g. '.md').
-- - p_ext_out:            The file extension for the resulting URL (e.g. '.pdf').
-- - p_onedrive_base_url:  The base URL for OneDrive/SharePoint.
-- - p_onedrive_prefix:    The root path for the OneDrive/SharePoint directory.
-- - p_extra_prefix:       Additional subdirectory structure to prepend.
-- - p_onedrive_query:     Optional query parameters for the final URL.
--
-- Returns:
-- - The constructed OneDrive/SharePoint URL as text.
--
-- Usage:
--   SELECT gendox_core.transform_s3_to_onedrive(
--       p_internal_url := 's3://bucket/.../folder_subfolder/file_name.md',
--       p_project_name := '/u6910_tap/',
--       p_delimiter := '_!_',
--       p_ext_in := '.md',
--       p_ext_out := '.pdf',
--       p_onedrive_base_url := 'https://example-my.sharepoint.com/personal/.../onedrive.aspx',
--       p_onedrive_prefix := '/personal/user/Documents/Requests/',
--       p_extra_prefix := 'Extra/Prefix/',
--       p_onedrive_query := ''
--   );
-- ===========================================
CREATE OR REPLACE FUNCTION gendox_core.transform_s3_to_onedrive(
    p_internal_url       text,
    p_project_name       text,
    p_delimiter          text,
    p_ext_in             text,
    p_ext_out            text,
    p_onedrive_base_url  text,
    p_onedrive_prefix    text,
    p_extra_prefix       text,
    p_onedrive_query     text
)
    RETURNS text
    LANGUAGE plpgsql
AS
$$
DECLARE
    pos_project    int;   -- Position of p_project_name in p_internal_url.
    relative_path  text;  -- Portion after p_project_name.
    replaced_path  text;  -- After replacing the custom delimiter and file extension.
    encoded_file   text;  -- The final URL-encoded file portion.
    prefix_encoded text;  -- The URL-encoded combination of p_onedrive_prefix + p_extra_prefix.
    full_encoded   text;  -- prefix_encoded + encoded_file (used for 'id=' parameter).
    rev_full       text;  -- Reverse of full_encoded (for computing 'parent=').
    pos_last_slash int;   -- Position of the last '%2F' in rev_full.
    parent_encoded text;  -- Encoded parent directory portion.
    final_url      text;  -- The final constructed URL.
BEGIN
    -- 1) Locate p_project_name in p_internal_url.
    pos_project := position(p_project_name in p_internal_url);
    IF pos_project = 0 THEN
        RAISE EXCEPTION
            'URL does not contain project_name (%), cannot parse: %',
            p_project_name, p_internal_url;
    END IF;

    -- 2) Extract substring after p_project_name.
    relative_path := substring(
            p_internal_url
            FROM pos_project + length(p_project_name)
            FOR char_length(p_internal_url)
                     );

    -- 3) Replace the custom path delimiter with '/'.
    replaced_path := replace(relative_path, p_delimiter, '/');

    -- 4) Replace the input file extension (p_ext_in) with the output extension (p_ext_out).
    replaced_path := replace(replaced_path, p_ext_in, p_ext_out);

    -- 5) URL-encode the final portion.
    encoded_file := gendox_core.fn_url_encode(replaced_path);

    -- 6) Combine the OneDrive prefix + extra prefix, then URL-encode them.
    prefix_encoded := gendox_core.fn_url_encode(p_onedrive_prefix || p_extra_prefix);

    -- 7) The final path for 'id=' is prefix_encoded + encoded_file.
    full_encoded := prefix_encoded || encoded_file;

    -- 8) Compute 'parent=' by removing the last segment from full_encoded.
    rev_full := reverse(full_encoded);
    pos_last_slash := position('F2%' in rev_full);  -- 'F2%' is '%2F' reversed.
    IF pos_last_slash = 0 THEN
        RAISE EXCEPTION
            'Could not compute parent folder from path: %', replaced_path;
    END IF;

    parent_encoded := reverse(
            substring(rev_full
                      FROM pos_last_slash + length('F2%')
                      FOR char_length(rev_full))
                      );

    -- 9) Build the final URL (append p_onedrive_query, id=, and parent=).
    final_url := p_onedrive_base_url
                     || '?'
                     || p_onedrive_query
                     || '&id='     || full_encoded
                     || '&parent=' || parent_encoded;

    RETURN final_url;
END;
$$;


CREATE OR REPLACE FUNCTION gendox_core.log_organization_plan_history()
    RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO gendox_historic_data.organization_plan_history (
        id,
        organization_id,
        subscription_plan_id,
        api_rate_limit_id,
        start_date,
        end_date,
        number_of_seats,
        created_at,
        updated_at,
        recorded_at
    )
    VALUES (
               NEW.id,
               NEW.organization_id,
               NEW.subscription_plan_id,
               NEW.api_rate_limit_id,
               NEW.start_date,
               NEW.end_date,
               NEW.number_of_seats,
               NEW.created_at,
               NEW.updated_at,
               NOW()
           );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trg_log_organization_plan_history ON gendox_core.organization_plan;


CREATE TRIGGER trg_log_organization_plan_history
    AFTER INSERT OR UPDATE ON gendox_core.organization_plan
    FOR EACH ROW
EXECUTE FUNCTION gendox_core.log_organization_plan_history();


CREATE OR REPLACE FUNCTION gendox_core.log_project_agent_history()
    RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO gendox_historic_data.project_agent_history (
        id,
        project_id,
        semantic_search_model_id,
        completion_model_id,
        agent_name,
        agent_behavior,
        private_agent,
        created_at,
        updated_at,
        created_by,
        updated_by,
        document_splitter_type,
        chat_template_id,
        section_template_id,
        user_id,
        max_token,
        temperature,
        top_p,
        moderation_check,
        moderation_model_id,
        agent_vc_jwt,
        organization_did,
        max_search_limit,
        max_completion_limit,
        rerank_enable,
        rerank_model_id,
        advanced_search_enable,
        advanced_search_model_id,
        recorded_at
    )
    VALUES (
               NEW.id,
               NEW.project_id,
               NEW.semantic_search_model_id,
               NEW.completion_model_id,
               NEW.agent_name,
               NEW.agent_behavior,
               NEW.private_agent,
               NEW.created_at,
               NEW.updated_at,
               NEW.created_by,
               NEW.updated_by,
               NEW.document_splitter_type,
               NEW.chat_template_id,
               NEW.section_template_id,
               NEW.user_id,
               NEW.max_token,
               NEW.temperature,
               NEW.top_p,
               NEW.moderation_check,
               NEW.moderation_model_id,
               NEW.agent_vc_jwt,
               NEW.organization_did,
               NEW.max_search_limit,
               NEW.max_completion_limit,
               NEW.rerank_enable,
               NEW.rerank_model_id,
               NEW.advanced_search_enable,
               NEW.advanced_search_model_id,
               NOW()
           );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS trg_log_project_agent_history ON gendox_core.project_agent;

CREATE TRIGGER trg_log_project_agent_history
    AFTER INSERT OR UPDATE ON gendox_core.project_agent
    FOR EACH ROW
EXECUTE FUNCTION gendox_core.log_project_agent_history();


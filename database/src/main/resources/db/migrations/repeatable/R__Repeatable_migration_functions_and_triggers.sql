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

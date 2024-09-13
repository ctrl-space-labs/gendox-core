-- Indexes for user_organization table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'gendox_core' AND tablename = 'user_organization' AND indexname = 'idx_user_organization_user_id') THEN
        CREATE INDEX idx_user_organization_user_id ON gendox_core.user_organization(user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'gendox_core' AND tablename = 'user_organization' AND indexname = 'idx_user_organization_organization_id') THEN
        CREATE INDEX idx_user_organization_organization_id ON gendox_core.user_organization(organization_id);
    END IF;
END $$;

-- Indexes for project_members table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'gendox_core' AND tablename = 'project_members' AND indexname = 'idx_project_members_user_id') THEN
        CREATE INDEX idx_project_members_user_id ON gendox_core.project_members(user_id);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'gendox_core' AND tablename = 'project_members' AND indexname = 'idx_project_members_project_id') THEN
        CREATE INDEX idx_project_members_project_id ON gendox_core.project_members(project_id);
    END IF;
END $$;

-- Indexes for project_agent table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'gendox_core' AND tablename = 'project_agent' AND indexname = 'idx_project_agent_project_id') THEN
        CREATE INDEX idx_project_agent_project_id ON gendox_core.project_agent(project_id);
    END IF;
END $$;

-- Indexes for projects table
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'gendox_core' AND tablename = 'projects' AND indexname = 'idx_projects_organization_id') THEN
        CREATE INDEX idx_projects_organization_id ON gendox_core.projects(organization_id);
    END IF;
END $$;


-- Analyze the above tables
ANALYZE gendox_core.user_organization;
ANALYZE gendox_core.project_members;
ANALYZE gendox_core.project_agent;
ANALYZE gendox_core.projects;


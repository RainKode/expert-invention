-- Sprint 3: Custom Fields + Saved Views Schema
-- Depends on: 002_sprint2_schema.sql

-- ──────────────────────────────────────────────
-- Custom Field Types
-- ──────────────────────────────────────────────
CREATE TYPE public.custom_field_type AS ENUM ('text', 'number', 'date', 'dropdown', 'checkbox');
CREATE TYPE public.custom_field_scope_type AS ENUM ('team', 'project', 'global');
CREATE TYPE public.custom_field_status AS ENUM ('active', 'archived');
CREATE TYPE public.saved_view_scope AS ENUM ('personal', 'shared');

-- ──────────────────────────────────────────────
-- Custom Field Definitions
-- ──────────────────────────────────────────────
CREATE TABLE public.custom_field_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    field_type      public.custom_field_type NOT NULL,
    options         JSONB,          -- array of strings for dropdown type
    scope_type      public.custom_field_scope_type NOT NULL DEFAULT 'team',
    scope_id        UUID,           -- team_id or project_id; NULL for global
    created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    status          public.custom_field_status NOT NULL DEFAULT 'active',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Custom Field Values (per task)
-- ──────────────────────────────────────────────
CREATE TABLE public.custom_field_values (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id                 UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    field_definition_id     UUID NOT NULL REFERENCES public.custom_field_definitions(id) ON DELETE RESTRICT,
    value                   TEXT,           -- all types stored as text, cast on read
    set_by                  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (task_id, field_definition_id)
);

-- ──────────────────────────────────────────────
-- Saved Views
-- ──────────────────────────────────────────────
CREATE TABLE public.saved_views (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    filters         JSONB NOT NULL DEFAULT '{}',  -- stored filter state
    scope           public.saved_view_scope NOT NULL DEFAULT 'personal',
    created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id         UUID REFERENCES public.teams(id) ON DELETE CASCADE,  -- for shared views
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────
CREATE INDEX idx_custom_field_defs_scope     ON public.custom_field_definitions (scope_type, scope_id);
CREATE INDEX idx_custom_field_defs_status    ON public.custom_field_definitions (status);
CREATE INDEX idx_custom_field_defs_created   ON public.custom_field_definitions (created_by);
CREATE INDEX idx_custom_field_values_task    ON public.custom_field_values (task_id);
CREATE INDEX idx_custom_field_values_defn    ON public.custom_field_values (field_definition_id);
CREATE INDEX idx_saved_views_creator         ON public.saved_views (created_by);
CREATE INDEX idx_saved_views_team            ON public.saved_views (team_id);

-- ──────────────────────────────────────────────
-- Updated-at triggers
-- ──────────────────────────────────────────────
CREATE TRIGGER custom_field_defs_updated_at
    BEFORE UPDATE ON public.custom_field_definitions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER custom_field_values_updated_at
    BEFORE UPDATE ON public.custom_field_values
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER saved_views_updated_at
    BEFORE UPDATE ON public.saved_views
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ──────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────
ALTER TABLE public.custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_views ENABLE ROW LEVEL SECURITY;

-- Custom field definitions: authenticated users can read; manager+ can write
CREATE POLICY "custom_field_defs_select" ON public.custom_field_definitions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "custom_field_defs_insert" ON public.custom_field_definitions
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'senior_manager', 'admin', 'assistant_manager')
        )
    );

CREATE POLICY "custom_field_defs_update" ON public.custom_field_definitions
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('manager', 'senior_manager', 'admin', 'assistant_manager')
        )
    );

-- Custom field values: task participants can read/write
CREATE POLICY "custom_field_values_select" ON public.custom_field_values
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "custom_field_values_insert" ON public.custom_field_values
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "custom_field_values_update" ON public.custom_field_values
    FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- Saved views: personal = creator only; shared = same team
CREATE POLICY "saved_views_select" ON public.saved_views
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid()
        OR (
            scope = 'shared'
            AND team_id IN (
                SELECT team_id FROM public.profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "saved_views_insert" ON public.saved_views
    FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "saved_views_update" ON public.saved_views
    FOR UPDATE TO authenticated USING (created_by = auth.uid());

CREATE POLICY "saved_views_delete" ON public.saved_views
    FOR DELETE TO authenticated USING (created_by = auth.uid());

-- Sprint 7: Full-Text Search Index
-- Adds tsvector column + GIN index to tasks for fast full-text search
-- Also indexes profiles.name and projects.name for global search

-- 1. Add tsvector column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Populate search_vector from existing data
UPDATE tasks SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(completion_report_text, '')), 'C');

-- 3. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_tasks_search_vector ON tasks USING GIN (search_vector);

-- 4. Auto-update search_vector on INSERT or UPDATE
CREATE OR REPLACE FUNCTION tasks_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.completion_report_text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tasks_search_vector ON tasks;
CREATE TRIGGER trg_tasks_search_vector
  BEFORE INSERT OR UPDATE OF title, description, completion_report_text
  ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION tasks_search_vector_update();

-- 5. Index on profiles.name for people search (trigram for partial matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON profiles USING GIN (name gin_trgm_ops);

-- 6. Index on projects.name for project search
CREATE INDEX IF NOT EXISTS idx_projects_name_trgm ON projects USING GIN (name gin_trgm_ops);

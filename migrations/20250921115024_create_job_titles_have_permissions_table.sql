CREATE TABLE job_titles_have_permissions (
	job_title_id INTEGER NOT NULL REFERENCES job_titles (id),
	permission_id INTEGER NOT NULL REFERENCES permissions (id),

	PRIMARY KEY (job_title_id, permission_id)
);

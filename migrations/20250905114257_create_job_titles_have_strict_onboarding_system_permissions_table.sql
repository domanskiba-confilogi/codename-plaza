CREATE TABLE job_titles_have_strict_onboarding_system_permissions_table (
	job_title_id INTEGER NOT NULL REFERENCES job_titles (id),
	system_permission_id INTEGER NOT NULL REFERENCES system_permissions (id),

	PRIMARY KEY (job_title_id, system_permission_id),
);

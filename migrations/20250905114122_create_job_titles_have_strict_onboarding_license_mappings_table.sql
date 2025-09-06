CREATE TABLE job_titles_have_strict_onboarding_license_mappings (
	job_title_id INTEGER NOT NULL REFERENCES job_titles (id),
	license_id   INTEGER NOT NULL REFERENCES licenses (id),

	PRIMARY KEY (job_title_id, licenses_id)
);

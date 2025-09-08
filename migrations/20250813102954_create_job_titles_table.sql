CREATE TABLE job_titles (
	id SERIAL PRIMARY KEY,
	name VARCHAR(64) NOT NULL,
	company_department_id INTEGER DEFAULT NULL REFERENCES company_departments (id),
	parent_job_title_id INTEGER DEFAULT NULL REFERENCES job_titles (id)
);

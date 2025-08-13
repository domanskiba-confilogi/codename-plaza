CREATE TABLE job_titles (
	id SERIAL NOT NULL,
	name VARCHAR(64) NOT NULL,
	company_department_id INTEGER NOT NULL REFERENCES company_departments (id)
);

CREATE TABLE external_permissions (
	id SERIAL PRIMARY KEY,

	name VARCHAR(64) NOT NULL UNIQUE
);

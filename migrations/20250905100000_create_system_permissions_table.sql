CREATE TABLE system_permissions (
	id			SERIAL PRIMARY KEY,
	name			VARCHAR(64) NOT NULL,
	subpermission_of_id	INTEGER REFERENCES system_permissions (id)
);

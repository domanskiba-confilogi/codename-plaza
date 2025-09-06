CREATE TABLE license_incompatibility_map (
	first_license_id INTEGER REFERENCES licenses (id),
	second_license_id INTEGER REFERENCES licenses (id),

	PRIMARY KEY (first_license_id, second_license_id)
);

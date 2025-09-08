INSERT INTO job_titles (id, name, company_department_id) VALUES 
	-- call center
	(2, 'Agent - Team PL', 1), -- PLP1, PLP2, PLP3, PLBF, RETURN PL
	(3, 'Agent - Team CZ', 1), -- CZP1, CZP2, CZP3, Return CZ
	(4, 'Agent - Team SK', 1), -- SKP1, SKP2, SKP3, Return SK
	(5, 'Agent - Team HR', 1), -- HRP1
	(6, 'Agent - Team SI', 1), -- SIP1
	(7, 'Agent - Team BG', 1), -- BGP1
	(8, 'Team Manager', 1),
	(10, 'Sales Director', 1),

	-- IT
	(11, 'IT Support Specialist', 2),
	(12, 'Back-End Developer', 2),
	(13, 'Front-End Developer', 2),
	(14, 'Team Leader of Web Developers', 2),
	(15, 'Team Leader of IT Support', 2),
	(16, 'IT Project Manager', 2),

	-- Logistics
	(17, 'Logistics Specialist', 3),
	(18, 'Dispatch Specialist', 3),
	(19, 'Logistics Director', 3),
	(20, 'Logistics Purchasing Specialist', 3), -- Specjalista ds. zakupów
	(21, 'Returns and Logistics Specialist', 3), -- Specjalista ds. Reklamacji i Logistyki
	(22, 'Team Leader of Logistics', 3),

	-- Warehouse
	(23, 'Warehouse Worker - Warsaw', 4),
	(24, 'Warehouse Specialist', 4),
	(25, 'Warehouse Supervisor', 4),

	-- Kadry
	(26, 'Personnel Administration Assistant', 5),
	(27, 'Personnel Administration & Payroll Specialist', 5),
	(28, 'Personnel Administration Specialist', 5),
	(29, 'Personnel Administration Supervisor', 5),

	-- HR
	(30, 'HR Junior Specialist', 6),
	(31, 'HR Specialist', 6),
	(32, 'HR Manager', 6),

	-- Księgowość
	(33, 'Senior Accountant', 7),
	(34, 'Accountant', 7),

	-- Legal
	(35, 'Legal Assistant', 8),
	(36, 'Senior Legal Assistant', 8),

	-- Marketing
	(37, 'Affiliate Marketer', 9),
	(38, 'Copywriter', 9),
	(39, 'Creative Marketing Manager', 9),
	(40, 'Creative Project Manager & Senior Copywriter', 9),
	(41, 'Digital Project Manager', 9),
	(42, 'Director of Creative Projects', 9),
	(43, 'Support AI Specialist', 9),
	(44, 'Google Ads Manager', 9),
	(45, 'Creative Graphic Designer', 9),
	(46, 'Graphic Designer', 9),
	(47, 'Head of Ad Operations', 9),
	(48, 'Head of Graphics Department', 9),
	(49, 'Head of Creative Department • Graphic Designers', 9),
	(50, 'Marketing', 9),
	(51, 'Marketing • Copywriter', 9),
	(52, 'Media Buyer Manager', 9),
	(53, 'Media Planner', 9),
	(54, 'Senior Copywriter', 9),
	(55, 'Senior Copywriter & Editor', 9),
	(56, 'Social Media Manager', 9),
	(57, 'Campaign Planning Specialist', 9),
	(58, 'Online Marketing Specialist', 9),
	(59, 'Media Acquisition Specialist (Croatian)', 9),
	(60, 'Translator', 9),
	(61, 'Translator (Bulgarian)', 9),
	(62, 'Translator (Czech)', 9),
	(63, 'Translator (Slovak)', 9),
	(64, 'Web Designer', 9),
	(65, 'Marketing • Analytics Department', 9),
	(66, 'Director of Monetization', 9),
	(67, 'Product Manager', 9),
	(68, 'Project Manager', 9),
	(69, 'Junior Project Manager', 9),

	-- Analitycs
	(70, 'Analyst', 10),
	(71, 'Power BI Developer', 10),
	(72, 'Analitycs Specialist', 10),

	-- Core management
	(73, 'CEO', 11),
	(74, 'Director of Operations', 11),
	(75, 'Head of Operations', 11),

	-- Sales
	(76, 'Salesman - Team PLAK', 12),
	(77, 'Agent - Team PLAK', 12),

	-- Call Review
	(78, 'Backoffice Specialist', 13),
	(79, 'Trainer', 13),

	-- Controlling
	(80, 'Shipping Management Specialist', 14),
	(81, 'Manager, Logistics Billing & Analysis', 14);

INSERT INTO job_titles (id, name, parent_job_title_id) VALUES
	(82, 'PLP1', 2),
	(83, 'PLP2', 2),
	(84, 'PLP3', 2),
	(85, 'PLBF', 2),
	(86, 'Return PL', 2),

	(87, 'CZP1', 3),
	(88, 'CZP2', 3),
	(89, 'CZP3', 3),
	(90, 'Return CZ', 3),

	(91, 'SKP1', 4),
	(92, 'SKP2', 4),
	(93, 'SKP3', 4),
	(94, 'Return SK', 4),

	(95, 'HRP1', 5),

	(96, 'SIP1', 6),

	(97, 'BGP1', 7);

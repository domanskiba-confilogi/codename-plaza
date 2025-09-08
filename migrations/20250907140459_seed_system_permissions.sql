INSERT INTO system_permissions
	(id, name, subpermission_of_id)
VALUES
	(1, 'Vici PL', NULL),
	(2, 'Vici CZ', NULL),
	(3, 'Vici SK', NULL),
	(4, 'Vici SI', NULL),
	(5, 'Vici BG', NULL),
	(6, 'Vici HR', NULL),
	(7, 'Vici IT', NULL),

	(8, 'CRM PL', NULL),
	(9, 'CRM CZ', NULL),
	(10, 'CRM SK', NULL),
	(11, 'CRM SI', NULL),
	(12, 'CRM BG', NULL),
	(13, 'CRM HR', NULL),
	(14, 'CRM IT', NULL),

	(15, 'Optima', NULL),

	(16, 'Manager wallboard PL', 1),
	(17, 'Manager wallboard CZ', 2),
	(18, 'Manager wallboard SK', 3),
	(19, 'Manager wallboard BG', 4),
	(20, 'Manager wallboard SI', 5),

	(21, '(CRM PL) Access to new panel for Logistics', 8),
	(22, '(CRM PL) Access to reports tab inside new panel for Logistics', 8),
	(23, '(CRM PL) Access to complaints tab inside new panel for Logistics', 8),
	(24, '(CRM PL) Access to shipments tab inside new panel for Logistics', 8),
	(25, '(CRM PL) Access to imports tab inside new panel for Logistics', 8),

	(26, '(CRM CZ) Access to new panel for Logistics', 9),
	(27, '(CRM CZ) Access to reports tab inside new panel for Logistics', 9),
	(28, '(CRM CZ) Access to complaints tab inside new panel for Logistics', 9),
	(29, '(CRM CZ) Access to shipments tab inside new panel for Logistics', 9),
	(30, '(CRM CZ) Access to imports tab inside new panel for Logistics', 9),

	(31, '(CRM SK) Access to new panel for Logistics', 10),
	(32, '(CRM SK) Access to reports tab inside new panel for Logistics', 10),
	(33, '(CRM SK) Access to complaints tab inside new panel for Logistics', 10),
	(34, '(CRM SK) Access to shipments tab inside new panel for Logistics', 10),
	(35, '(CRM SK) Access to imports tab inside new panel for Logistics', 10),

	(36, '(CRM SI) Access to new panel for Logistics', 11),
	(37, '(CRM SI) Access to reports tab inside new panel for Logistics', 11),
	(38, '(CRM SI) Access to complaints tab inside new panel for Logistics', 11),
	(39, '(CRM SI) Access to shipments tab inside new panel for Logistics', 11),
	(40, '(CRM SI) Access to imports tab inside new panel for Logistics', 11),

	(41, '(CRM BG) Access to new panel for Logistics', 12),
	(42, '(CRM BG) Access to reports tab inside new panel for Logistics', 12),
	(43, '(CRM BG) Access to complaints tab inside new panel for Logistics', 12),
	(44, '(CRM BG) Access to shipments tab inside new panel for Logistics', 12),
	(45, '(CRM BG) Access to imports tab inside new panel for Logistics', 12),

	(46, '(CRM PL) Access to sales tab', 8),
	(47, '(CRM PL) Access to marketing tab', 8),

	(48, '(CRM CZ) Access to sales tab', 9),
	(49, '(CRM CZ) Access to marketing tab', 9),

	(50, '(CRM SK) Access to sales tab', 10),
	(51, '(CRM SK) Access to marketing tab', 10),

	(52, '(CRM SI) Access to sales tab', 11),
	(53, '(CRM SI) Access to marketing tab', 11),

	(54, '(CRM BG) Access to sales tab', 12),
	(55, '(CRM BG) Access to marketing tab', 12),

	(56, 'Database replica of Vici PL', NULL),
	(57, 'Database replica of Vici CZ/SK/SI/BG', NULL),
	(58, 'Database replica of Vici HR', NULL);

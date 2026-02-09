ALTER TABLE `tasks` MODIFY COLUMN `frente` enum('trabalho','pessoal','saude','estudo') NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `tipo` enum('foco_profundo','manutencao_vital','rotina','urgente') NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `local` varchar(64);--> statement-breakpoint
ALTER TABLE `tasks` DROP COLUMN `canal`;
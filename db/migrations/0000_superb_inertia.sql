CREATE TABLE `ai_readings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned,
	`chartId` bigint unsigned,
	`chartType` varchar(32) NOT NULL,
	`rulesetVersion` varchar(32),
	`persona` varchar(16) NOT NULL,
	`depth` varchar(16) NOT NULL,
	`source` enum('live','fallback') NOT NULL,
	`model` varchar(64),
	`promptTokens` int,
	`completionTokens` int,
	`latencyMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned,
	`action` varchar(64) NOT NULL,
	`targetType` varchar(32),
	`targetId` varchar(64),
	`meta` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chart_versions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`chartId` bigint unsigned NOT NULL,
	`rulesetVersion` varchar(32),
	`algorithmVersion` varchar(32),
	`inputSnapshot` text NOT NULL,
	`resultSnapshot` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chart_versions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `charts` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`chartType` enum('bazi','hepan','liuyao','ziwei','qizheng','qimen','daliuren','hecan','draw') NOT NULL,
	`title` varchar(255),
	`input` text NOT NULL,
	`result` text NOT NULL,
	`rulesetVersion` varchar(32),
	`algorithmVersion` varchar(32),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `charts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned,
	`route` varchar(128) NOT NULL,
	`feature` enum('bug','suggestion','algorithm','visual','mobile','data','interaction') NOT NULL,
	`severity` enum('P0','P1','P2','P3') NOT NULL,
	`title` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`stepsToReproduce` text,
	`expectedResult` text,
	`actualResult` text,
	`browser` varchar(255),
	`device` varchar(64),
	`commitSha` varchar(64),
	`algorithmVersion` varchar(64),
	`screenshotUrl` varchar(512),
	`status` enum('open','triaged','fixed','wontfix') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `oauth_states` (
	`state` varchar(64) NOT NULL,
	`redirectUri` varchar(512) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `oauth_states_state` PRIMARY KEY(`state`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`orderNo` varchar(32) NOT NULL,
	`amountFen` int NOT NULL,
	`lingqianAmount` int NOT NULL,
	`status` enum('created','paid','failed','refunded','cancelled') NOT NULL DEFAULT 'created',
	`channel` varchar(32),
	`idempotencyKey` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNo_unique` UNIQUE(`orderNo`),
	CONSTRAINT `orders_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`orderId` bigint unsigned NOT NULL,
	`eventId` varchar(64) NOT NULL,
	`payload` text,
	`verified` boolean NOT NULL DEFAULT false,
	`status` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_events_eventId_unique` UNIQUE(`eventId`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(64) NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	`revokedAt` timestamp,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`unionId` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`avatar` text,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignInAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_unionId_unique` UNIQUE(`unionId`)
);
--> statement-breakpoint
CREATE TABLE `wallet_transactions` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`walletId` bigint unsigned NOT NULL,
	`changeAmount` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`reason` enum('recharge','consume','refund','adjust','grant') NOT NULL,
	`refType` varchar(32),
	`refId` varchar(64),
	`idempotencyKey` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallet_transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallet_transactions_idempotencyKey_unique` UNIQUE(`idempotencyKey`)
);
--> statement-breakpoint
CREATE TABLE `wallets` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`balanceLingqian` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `wallets_id` PRIMARY KEY(`id`),
	CONSTRAINT `wallets_userId_unique` UNIQUE(`userId`)
);

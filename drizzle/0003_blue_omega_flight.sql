CREATE TABLE "credential" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"label" text NOT NULL,
	"username" text DEFAULT '' NOT NULL,
	"secret" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text,
	CONSTRAINT "credential_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
ALTER TABLE "document" ALTER COLUMN "file_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "kind" text DEFAULT 'file' NOT NULL;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "body" text;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "updated_at" text;--> statement-breakpoint
ALTER TABLE "credential" ADD CONSTRAINT "credential_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
CREATE TABLE "access_grant" (
	"token" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"beneficiary_id" text NOT NULL,
	"created_at" text NOT NULL,
	"expires_at" text,
	"revoked_at" text
);
--> statement-breakpoint
ALTER TABLE "access_grant" ADD CONSTRAINT "access_grant_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_grant_owner_idx" ON "access_grant" USING btree ("owner_id");
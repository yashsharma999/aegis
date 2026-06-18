CREATE TABLE "beneficiary" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"whatsapp" text NOT NULL,
	"verification_secret" text DEFAULT '' NOT NULL,
	"access_scope" text[] DEFAULT '{}' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "beneficiary_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "contact" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"phone" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	CONSTRAINT "contact_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "document" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"category" text NOT NULL,
	"title" text NOT NULL,
	"file_name" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"sensitive" boolean DEFAULT false NOT NULL,
	"uploaded_at" text NOT NULL,
	CONSTRAINT "document_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "guardian" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"relationship" text NOT NULL,
	"whatsapp" text NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "guardian_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "instruction" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	CONSTRAINT "instruction_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "medical_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"blood_group" text DEFAULT '' NOT NULL,
	"allergies" text[] DEFAULT '{}' NOT NULL,
	"medications" text[] DEFAULT '{}' NOT NULL,
	"conditions" text[] DEFAULT '{}' NOT NULL,
	"active_health_policy_id" text DEFAULT '' NOT NULL,
	"preferred_hospital" text DEFAULT '' NOT NULL,
	"emergency_note" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"policy_number" text NOT NULL,
	"coverage_amount" text NOT NULL,
	"premium" text NOT NULL,
	"renewal_date" text NOT NULL,
	"network_hospitals" text[],
	"claim_contact" text NOT NULL,
	"claim_steps" text[],
	"notes" text DEFAULT '' NOT NULL,
	CONSTRAINT "policy_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
CREATE TABLE "vault_profile" (
	"user_id" text PRIMARY KEY NOT NULL,
	"protecting" text DEFAULT '' NOT NULL,
	"mode" text DEFAULT 'everyday' NOT NULL,
	"timeline" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"cadence_days" integer DEFAULT 14 NOT NULL,
	"last_checkin_at" text,
	"missed_count" integer DEFAULT 0 NOT NULL,
	"threshold" integer DEFAULT 3 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "beneficiary" ADD CONSTRAINT "beneficiary_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact" ADD CONSTRAINT "contact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document" ADD CONSTRAINT "document_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guardian" ADD CONSTRAINT "guardian_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instruction" ADD CONSTRAINT "instruction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_profile" ADD CONSTRAINT "medical_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy" ADD CONSTRAINT "policy_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vault_profile" ADD CONSTRAINT "vault_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
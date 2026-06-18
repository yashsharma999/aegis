CREATE TABLE "document_chunk" (
	"user_id" text NOT NULL,
	"id" text NOT NULL,
	"document_id" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"token_count" integer,
	CONSTRAINT "document_chunk_user_id_id_pk" PRIMARY KEY("user_id","id")
);
--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "storage_key" text;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "mime_type" text;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "size_bytes" integer;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "page_count" integer;--> statement-breakpoint
ALTER TABLE "document" ADD COLUMN "status" text DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE "document_chunk" ADD CONSTRAINT "document_chunk_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_chunk_user_doc_idx" ON "document_chunk" USING btree ("user_id","document_id");
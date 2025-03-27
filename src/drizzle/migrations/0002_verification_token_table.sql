CREATE TABLE "verification_token" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_token_id_unique" UNIQUE("id"),
	CONSTRAINT "verification_token_email_unique" UNIQUE("email"),
	CONSTRAINT "verification_token_token_unique" UNIQUE("token")
);

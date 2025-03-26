CREATE TABLE "password_reset_token" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "password_reset_token_id_unique" UNIQUE("id"),
	CONSTRAINT "password_reset_token_email_unique" UNIQUE("email"),
	CONSTRAINT "password_reset_token_token_unique" UNIQUE("token")
);
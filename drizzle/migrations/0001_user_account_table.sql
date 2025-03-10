CREATE TYPE "public"."user_roles" AS ENUM('SUPER_ADMIN', 'COACH', 'PLAYER', 'CAPTAIN');--> statement-breakpoint
CREATE TYPE "public"."user_state" AS ENUM('UNKNOWN', 'ACTIVE', 'INACTIVE', 'TEMPORARILY_ABSENT');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(128) NOT NULL,
	"dob" date,
	"password" varchar(128),
	"email" text,
	"emailVerified" timestamp,
	"phone_number" varchar(15),
	"citizen_identification" varchar(12),
	"image" text,
	"state" "user_state" DEFAULT 'ACTIVE' NOT NULL,
	"roles" "user_roles"[] DEFAULT '{"PLAYER"}',
	"join_date" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
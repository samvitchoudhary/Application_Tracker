CREATE TYPE "public"."stage" AS ENUM('Applied', 'Recruiter Screen', 'First Interview', 'Second Interview', 'Third Interview', 'Offer');--> statement-breakpoint
CREATE TYPE "public"."outcome" AS ENUM('No Reply', 'Rejected', 'Withdrew', 'Accepted', 'Declined');--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "current_stage" "stage" DEFAULT 'Applied' NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "outcome" "outcome";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "stage_events" jsonb DEFAULT '[]'::jsonb NOT NULL;

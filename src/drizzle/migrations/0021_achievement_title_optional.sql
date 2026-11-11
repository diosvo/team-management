-- `title` used to be required, so the form copied the type's label into it in
-- whatever locale the editor was using. Null now means "show the type's label",
-- translated at read time. Titles that only repeat a label (in either locale)
-- are cleared so they follow the language toggle; real custom titles stay.

ALTER TABLE "achievement" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
UPDATE "achievement"
SET "title" = NULL
WHERE "type" != 'custom'
  AND lower(trim("title")) IN (
    SELECT lower(label)
    FROM (
      VALUES
        ('champion', 'Champion'),
        ('champion', 'Vô địch'),
        ('runner_up', 'Runner-up'),
        ('runner_up', 'Á quân'),
        ('third_place', '3rd Place'),
        ('third_place', 'Hạng 3'),
        ('mvp', 'MVP'),
        ('top_scorer', 'Top Scorer'),
        ('top_scorer', 'Vua ghi điểm')
    ) AS labels(type, label)
    WHERE labels.type = "achievement"."type"::text
  );--> statement-breakpoint
ALTER TABLE "achievement" ADD CONSTRAINT "custom_achievement_has_title" CHECK ("achievement"."type" != 'custom' OR "achievement"."title" IS NOT NULL);

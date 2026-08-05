-- Rename TestTypeUnit pgEnum values from lowercase to UPPERCASE to match the TypeScript enum convention.
ALTER TYPE "test_type_unit" RENAME VALUE 'meters' TO 'METERS';
ALTER TYPE "test_type_unit" RENAME VALUE 'percent' TO 'PERCENT';
ALTER TYPE "test_type_unit" RENAME VALUE 'points' TO 'POINTS';
ALTER TYPE "test_type_unit" RENAME VALUE 'reps' TO 'REPS';
ALTER TYPE "test_type_unit" RENAME VALUE 'seconds' TO 'SECONDS';
ALTER TYPE "test_type_unit" RENAME VALUE 'times' TO 'TIMES';

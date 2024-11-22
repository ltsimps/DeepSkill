-- Reset Kody's practice sessions
UPDATE "practice_session" SET status = 'COMPLETED' WHERE user_id IN (SELECT id FROM "user" WHERE username = 'kody');

-- Reset session problems
UPDATE "session_problem" SET status = 'SKIPPED' 
WHERE user_id IN (SELECT id FROM "user" WHERE username = 'kody')
AND created_at >= CURRENT_DATE;

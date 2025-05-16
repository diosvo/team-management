INSERT INTO
  "user" (team_id, dob, email, name, password, roles, state)
VALUES
  (
    '8c35a39c-0145-4b44-81ff-4e8832e61dd3',
    '1999-12-12',
    'vtmn1212@gmail.com',
    'Dios Vo',
    '$2b$10$nA5l3ktusgnsNuyKavObiewv3787mtatMHmKP/s3c.c6Z6JTfWqW2',
    '{"SUPER_ADMIN"}',
    'ACTIVE'
  );

INSERT INTO
  "player" (user_id)
VALUES
  ('e08c520f-64f3-4612-a1d4-028a847c203e')
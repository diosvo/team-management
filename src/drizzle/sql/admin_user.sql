INSERT INTO
  "user" (
    team_id,
    dob,
    email,
    name,
    password,
    role,
    state,
    join_date
  )
VALUES
  (
    '06117045-05f5-49d9-8411-0e1ef8bfe4bf',
    '1999-12-12',
    'vtmn1212@gmail.com',
    'Dios Vo',
    '$2b$10$nA5l3ktusgnsNuyKavObiewv3787mtatMHmKP/s3c.c6Z6JTfWqW2',
    'SUPER_ADMIN',
    'ACTIVE',
    '2024-02-20'
  );

INSERT INTO
  "player" (user_id)
VALUES
  ('e08c520f-64f3-4612-a1d4-028a847c203e')
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

INSERT INTO users (username, password_hash)
VALUES
  ('bob', 'password'),
  ('alice', 'password'),
  ('chuck', 'password');
ON CONFLICT (username) DO NOTHING;

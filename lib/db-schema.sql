-- Execute este script no MySQL do Hostinger (hPanel > Databases > phpMyAdmin)

CREATE TABLE IF NOT EXISTS days (
  id          VARCHAR(30)  PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  short_name  VARCHAR(10)  NOT NULL,
  emoji       VARCHAR(20)  NOT NULL,
  subtitle    VARCHAR(255),
  color       VARCHAR(20),
  light_color VARCHAR(20),
  dark_color  VARCHAR(20),
  mission_icon VARCHAR(20),
  mission_text VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS tasks (
  id          VARCHAR(100) PRIMARY KEY,
  day_id      VARCHAR(30)  NOT NULL,
  name        VARCHAR(255) NOT NULL,
  emoji       VARCHAR(20)  NOT NULL,
  task_time   VARCHAR(10),
  note        VARCHAR(500),
  is_mission  TINYINT(1)   DEFAULT 0,
  order_index INT          DEFAULT 0,
  FOREIGN KEY (day_id) REFERENCES days(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sub_tasks (
  id          VARCHAR(100) PRIMARY KEY,
  task_id     VARCHAR(100) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  emoji       VARCHAR(20)  NOT NULL,
  order_index INT          DEFAULT 0,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS completions (
  date      DATE         NOT NULL,
  day_id    VARCHAR(30)  NOT NULL,
  task_id   VARCHAR(100) NOT NULL,
  completed TINYINT(1)   DEFAULT 0,
  PRIMARY KEY (date, day_id, task_id)
);

CREATE TABLE IF NOT EXISTS mission_completions (
  week_key  VARCHAR(15) NOT NULL,
  day_id    VARCHAR(30) NOT NULL,
  completed TINYINT(1)  DEFAULT 0,
  PRIMARY KEY (week_key, day_id)
);

CREATE TABLE IF NOT EXISTS settings (
  key_name VARCHAR(50)  PRIMARY KEY,
  value    VARCHAR(255) NOT NULL
);

INSERT IGNORE INTO settings (key_name, value) VALUES ('pin', '1234');

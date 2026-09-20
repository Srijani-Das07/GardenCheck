CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

CREATE TABLE species (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    watering_interval_days INTEGER NOT NULL,
    sunlight_needs TEXT,
    fertilizing_interval_days INTEGER,
    ideal_temp_min INTEGER,
    ideal_temp_max INTEGER,
    difficulty_level TEXT
);

CREATE TABLE plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    species_id INTEGER NOT NULL REFERENCES species(id),
    nickname TEXT,
    date_acquired DATE,
    location TEXT
);

CREATE TABLE care_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id INTEGER NOT NULL REFERENCES plants(id),
    action_type TEXT NOT NULL,
    date_performed DATE NOT NULL,
    notes TEXT
);

CREATE TABLE health_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id INTEGER NOT NULL REFERENCES plants(id),
    status TEXT NOT NULL,
    date_logged DATE NOT NULL
);

PRAGMA foreign_keys = ON;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE species (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    watering_interval_days INTEGER NOT NULL CHECK (watering_interval_days > 0),
    sunlight_needs TEXT,
    fertilizing_interval_days INTEGER CHECK (fertilizing_interval_days IS NULL OR fertilizing_interval_days > 0),
    ideal_temp_min INTEGER,
    ideal_temp_max INTEGER,
    difficulty_level TEXT CHECK (difficulty_level IN ('Easy', 'Medium', 'Hard'))
);

CREATE TABLE plants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    species_id INTEGER NOT NULL REFERENCES species(id),
    nickname TEXT,
    date_acquired DATE NOT NULL,
    location TEXT
);

CREATE INDEX idx_plants_user ON plants(user_id);
CREATE INDEX idx_plants_species ON plants(species_id);

CREATE TABLE care_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL CHECK (action_type IN ('watered', 'fertilized', 'repotted', 'pruned')),
    date_performed DATE NOT NULL,
    notes TEXT
);

CREATE INDEX idx_care_logs_plant ON care_logs(plant_id);

CREATE TABLE health_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('thriving', 'struggling', 'dead')),
    date_logged DATE NOT NULL
);

CREATE INDEX idx_health_logs_plant ON health_logs(plant_id);
-- 1. Items Table
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,          -- e.g., "T4_BAG"
    unique_name TEXT NOT NULL,
    localized_name_en TEXT,
    tier INTEGER,
    enchantment INTEGER DEFAULT 0,
    quality INTEGER DEFAULT 1,
    category TEXT,                -- e.g., "armor", "weapon"
    subcategory TEXT,             -- e.g., "plate_helmet"
    weight REAL,
    item_value INTEGER            -- Used for reroll costs / nutrition
);

-- 2. Recipes Table
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT NOT NULL,
    amount_crafted INTEGER DEFAULT 1,
    crafting_station TEXT,
    base_focus_cost INTEGER,
    FOREIGN KEY(item_id) REFERENCES items(id)
);

-- 3. Recipe Materials
CREATE TABLE IF NOT EXISTS recipe_materials (
    recipe_id INTEGER,
    material_id TEXT,
    amount INTEGER,
    FOREIGN KEY(recipe_id) REFERENCES recipes(id),
    FOREIGN KEY(material_id) REFERENCES items(id)
);

-- 4. Market Data (Current Snapshot)
CREATE TABLE IF NOT EXISTS market_snapshots (
    item_id TEXT,
    location_id TEXT,             -- e.g., "3005" (Caerleon), "0001" (Black Market)
    quality INTEGER,
    sell_price_min INTEGER,
    sell_price_min_date DATETIME,
    buy_price_max INTEGER,
    buy_price_max_date DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, location_id, quality)
);

-- 5. Market History (Trends)
CREATE TABLE IF NOT EXISTS market_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT,
    location_id TEXT,
    quality INTEGER,
    data_date DATE,
    avg_price INTEGER,
    item_count INTEGER,           -- Volume
    FOREIGN KEY(item_id) REFERENCES items(id)
);

-- 6. ADC Configuration & Logs
CREATE TABLE IF NOT EXISTS adc_config (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT,              -- "UPDATE", "ERROR", "INFO"
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

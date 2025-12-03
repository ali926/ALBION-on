-- Items table: All craftable and material items
CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tier INTEGER NOT NULL,
    enchantment INTEGER DEFAULT 0,
    category TEXT NOT NULL,
    subcategory TEXT,
    crafting_station TEXT,
    base_value INTEGER,
    item_power INTEGER,
    weight REAL,
    stack_size INTEGER DEFAULT 1,
    is_artifact BOOLEAN DEFAULT FALSE,
    is_tradeable BOOLEAN DEFAULT TRUE,
    description TEXT,
    icon_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipes table: Crafting recipes
CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    result_item_id TEXT NOT NULL,
    crafting_station TEXT NOT NULL,
    batch_size INTEGER DEFAULT 1,
    base_focus_cost INTEGER DEFAULT 0,
    crafting_time REAL,
    required_fame INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (result_item_id) REFERENCES items(id)
);

-- Recipe materials: Many-to-many relationship
CREATE TABLE IF NOT EXISTS recipe_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id TEXT NOT NULL,
    material_item_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    is_artifact_material BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
    FOREIGN KEY (material_item_id) REFERENCES items(id)
);

-- Crafting bonuses by city
CREATE TABLE IF NOT EXISTS city_bonuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT NOT NULL,
    item_category TEXT NOT NULL,
    bonus_percentage INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(city, item_category)
);

-- Focus costs lookup
CREATE TABLE IF NOT EXISTS focus_costs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT NOT NULL,
    tier INTEGER NOT NULL,
    enchantment INTEGER DEFAULT 0,
    base_focus_cost INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id),
    UNIQUE(item_id, tier, enchantment)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_tier ON items(tier);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_recipes_result ON recipes(result_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_station ON recipes(crafting_station);
CREATE INDEX IF NOT EXISTS idx_recipe_materials_recipe ON recipe_materials(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_materials_material ON recipe_materials(material_item_id);
CREATE INDEX IF NOT EXISTS idx_city_bonuses_lookup ON city_bonuses(city, item_category);
CREATE INDEX IF NOT EXISTS idx_focus_costs_lookup ON focus_costs(item_id, tier, enchantment);

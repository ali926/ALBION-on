import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'albion.db');

let db: Database.Database | null = null;

/**
 * Get or create database connection
 * Safe for Next.js API routes
 */
export function getDatabase(): Database.Database {
    if (!db) {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(DB_PATH);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Check if database file exists
            if (!fs.existsSync(DB_PATH)) {
                throw new Error(`Database file not found at ${DB_PATH}. Please run the import script first.`);
            }

            db = new Database(DB_PATH);

            // Basic pragmas only
            db.pragma('foreign_keys = ON');

        } catch (error) {
            console.error('Failed to open database:', error);
            throw error;
        }
    }
    return db;
}

/**
 * Initialize database schema
 */
export function initializeDatabase(): void {
    try {
        const db = getDatabase();
        const schemaPath = path.join(process.cwd(), 'lib', 'db', 'schema.sql');

        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at ${schemaPath}`);
        }

        const schema = fs.readFileSync(schemaPath, 'utf-8');
        db.exec(schema);

        console.log('✅ Database schema initialized');
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
    }
}

/**
 * Check if database is initialized and has data
 */
export function isDatabaseReady(): boolean {
    try {
        if (!fs.existsSync(DB_PATH)) {
            return false;
        }
        const db = getDatabase();
        const result = db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number };
        return result.count > 0;
    } catch (error) {
        console.error('Database ready check failed:', error);
        return false;
    }
}

/**
 * Get database statistics
 */
export function getDatabaseStats(): {
    itemCount: number;
    recipeCount: number;
    materialCount: number;
    cityBonusCount: number;
    focusCostCount: number;
} {
    const db = getDatabase();

    return {
        itemCount: (db.prepare('SELECT COUNT(*) as count FROM items').get() as { count: number }).count,
        recipeCount: (db.prepare('SELECT COUNT(*) as count FROM recipes').get() as { count: number }).count,
        materialCount: (db.prepare('SELECT COUNT(*) as count FROM recipe_materials').get() as { count: number }).count,
        cityBonusCount: (db.prepare('SELECT COUNT(*) as count FROM city_bonuses').get() as { count: number }).count,
        focusCostCount: (db.prepare('SELECT COUNT(*) as count FROM focus_costs').get() as { count: number }).count,
    };
}

// Only set up graceful shutdown in Node.js environment (not in browser/edge runtime)
if (typeof process !== 'undefined' && process.on) {
    process.on('exit', closeDatabase);
    process.on('SIGINT', () => {
        closeDatabase();
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        closeDatabase();
        process.exit(0);
    });
}

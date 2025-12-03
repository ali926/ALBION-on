import Database from 'better-sqlite3';

try {
    console.log('Testing better-sqlite3...');
    const db = new Database(':memory:');
    console.log('✅ Database created successfully');

    db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    console.log('✅ Table created successfully');

    const insert = db.prepare('INSERT INTO test (name) VALUES (?)');
    insert.run('test');
    console.log('✅ Insert successful');

    const row = db.prepare('SELECT * FROM test').get();
    console.log('✅ Select successful:', row);

    db.close();
    console.log('✅ All tests passed!');
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}

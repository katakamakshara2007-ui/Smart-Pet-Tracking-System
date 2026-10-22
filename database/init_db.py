import pymysql

try:
    conn = pymysql.connect(host='localhost', user='root', password='root', port=3306)
    cursor = conn.cursor()
    cursor.execute('CREATE DATABASE IF NOT EXISTS smart_pet_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;')
    conn.commit()
    cursor.execute("SHOW DATABASES LIKE 'smart_pet_tracking';")
    result = cursor.fetchall()
    print("Database created/verified:", result)
    
    # Run schema.sql
    with open('database/schema.sql', 'r', encoding='utf-8') as f:
        sql_commands = f.read()

    # Split commands by semicolon
    commands = [c.strip() for c in sql_commands.split(';') if c.strip()]
    cursor.execute('USE smart_pet_tracking;')
    for cmd in commands:
        if cmd.startswith('--') or cmd.startswith('/*'):
            # Filter comments
            lines = [l for l in cmd.split('\n') if not l.strip().startswith('--')]
            cmd = '\n'.join(lines).strip()
        if cmd:
            cursor.execute(cmd)
    conn.commit()
    
    cursor.execute("SHOW TABLES;")
    tables = cursor.fetchall()
    print("Tables in smart_pet_tracking:", tables)
    conn.close()
    print("MySQL 8 initialization finished successfully!")
except Exception as e:
    print("MySQL init error:", e)

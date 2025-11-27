const mongoose = require('mongoose');

(async () => {
  try {
    const uri = 'mongodb://localhost:27017/cpp_project_db';
    await mongoose.connect(uri);
    console.log('✅ Подключено к MongoDB');
    const dbs = await mongoose.connection.db.admin().listDatabases();
    console.log('📂 Существующие базы:', dbs.databases.map(d => d.name));
  } catch (err) {
    console.error('❌ Ошибка подключения:', err.message);
  } finally {
    await mongoose.disconnect();
  }
})();

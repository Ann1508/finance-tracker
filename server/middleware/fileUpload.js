// middleware/fileUpload.js
const multer = require('multer');
const path = require('path');

// Убедитесь, что папка существует или создайте её при запуске приложения
const uploadDir = 'uploads/files';
const fs = require('fs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created directory: ${uploadDir}`);
}

function transliterate(str) {
  const map = {
    А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'Yo', Ж: 'Zh',
    З: 'Z', И: 'I', Й: 'Y', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O',
    П: 'P', Р: 'R', С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'Kh', Ц: 'Ts',
    Ч: 'Ch', Ш: 'Sh', Щ: 'Shch', Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu',
    Я: 'Ya',
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
    з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
    п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
    ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
    я: 'ya',
  };
  return str.split('').map(c => map[c] || c).join('');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Убедитесь, что путь указан правильно и папка существует
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Принудительно декодируем имя в UTF-8
    console.log("имя файла", file.originalname)
    let originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    console.log("____________________________________________________", originalName);
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext);
    const safeName = transliterate(base).replace(/[^a-zA-Z0-9_-]/g, '_');

    cb(null, Date.now() + '-' + originalName);
  }
});

// Фильтрация файлов (опционально)
const fileFilter = (req, file, cb) => {
  // Пример: разрешить только определенные типы файлов
  // if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
  //   cb(null, true);
  // } else {
  //   cb(new Error('Недопустимый тип файла'), false);
  // }
  // Пока разрешим все типы для тестирования
  cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

module.exports = upload;
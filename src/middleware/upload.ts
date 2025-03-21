import multer from "multer";
import path from "path";

// הגדרת אחסון מקומי עבור `multer`
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // התמונות ישמרו בתיקייה `uploads`
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // שמירת הקובץ עם שם ייחודי
  },
});

// הגדרת סינון קבצים - קבלת תמונות בלבד
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only images (jpeg, jpg, png) are allowed"));
  }
};

// הגבלת גודל קובץ ל-5MB
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter,
});

export default upload;

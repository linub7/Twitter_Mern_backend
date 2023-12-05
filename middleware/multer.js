const multer = require('multer');
const storage = multer.diskStorage({});

const imageFilter = (req, file, cb) => {
  if (!file?.mimetype?.split('/')[0] === 'image') {
    return cb(new Error('File type not supported'), false);
  }
  cb(null, true);
};

exports.uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 1024 * 1024 * 1, // 1MB
  },
});

const express = require('express');
const multer = require('multer');
const path = require('path');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Configuração do multer para upload de logo
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'));
    }
  }
});

router.use(authMiddleware);

router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.patch('/password', userController.updatePassword);
router.patch('/logo', upload.single('logo'), userController.uploadLogo);
router.delete('/account', userController.deleteAccount);
router.post('/upgrade', userController.upgradePlan);
router.get('/stats', userController.getStats);

module.exports = router;

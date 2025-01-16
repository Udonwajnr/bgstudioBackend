const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); // Import your Cloudinary configuration

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const allowedImageFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const allowedVideoFormats = ['video/mp4'];

    const fileType = file.mimetype;

    if (allowedImageFormats.includes(fileType)) {
      return {
        folder: 'bg-hair-products/images',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        resource_type: 'image',
      };
    } else if (allowedVideoFormats.includes(fileType)) {
      return {
        folder: 'bg-hair-products/videos',
        allowed_formats: ['mp4'],
        resource_type: 'video',
      };
    } else {
      throw new Error('Unsupported file type. Only JPG, PNG, JPEG, WEBP images, and MP4 videos are allowed.');
    }
  },
});


// Multer middleware
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB file size limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg','image/jpg', 'image/png', 'image/webp', 'video/mp4'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP images, and MP4 videos are allowed.'));
    }
  },
});


module.exports = upload;

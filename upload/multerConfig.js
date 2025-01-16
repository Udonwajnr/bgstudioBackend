const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); // Import your Cloudinary configuration

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const allowedImageFormats = ['jpg', 'png', 'jpeg',"webp"];
    const allowedVideoFormats = ['mp4'];

    // Determine the folder and allowed file types based on the file mimetype
    if (allowedImageFormats.includes(file.mimetype.split('/')[1])) {
      return {
        folder: 'bg-hair-products/images', // Folder for images
        allowed_formats: allowedImageFormats,
        resource_type: 'image', // Specify resource type for Cloudinary
      };
    } else if (allowedVideoFormats.includes(file.mimetype.split('/')[1])) {
      return {
        folder: 'bg-hair-products/videos', // Folder for videos
        allowed_formats: allowedVideoFormats,
        resource_type: 'video', // Specify resource type for Cloudinary
      };
    } else {
      throw new Error('Unsupported file type. Only images (jpg, png, jpeg) and videos (mp4) are allowed.');
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
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and MP4 files are allowed.'));
    }
  },
});

module.exports = upload;

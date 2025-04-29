// import fs from 'fs';
// import multer from 'multer';
// import path from 'path';

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = 'uploads/userimage';
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + '-' + file.originalname);
//   },
// });

// const fileFilter = (req, file, cb) => {
//   if (
//     file.mimetype.startsWith('image/') &&
//     (file.originalname.endsWith('.jpg') ||
//       file.originalname.endsWith('.jpeg') ||
//       file.originalname.endsWith('.png'))
//   ) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only JPG, JPEG, and PNG images are allowed!'), false);
//   }
// };

// const limits = {
//   fileSize: 1024 * 1024 * 5,
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: limits,
// }).single('image');

// export { upload };





//!agreementVideo
// import fs from 'fs';
// import multer from 'multer';
// import path from 'path';

// // Storage configuration for videos
// const videoStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Determine the directory based on file type
//     const uploadDir =
//       file.fieldname === 'image' ? 'uploads/userimage' : 'uploads/videos';

//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + '-' + file.originalname);
//   },
// });

// // File filter for both images and videos
// const fileFilter = (req, file, cb) => {
//   if (file.fieldname === 'image') {
//     // For images, only allow JPG, JPEG, and PNG
//     if (
//       file.mimetype.startsWith('image/') &&
//       (file.originalname.endsWith('.jpg') ||
//         file.originalname.endsWith('.jpeg') ||
//         file.originalname.endsWith('.png'))
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only JPG, JPEG, and PNG images are allowed!'), false);
//     }
//   } else if (
//     // Corrected video field name check
//     [
//       'agreementVideo',

//     ].includes(file.fieldname)
//   ) {
//     // For videos, allow MP4, AVI, MOV, and other common formats
//     if (
//       file.mimetype.startsWith('video/') &&
//       (file.originalname.endsWith('.mp4') ||
//         file.originalname.endsWith('.avi') ||
//         file.originalname.endsWith('.mov') ||
//         file.originalname.endsWith('.mkv') ||
//         file.originalname.endsWith('.wmv'))
//     ) {
//       cb(null, true);
//     } else {
//       cb(
//         new Error('Only MP4, AVI, MOV, MKV, and WMV videos are allowed!'),
//         false
//       );
//     }
//   } else {
//     cb(new Error('Unsupported file field!'), false);
//   }
// };

// // Size limits (5MB for images, 50MB for videos)
// const limits = {
//   fileSize: 1024 * 1024 * 50, // Increased to 50MB for videos
// };

// // Updated upload middleware that handles both image and video
// const upload = multer({
//   storage: videoStorage,
//   fileFilter: fileFilter,
//   limits: limits,
// });

// // Export single file upload functions for different field names
// export const uploadImage = upload.single('image');

// export const uploadVideoGramSamitiAgreement = upload.single('agreementVideo');

// // Export combined uploader for handling both in one request if needed
// export const uploadFiles = upload.fields([
//   { name: 'image', maxCount: 1 },

//   { name: 'agreementVideo', maxCount: 1 },
// ]);


//!v1
// import fs from 'fs';
// import multer from 'multer';
// import path from 'path';

// // Storage configuration for videos and images
// const videoStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     // Determine the directory based on file type and field name
//     let uploadDir;

//     switch (file.fieldname) {
//       case 'image':
//         uploadDir = 'uploads/userimage';
//         break;
//       case 'studentPhoto':
//         uploadDir = 'uploads/photos/studentPhoto';
//         break;
//       case 'parentPhoto':
//         uploadDir = 'uploads/photos/parentPhoto';
//         break;
//       case 'studentShortVieoAgreeSvpEnroll':
//         uploadDir = 'uploads/videos/studentVideo';
//         break;
//       case 'parentShortVieoAgreeSvpEnroll':
//         uploadDir = 'uploads/videos/parentVideo';
//         break;
//       case 'agreementVideo':
//         uploadDir = 'uploads/videos/agreementVideo';
//         break;
//       default:
//         uploadDir = 'uploads/misc';
//     }

//     // Create directory if it doesn't exist
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, uniqueSuffix + '-' + file.originalname);
//   },
// });

// // File filter for both images and videos
// const fileFilter = (req, file, cb) => {
//   if (file.fieldname === 'image') {
//     // For images, only allow JPG, JPEG, and PNG
//     if (
//       file.mimetype.startsWith('image/') &&
//       (file.originalname.endsWith('.jpg') ||
//         file.originalname.endsWith('.jpeg') ||
//         file.originalname.endsWith('.png'))
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only JPG, JPEG, and PNG images are allowed!'), false);
//     }
//   } else if (
//     // Video field names
//     [
//       'agreementVideo',
//       'studentShortVieoAgreeSvpEnroll',
//       'parentShortVieoAgreeSvpEnroll',
//     ].includes(file.fieldname)
//   ) {
//     // For videos, allow MP4, AVI, MOV, and other common formats
//     if (
//       file.mimetype.startsWith('video/') &&
//       (file.originalname.endsWith('.mp4') ||
//         file.originalname.endsWith('.avi') ||
//         file.originalname.endsWith('.mov') ||
//         file.originalname.endsWith('.mkv') ||
//         file.originalname.endsWith('.wmv'))
//     ) {
//       cb(null, true);
//     } else {
//       cb(
//         new Error('Only MP4, AVI, MOV, MKV, and WMV videos are allowed!'),
//         false
//       );
//     }
//   } else if (
//     // Photo field names
//     ['studentPhoto', 'parentPhoto'].includes(file.fieldname)
//   ) {
//     // For photos, only allow JPG, JPEG, and PNG
//     if (
//       file.mimetype.startsWith('image/') &&
//       (file.originalname.endsWith('.jpg') ||
//         file.originalname.endsWith('.jpeg') ||
//         file.originalname.endsWith('.png'))
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only JPG, JPEG, and PNG photos are allowed!'), false);
//     }
//   } else {
//     cb(new Error('Unsupported file field!'), false);
//   }
// };

// // Size limits (5MB for images, 50MB for videos)
// const limits = {
//   fileSize: 1024 * 1024 * 50, // Increased to 50MB for videos
// };

// // Updated upload middleware that handles both image and video
// const upload = multer({
//   storage: videoStorage,
//   fileFilter: fileFilter,
//   limits: limits,
// });

// // Export single file upload functions for different field names
// export const uploadImage = upload.single('image');
// export const studentPhotoForVJP = upload.single('studentPhoto');
// export const parentPhotoPhotoForVJP = upload.single('parentPhoto');
// export const studentShortVieoAgreeSvpEnrollForVJP = upload.single(
//   'studentShortVieoAgreeSvpEnroll'
// );
// export const parentShortVieoAgreeSvpEnrollForVJP = upload.single(
//   'parentShortVieoAgreeSvpEnroll'
// );
// export const uploadVideoGramSamitiAgreement = upload.single('agreementVideo');

// // Export combined uploader for handling both in one request if needed
// export const uploadFiles = upload.fields([
//   { name: 'image', maxCount: 1 },
//   { name: 'studentPhoto', maxCount: 1 },
//   { name: 'parentPhoto', maxCount: 1 },
//   { name: 'studentShortVieoAgreeSvpEnroll', maxCount: 1 },
//   { name: 'parentShortVieoAgreeSvpEnroll', maxCount: 1 },
//   { name: 'agreementVideo', maxCount: 1 },
// ]);

//!multi upload
// Updated multerHandler.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create upload directories
const createUploadDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configure storage with dynamic directory creation
const createStorage = (uploadType) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadDir;
      switch (uploadType) {
        case 'studentPhoto':
          uploadDir = path.join(process.cwd(), 'uploads/studentPhotos');
          break;
        case 'parentPhoto':
          uploadDir = path.join(process.cwd(), 'uploads/parentPhotos');
          break;
        case 'studentVideo':
          uploadDir = path.join(process.cwd(), 'uploads/studentVideos');
          break;
        case 'parentVideo':
          uploadDir = path.join(process.cwd(), 'uploads/parentVideos');
          break;
        case 'agreementVideo':
          uploadDir = path.join(process.cwd(), 'uploads/gramSamitiVideo');
          break;
        case 'memberPhoto':
          uploadDir = path.join(process.cwd(), 'uploads/gramSamitiMemberPhotos');
          break;
        default:
          uploadDir = path.join(process.cwd(), 'uploads/misc');
      }

      createUploadDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
  });
};

// Comprehensive file filter
const fileFilter = (req, file, cb) => {
  // Image file validation
  const imageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const videoTypes = [
    'video/mp4',
    'video/avi',
    'video/quicktime',
    'video/x-msvideo',
  ];

  const isImage = imageTypes.includes(file.mimetype);
  const isVideo = videoTypes.includes(file.mimetype);

  const isImageFile = file.originalname.match(/\.(jpg|jpeg|png)$/i);
  const isVideoFile = file.originalname.match(/\.(mp4|avi|mov|mkv)$/i);

  if ((isImage && isImageFile) || (isVideo && isVideoFile)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only images (jpg, png) and videos (mp4, avi, mov, mkv) are allowed.'
      ),
      false
    );
  }
};

// Create upload instances with comprehensive configuration
const createUploadInstance = (fileType, maxSize = 50 * 1024 * 1024) => {
  return multer({
    storage: createStorage(fileType),
    fileFilter: fileFilter,
    limits: {
      fileSize: maxSize, // 50MB default
      files: 1, // Limit to one file per field
    },
  });
};

// Export upload middlewares
export const uploadMiddleware = {
  // Single file uploads
  studentPhoto: createUploadInstance('studentPhoto', 5 * 1024 * 1024).single(
    'studentPhoto'
  ),
  parentPhoto: createUploadInstance('parentPhoto', 5 * 1024 * 1024).single(
    'parentPhoto'
  ),
  studentVideo: createUploadInstance('studentVideo').single(
    'studentShortVieoAgreeSvpEnroll'
  ),
  parentVideo: createUploadInstance('parentVideo').single(
    'parentShortVieoAgreeSvpEnroll'
  ),
  agreementVideo:
    createUploadInstance('agreementVideo').single('agreementVideo'),
  memberPhoto: createUploadInstance('memberPhoto', 5 * 1024 * 1024).single(
    'memberPhoto'
  ),

  // Multiple file upload
  multipleFiles: multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        let uploadDir;
        switch (file.fieldname) {
          case 'studentPhoto':
            uploadDir = path.join(process.cwd(), 'uploads/studentPhotos');
            break;
          case 'parentPhoto':
            uploadDir = path.join(process.cwd(), 'uploads/parentPhotos');
            break;
          case 'studentShortVieoAgreeSvpEnroll':
            uploadDir = path.join(process.cwd(), 'uploads/studentVideos');
            break;
          case 'parentShortVieoAgreeSvpEnroll':
            uploadDir = path.join(process.cwd(), 'uploads/parentVideos');
            break;
          case 'agreementVideo':
            uploadDir = path.join(process.cwd(), 'uploads/gramSamitiVideo');
            break;
          case 'memberPhotos':
            uploadDir = path.join(process.cwd(), 'uploads/gramSamitiMemberPhotos');
            break;
          default:
            uploadDir = path.join(process.cwd(), 'uploads/misc');
        }

        createUploadDir(uploadDir);
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
      },
    }),
    fileFilter: fileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
  }).fields([
    { name: 'studentPhoto', maxCount: 1 },
    { name: 'parentPhoto', maxCount: 1 },
    { name: 'studentShortVieoAgreeSvpEnroll', maxCount: 1 },
    { name: 'parentShortVieoAgreeSvpEnroll', maxCount: 1 },
    { name: 'agreementVideo', maxCount: 1 },
    { name: 'memberPhotos', maxCount: 7 }, // Allow up to 7 member photos (one for each role)
  ]),
};
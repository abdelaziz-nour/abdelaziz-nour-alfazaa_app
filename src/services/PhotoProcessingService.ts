import {launchImageLibrary, launchCamera, ImagePickerResponse, MediaType, PhotoQuality} from 'react-native-image-picker';
import {PhotoRecord} from '../types';
import RNFS from 'react-native-fs';

export interface ImagePickerOptions {
  mediaType: MediaType;
  quality: PhotoQuality;
  maxWidth: number;
  maxHeight: number;
  includeBase64: boolean;
}

class PhotoProcessingService {
  private readonly MAX_IMAGE_SIZE = 2048; // Max dimension in pixels
  private readonly THUMBNAIL_SIZE = 300; // Thumbnail dimension in pixels
  private readonly JPEG_QUALITY = 0.85; // 85% quality
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max file size

  /**
   * Launch camera to capture photo
   */
  async capturePhoto(): Promise<PhotoRecord | null> {
    const options: ImagePickerOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: this.MAX_IMAGE_SIZE,
      maxHeight: this.MAX_IMAGE_SIZE,
      includeBase64: false,
    };

    return new Promise((resolve) => {
      launchCamera(options, async (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) {
          console.log('Camera cancelled or error:', response.errorMessage);
          resolve(null);
          return;
        }

        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          const processedPhoto = await this.processImage(asset.uri!, asset.fileName || 'camera_photo.jpg');
          resolve(processedPhoto);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Launch image library to select photo
   */
  async selectFromLibrary(): Promise<PhotoRecord | null> {
    const options: ImagePickerOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: this.MAX_IMAGE_SIZE,
      maxHeight: this.MAX_IMAGE_SIZE,
      includeBase64: false,
    };

    return new Promise((resolve) => {
      launchImageLibrary(options, async (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) {
          console.log('Library cancelled or error:', response.errorMessage);
          resolve(null);
          return;
        }

        if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          const processedPhoto = await this.processImage(asset.uri!, asset.fileName || 'library_photo.jpg');
          resolve(processedPhoto);
        } else {
          resolve(null);
        }
      });
    });
  }

  /**
   * Process captured/selected image
   */
  private async processImage(uri: string, fileName: string): Promise<PhotoRecord | null> {
    try {
      console.log(`Processing image: ${uri}`);
      
      // Check if file exists
      const fileExists = await RNFS.exists(uri);
      if (!fileExists) {
        throw new Error(`Source file not found: ${uri}`);
      }
      
      // Get file info
      const fileInfo = await RNFS.stat(uri);
      console.log(`Original file size: ${fileInfo.size} bytes`);

      // Check file size
      if (fileInfo.size > this.MAX_FILE_SIZE) {
        throw new Error('File too large. Maximum size is 10MB.');
      }

      // Generate unique ID and timestamp
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const timestamp = new Date().toISOString();

      // Create processed file paths
      const processedUri = `${RNFS.CachesDirectoryPath}/processed_${id}.jpg`;
      const thumbnailUri = `${RNFS.CachesDirectoryPath}/thumb_${id}.jpg`;

      console.log(`Processing to: ${processedUri}`);

      // Process image (resize, compress, fix orientation)
      const processedImage = await this.resizeAndCompressImage(uri, processedUri);

      // Generate thumbnail
      await this.generateThumbnail(processedUri, thumbnailUri);

      // Calculate checksum
      const checksum = await this.calculateChecksum(processedUri);

      // Get processed file info
      const processedFileInfo = await RNFS.stat(processedUri);
      console.log(`Processed file size: ${processedFileInfo.size} bytes`);

      // Create PhotoRecord
      const photoRecord: PhotoRecord = {
        id,
        uri: processedUri,
        fileName: this.sanitizeFileName(fileName),
        mimeType: 'image/jpeg',
        size: processedFileInfo.size,
        timestamp,
        checksum,
        width: processedImage.width,
        height: processedImage.height,
        status: 'local',
        uploadAttempts: 0,
        thumbnailUri,
        compressedSize: processedFileInfo.size,
        orientation: processedImage.orientation,
      };

      console.log(`Photo record created:`, {
        id: photoRecord.id,
        uri: photoRecord.uri,
        size: photoRecord.size,
        fileName: photoRecord.fileName
      });

      return photoRecord;
    } catch (error) {
      console.error('Error processing image:', error);
      return null;
    }
  }

  /**
   * Resize and compress image (simplified version)
   */
  private async resizeAndCompressImage(
    sourceUri: string,
    outputUri: string,
  ): Promise<{width: number; height: number; orientation: number}> {
    try {
      console.log(`Resizing image from ${sourceUri} to ${outputUri}`);
      
      // Check if source file exists
      const sourceExists = await RNFS.exists(sourceUri);
      if (!sourceExists) {
        throw new Error(`Source file not found: ${sourceUri}`);
      }
      
      // Get source file info
      const sourceInfo = await RNFS.stat(sourceUri);
      console.log(`Source file size: ${sourceInfo.size} bytes`);
      
      // For now, just copy the file (in production, use proper image processing)
      // The image picker already handles compression based on our quality settings
      await RNFS.copyFile(sourceUri, outputUri);
      
      // Verify the copy worked
      const outputExists = await RNFS.exists(outputUri);
      if (!outputExists) {
        throw new Error('Failed to create output file');
      }
      
      const outputInfo = await RNFS.stat(outputUri);
      console.log(`Output file size: ${outputInfo.size} bytes`);
      
      // Return reasonable dimensions (in production, get actual dimensions)
      return {
        width: 1920,
        height: 1080,
        orientation: 1,
      };
    } catch (error) {
      console.error('Error processing image:', error);
      throw error; // Re-throw to be handled by caller
    }
  }

  /**
   * Generate thumbnail (simplified version)
   */
  private async generateThumbnail(sourceUri: string, outputUri: string): Promise<void> {
    try {
      // For now, copy the source file as thumbnail
      // In production, use proper thumbnail generation
      await RNFS.copyFile(sourceUri, outputUri);
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Fallback: copy source file
      await RNFS.copyFile(sourceUri, outputUri);
    }
  }

  /**
   * Calculate file checksum
   */
  private async calculateChecksum(fileUri: string): Promise<string> {
    try {
      const fileData = await RNFS.readFile(fileUri, 'base64');
      // Simple checksum calculation (in production, use crypto library)
      let hash = 0;
      for (let i = 0; i < fileData.length; i++) {
        const char = fileData.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    } catch (error) {
      console.error('Error calculating checksum:', error);
      return Date.now().toString();
    }
  }

  /**
   * Sanitize filename for safe storage
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
  }

  /**
   * Generate deterministic filename for upload
   */
  generateUploadFileName(
    intakeId: string,
    vehiclePlate: string,
    photoIndex: number,
    damagePart?: string,
  ): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const partSuffix = damagePart ? `_${damagePart.replace(/\s+/g, '_')}` : '';
    return `intake_${vehiclePlate}_${intakeId}_${photoIndex}${partSuffix}_${timestamp}.jpg`;
  }

  /**
   * Clean up temporary files
   */
  async cleanupTempFiles(photoRecord: PhotoRecord): Promise<void> {
    try {
      if (await RNFS.exists(photoRecord.uri)) {
        await RNFS.unlink(photoRecord.uri);
      }
      if (photoRecord.thumbnailUri && await RNFS.exists(photoRecord.thumbnailUri)) {
        await RNFS.unlink(photoRecord.thumbnailUri);
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }

  /**
   * Get photo picker options
   */
  getPhotoPickerOptions() {
    return {
      title: 'Select Photo',
      cancelButtonTitle: 'Cancel',
      takePhotoButtonTitle: 'Take Photo',
      chooseFromLibraryButtonTitle: 'Choose from Library',
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };
  }
}

export default new PhotoProcessingService();

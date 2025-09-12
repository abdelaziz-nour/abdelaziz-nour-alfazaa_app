import {UploadJob, PhotoRecord} from '../types';
import DatabaseService from './DatabaseService';

interface UploadProgress {
  photoId: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

class UploadQueueService {
  private readonly MAX_CONCURRENT_UPLOADS = 2;
  private readonly MAX_RETRY_ATTEMPTS = 5;
  private readonly RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff in ms
  
  private uploadQueue: UploadJob[] = [];
  private activeUploads = new Set<string>();
  private progressCallbacks = new Map<string, (progress: UploadProgress) => void>();
  private isProcessing = false;

  /**
   * Initialize upload queue from database
   */
  async initialize(): Promise<void> {
    try {
      // Load pending uploads from database
      const pendingJobs = await this.getPendingJobs();
      this.uploadQueue = pendingJobs;
      
      // Start processing queue
      this.processQueue();
      
      console.log(`Upload queue initialized with ${pendingJobs.length} pending jobs`);
    } catch (error) {
      console.error('Error initializing upload queue:', error);
    }
  }

  /**
   * Add photo to upload queue
   */
  async addPhotoToQueue(photo: PhotoRecord, intakeId: string): Promise<void> {
    try {
      const job: UploadJob = {
        id: `upload_${photo.id}`,
        photoId: photo.id,
        intakeId,
        status: 'pending',
        priority: 1,
        createdAt: new Date().toISOString(),
        attempts: 0,
        maxAttempts: this.MAX_RETRY_ATTEMPTS,
      };

      // Add to queue
      this.uploadQueue.push(job);
      
      // Save to database
      await this.saveJobToDatabase(job);
      
      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }
      
      console.log(`Added photo ${photo.id} to upload queue`);
    } catch (error) {
      console.error('Error adding photo to queue:', error);
    }
  }

  /**
   * Remove photo from upload queue
   */
  async removePhotoFromQueue(photoId: string): Promise<void> {
    try {
      // Remove from memory queue
      this.uploadQueue = this.uploadQueue.filter(job => job.photoId !== photoId);
      
      // Remove from database
      await this.removeJobFromDatabase(photoId);
      
      // Cancel active upload if running
      if (this.activeUploads.has(photoId)) {
        this.activeUploads.delete(photoId);
      }
      
      console.log(`Removed photo ${photoId} from upload queue`);
    } catch (error) {
      console.error('Error removing photo from queue:', error);
    }
  }

  /**
   * Retry failed upload
   */
  async retryUpload(photoId: string): Promise<void> {
    try {
      const job = this.uploadQueue.find(j => j.photoId === photoId);
      if (job) {
        job.status = 'pending';
        job.attempts = 0;
        job.nextRetryAt = undefined;
        
        // Update database
        await this.updateJobInDatabase(job);
        
        // Start processing
        this.processQueue();
        
        console.log(`Retrying upload for photo ${photoId}`);
      }
    } catch (error) {
      console.error('Error retrying upload:', error);
    }
  }

  /**
   * Get upload progress for photo
   */
  getUploadProgress(photoId: string): UploadProgress | null {
    const job = this.uploadQueue.find(j => j.photoId === photoId);
    if (!job) return null;

    return {
      photoId,
      progress: this.calculateProgress(job),
      status: job.status,
      error: job.status === 'failed' ? 'Upload failed' : undefined,
    };
  }

  /**
   * Subscribe to upload progress updates
   */
  subscribeToProgress(photoId: string, callback: (progress: UploadProgress) => void): () => void {
    this.progressCallbacks.set(photoId, callback);
    
    // Return unsubscribe function
    return () => {
      this.progressCallbacks.delete(photoId);
    };
  }

  /**
   * Process upload queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      while (this.uploadQueue.length > 0 && this.activeUploads.size < this.MAX_CONCURRENT_UPLOADS) {
        const job = this.getNextJob();
        if (!job) break;
        
        // Check if job is ready for retry
        if (job.nextRetryAt && new Date(job.nextRetryAt) > new Date()) {
          break;
        }
        
        // Start upload
        this.activeUploads.add(job.photoId);
        this.uploadPhoto(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get next job to process (priority-based)
   */
  private getNextJob(): UploadJob | null {
    // Sort by priority (higher first), then by creation time
    const sortedJobs = this.uploadQueue
      .filter(job => job.status === 'pending' && !this.activeUploads.has(job.photoId))
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    
    return sortedJobs[0] || null;
  }

  /**
   * Upload photo
   */
  private async uploadPhoto(job: UploadJob): Promise<void> {
    try {
      // Update job status
      job.status = 'uploading';
      job.lastAttempt = new Date().toISOString();
      job.attempts++;
      
      await this.updateJobInDatabase(job);
      
      // Notify progress
      this.notifyProgress(job.photoId, {
        photoId: job.photoId,
        progress: 0,
        status: 'uploading',
      });
      
      // TODO: Implement actual upload logic
      // For now, simulate upload
      await this.simulateUpload(job);
      
      // Mark as completed
      job.status = 'completed';
      await this.updateJobInDatabase(job);
      
      // Remove from active uploads
      this.activeUploads.delete(job.photoId);
      
      // Notify completion
      this.notifyProgress(job.photoId, {
        photoId: job.photoId,
        progress: 100,
        status: 'completed',
      });
      
      // Remove from queue
      this.uploadQueue = this.uploadQueue.filter(j => j.id !== job.id);
      
      console.log(`Successfully uploaded photo ${job.photoId}`);
      
    } catch (error) {
      console.error(`Error uploading photo ${job.photoId}:`, error);
      
      // Handle failure
      await this.handleUploadFailure(job, error);
    }
  }

  /**
   * Simulate upload (replace with actual upload logic)
   */
  private async simulateUpload(job: UploadJob): Promise<void> {
    return new Promise((resolve, reject) => {
      const duration = 2000 + Math.random() * 3000; // 2-5 seconds
      let progress = 0;
      
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          resolve();
        }
        
        this.notifyProgress(job.photoId, {
          photoId: job.photoId,
          progress,
          status: 'uploading',
        });
      }, 200);
      
      // Simulate occasional failures
      if (Math.random() < 0.1) { // 10% failure rate for testing
        setTimeout(() => {
          clearInterval(interval);
          reject(new Error('Simulated upload failure'));
        }, duration * 0.5);
      }
    });
  }

  /**
   * Handle upload failure
   */
  private async handleUploadFailure(job: UploadJob, error: any): Promise<void> {
    job.status = 'failed';
    job.lastError = error.message || 'Unknown error';
    
    // Check if we should retry
    if (job.attempts < job.maxAttempts) {
      const delay = this.RETRY_DELAYS[Math.min(job.attempts - 1, this.RETRY_DELAYS.length - 1)];
      job.nextRetryAt = new Date(Date.now() + delay).toISOString();
      job.priority = Math.min(job.priority + 1, 10); // Increase priority for retries
    } else {
      // Max attempts reached, mark as permanently failed
      job.status = 'failed';
    }
    
    await this.updateJobInDatabase(job);
    
    // Remove from active uploads
    this.activeUploads.delete(job.photoId);
    
    // Notify failure
    this.notifyProgress(job.photoId, {
      photoId: job.photoId,
      progress: 0,
      status: 'failed',
      error: job.lastError,
    });
    
    // Continue processing queue
    this.processQueue();
  }

  /**
   * Calculate upload progress
   */
  private calculateProgress(job: UploadJob): number {
    switch (job.status) {
      case 'pending':
        return 0;
      case 'uploading':
        return Math.min(job.attempts * 20, 90); // Rough progress estimate
      case 'completed':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Notify progress subscribers
   */
  private notifyProgress(photoId: string, progress: UploadProgress): void {
    const callback = this.progressCallbacks.get(photoId);
    if (callback) {
      callback(progress);
    }
  }

  /**
   * Database operations
   */
  private async getPendingJobs(): Promise<UploadJob[]> {
    // TODO: Implement database query
    return [];
  }

  private async saveJobToDatabase(job: UploadJob): Promise<void> {
    // TODO: Implement database save
    console.log('Saving job to database:', job.id);
  }

  private async updateJobInDatabase(job: UploadJob): Promise<void> {
    // TODO: Implement database update
    console.log('Updating job in database:', job.id);
  }

  private async removeJobFromDatabase(photoId: string): Promise<void> {
    // TODO: Implement database remove
    console.log('Removing job from database:', photoId);
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    total: number;
    pending: number;
    uploading: number;
    completed: number;
    failed: number;
  } {
    const total = this.uploadQueue.length;
    const pending = this.uploadQueue.filter(j => j.status === 'pending').length;
    const uploading = this.uploadQueue.filter(j => j.status === 'uploading').length;
    const completed = this.uploadQueue.filter(j => j.status === 'completed').length;
    const failed = this.uploadQueue.filter(j => j.status === 'failed').length;
    
    return {total, pending, uploading, completed, failed};
  }
}

export default new UploadQueueService();

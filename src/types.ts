export type RootStackParamList = {
  IntakeForm: undefined;
  VehicleBody: undefined;
  NotesSignature: undefined;
};

export interface DamageNote {
  part: string;
  damage: string;
  timestamp?: string;
}

export interface PhotoRecord {
  // Core fields
  id: string;
  uri: string; // Raw filesystem path for RNFS operations
  displayUri?: string; // file:// URI for Image component display
  fileName: string;
  mimeType: string;
  size: number;
  timestamp: string;

  // Upload queue fields
  driveFileId?: string;
  checksum: string;
  width: number;
  height: number;
  status: 'local' | 'uploading' | 'uploaded' | 'failed';
  uploadAttempts: number;
  lastError?: string;
  damagePart?: string; // Link to specific damage

  // Processing fields
  thumbnailUri?: string;
  compressedSize?: number;
  orientation?: number;
}

export interface UploadJob {
  id: string;
  photoId: string;
  intakeId: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  priority: number;
  createdAt: string;
  lastAttempt?: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;
  lastError?: string;
}

export interface IntakeRecord {
  id: string;
  driverName: string;
  driverId: string;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleType: string;
  price: string;
  damageNotes: DamageNote[];
  photos: PhotoRecord[];
  generalComments: string;
  signature: string | null;
  createdAt: string;
  synced?: boolean;
}
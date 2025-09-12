import {createContext, useContext, useReducer, ReactNode} from 'react';

interface VehicleState {
  driverName: string;
  driverId: string;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleType: string;
  price: string;
  damageNotes: Array<{
    part: string;
    damage: string;
    timestamp?: string;
  }>;
  photos: Array<{
    id: string;
    uri: string;
    fileName: string;
    mimeType: string;
    size: number;
    timestamp: string;
    driveFileId?: string;
    checksum: string;
    width: number;
    height: number;
    status: 'local' | 'uploading' | 'uploaded' | 'failed';
    uploadAttempts: number;
    lastError?: string;
    damagePart?: string;
    thumbnailUri?: string;
    compressedSize?: number;
    orientation?: number;
  }>;
  generalComments: string;
  signature: string | null;
  timestamp: string | null;
}

type VehicleAction =
  | {type: 'UPDATE_FIELD'; field: string; value: string}
  | {
      type: 'ADD_DAMAGE_NOTE';
      note: {part: string; damage: string; timestamp?: string};
    }
  | {type: 'REMOVE_DAMAGE_NOTE'; index: number}
  | {type: 'ADD_PHOTO'; photo: any}
  | {type: 'REMOVE_PHOTO'; photoId: string}
  | {type: 'UPDATE_PHOTO_STATUS'; photoId: string; status: string; driveFileId?: string; error?: string}
  | {type: 'LINK_PHOTO_TO_DAMAGE'; photoId: string; damagePart: string}
  | {type: 'SET_SIGNATURE'; signature: string}
  | {type: 'RESET_FORM'};

interface VehicleContextType {
  state: VehicleState;
  dispatch: React.Dispatch<VehicleAction>;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

// ... rest of the context implementation remains the same ...const initialState = {
const initialState = {
  driverName: '',
  driverId: '',
  customerName: '',
  customerPhone: '',
  vehiclePlate: '',
  vehicleColor: '',
  vehicleType: 'Sedan',
  price: '',
  damageNotes: [],
  photos: [],
  generalComments: '',
  signature: null,
  timestamp: null,
};

function vehicleReducer(state: VehicleState, action: VehicleAction) {
  switch (action.type) {
    case 'UPDATE_FIELD':
      return {...state, [action.field]: action.value};
    case 'ADD_DAMAGE_NOTE':
      return {
        ...state,
        damageNotes: [...state.damageNotes, action.note],
      };
    case 'REMOVE_DAMAGE_NOTE':
      return {
        ...state,
        damageNotes: state.damageNotes.filter(
          (_, index) => index !== action.index,
        ),
      };
    case 'ADD_PHOTO':
      return {
        ...state,
        photos: [...state.photos, action.photo],
      };
    case 'REMOVE_PHOTO':
      return {
        ...state,
        photos: state.photos.filter(photo => photo.id !== action.photoId),
      };
    case 'UPDATE_PHOTO_STATUS':
      return {
        ...state,
        photos: state.photos.map(photo =>
          photo.id === action.photoId
            ? {
                ...photo,
                status: action.status as any,
                driveFileId: action.driveFileId || photo.driveFileId,
                lastError: action.error || photo.lastError,
                uploadAttempts: action.status === 'uploading' ? photo.uploadAttempts + 1 : photo.uploadAttempts,
              }
            : photo,
        ),
      };
    case 'LINK_PHOTO_TO_DAMAGE':
      return {
        ...state,
        photos: state.photos.map(photo =>
          photo.id === action.photoId
            ? {...photo, damagePart: action.damagePart}
            : photo,
        ),
      };
    case 'SET_SIGNATURE':
      return {...state, signature: action.signature};
    case 'RESET_FORM':
      return {...initialState, timestamp: new Date().toISOString()};
    default:
      return state;
  }
}

export function VehicleProvider({children}: {children: ReactNode}) {
  const [state, dispatch] = useReducer(vehicleReducer, {
    ...initialState,
    timestamp: new Date().toISOString(),
  });

  return (
    <VehicleContext.Provider value={{state, dispatch}}>
      {children}
    </VehicleContext.Provider>
  );
}

export const useVehicle = () => {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicle must be used within VehicleProvider');
  }
  return context;
};

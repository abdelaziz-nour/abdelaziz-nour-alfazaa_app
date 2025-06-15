import {createContext, useContext, useReducer, ReactNode} from 'react';

interface VehicleState {
  driverName: string;
  driverId: string;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleType: string;
  damageNotes: Array<{
    part: string;
    damage: string;
    timestamp?: string;
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
  damageNotes: [],
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

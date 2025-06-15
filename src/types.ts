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

export interface IntakeRecord {
  id: string;
  driverName: string;
  driverId: string;
  customerName: string;
  customerPhone: string;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleType: string;
  damageNotes: DamageNote[];
  generalComments: string;
  signature: string | null;
  createdAt: string;
  synced?: boolean;
}
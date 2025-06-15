import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';

interface VehicleDiagramProps {
  vehicleType: string;
  onPartPress: (partName: string) => void;
  damageNotes: Array<{
    part: string;
    damage: string;
    timestamp?: string;
  }>;
}

interface VehiclePart {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function VehicleDiagram({
  vehicleType,
  onPartPress,
  damageNotes,
}: VehicleDiagramProps) {
  const hasDamage = (partName: string): boolean => {
    return damageNotes.some(note => note.part === partName);
  };

  const getPartStyle = (partName: string) => ({
    ...styles.vehiclePart,
    backgroundColor: hasDamage(partName) ? '#f44336' : '#e3f2fd',
  });
  // Simplified vehicle diagram using touchable areas
  const VehicleParts = [
    // Front section
    {name: 'Front Bumper', x: 110, y: 40, width: 100, height: 25},
    {name: 'Hood', x: 110, y: 65, width: 100, height: 70},
    {name: 'Windshield', x: 110, y: 135, width: 100, height: 40},

    // Roof section
    {name: 'Roof', x: 110, y: 175, width: 100, height: 90},

    // Doors - Left side
    {name: 'Front Left Door', x: 40, y: 175, width: 70, height: 45},
    {name: 'Rear Left Door', x: 40, y: 220, width: 70, height: 45},

    // Doors - Right side
    {name: 'Front Right Door', x: 210, y: 175, width: 70, height: 45},
    {name: 'Rear Right Door', x: 210, y: 220, width: 70, height: 45},

    // Fenders
    {name: 'Front Left Fender', x: 40, y: 105, width: 70, height: 70},
    {name: 'Front Right Fender', x: 210, y: 105, width: 70, height: 70},
    {name: 'Rear Left Fender', x: 40, y: 265, width: 70, height: 70},
    {name: 'Rear Right Fender', x: 210, y: 265, width: 70, height: 70},

    // Rear section
    {name: 'Trunk', x: 110, y: 265, width: 100, height: 70},
    {name: 'Rear Bumper', x: 110, y: 335, width: 100, height: 25},

    // Tires
    {name: 'Left Front Tire', x: 0, y: 125, width: 40, height: 40},
    {name: 'Right Front Tire', x: 280, y: 125, width: 40, height: 40},
    {name: 'Left Rear Tire', x: 0, y: 285, width: 40, height: 40},
    {name: 'Right Rear Tire', x: 280, y: 285, width: 40, height: 40},
  ];

  return (
    <View style={styles.diagramContainer}>
      <Text style={styles.diagramTitle}>Vehicle Top View</Text>
      <View style={styles.vehicleContainer}>
        {VehicleParts.map(part => (
          <TouchableOpacity
            key={part.name}
            style={[
              getPartStyle(part.name),
              {
                position: 'absolute',
                left: part.x,
                top: part.y,
                width: part.width,
                height: part.height,
              },
            ]}
            onPress={() => onPartPress(part.name)}>
            <Text style={styles.partText}>{part.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  diagramContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    elevation: 3,
    marginVertical: 10,
  },
  diagramTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  vehicleContainer: {
    height: 400,
    position: 'relative',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  vehiclePart: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  partText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
  },
});

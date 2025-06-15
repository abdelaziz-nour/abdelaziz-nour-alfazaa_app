import {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useVehicle} from '../context/VehicleContext';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';
import {RootStackParamList} from '../types';

interface IntakeFormScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'IntakeForm'>;
}

interface FormErrors {
  driverName?: string;
  driverId?: string;
  customerName?: string;
  customerPhone?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
  vehicleType?: string; // Add this line
}

export default function IntakeFormScreen({navigation}: IntakeFormScreenProps) {
  const {state, dispatch} = useVehicle();
  const [errors, setErrors] = useState<FormErrors>({});
  const vehicleTypes = ['Sedan', 'SUV', 'Pickup', 'Van', 'Truck', 'Other'];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!state.driverName.trim())
      newErrors.driverName = 'Driver name is required';
    if (!state.driverId.trim()) newErrors.driverId = 'Driver ID is required';
    if (!state.customerName.trim())
      newErrors.customerName = 'Customer name is required';
    if (!state.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(state.customerPhone)) {
      newErrors.customerPhone = 'Invalid phone number format';
    }
    if (!state.vehiclePlate.trim())
      newErrors.vehiclePlate = 'Vehicle plate is required';
    if (!state.vehicleColor.trim())
      newErrors.vehicleColor = 'Vehicle color is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      navigation.navigate('VehicleBody');
    } else {
      Alert.alert(
        'Validation Error',
        'Please fill in all required fields correctly.',
      );
    }
  };

  const updateField = (field: keyof FormErrors, value: string) => {
    dispatch({type: 'UPDATE_FIELD', field, value});
    if (errors[field]) {
      setErrors({...errors, [field]: null});
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Vehicle Intake Form</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Driver Name *</Text>
            <TextInput
              style={[styles.input, errors.driverName && styles.inputError]}
              value={state.driverName}
              onChangeText={value => updateField('driverName', value)}
              placeholder="Enter driver name"
            />
            {errors.driverName && (
              <Text style={styles.errorText}>{errors.driverName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Driver ID *</Text>
            <TextInput
              style={[styles.input, errors.driverId && styles.inputError]}
              value={state.driverId}
              onChangeText={value => updateField('driverId', value)}
              placeholder="Enter driver ID"
            />
            {errors.driverId && (
              <Text style={styles.errorText}>{errors.driverId}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Name *</Text>
            <TextInput
              style={[styles.input, errors.customerName && styles.inputError]}
              value={state.customerName}
              onChangeText={value => updateField('customerName', value)}
              placeholder="Enter customer name"
            />
            {errors.customerName && (
              <Text style={styles.errorText}>{errors.customerName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.customerPhone && styles.inputError]}
              value={state.customerPhone}
              onChangeText={value => updateField('customerPhone', value)}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
            {errors.customerPhone && (
              <Text style={styles.errorText}>{errors.customerPhone}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Plate Number *</Text>
            <TextInput
              style={[styles.input, errors.vehiclePlate && styles.inputError]}
              value={state.vehiclePlate}
              onChangeText={value =>
                updateField('vehiclePlate', value.toUpperCase())
              }
              placeholder="Enter plate number"
              autoCapitalize="characters"
            />
            {errors.vehiclePlate && (
              <Text style={styles.errorText}>{errors.vehiclePlate}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Color *</Text>
            <TextInput
              style={[styles.input, errors.vehicleColor && styles.inputError]}
              value={state.vehicleColor}
              onChangeText={value => updateField('vehicleColor', value)}
              placeholder="Enter vehicle color"
            />
            {errors.vehicleColor && (
              <Text style={styles.errorText}>{errors.vehicleColor}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Type *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={state.vehicleType}
                onValueChange={value => updateField('vehicleType', value)}
                style={styles.picker}>
                {vehicleTypes.map((type: string) => (
                  <Picker.Item key={type} label={type} value={type} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#767c28',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#d2de24',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#cf2b24',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  nextButton: {
    backgroundColor: '#d2de24',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    color: '#767c28',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

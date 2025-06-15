import {useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useVehicle} from '../context/VehicleContext';
import DatabaseService from '../services/DatabaseService';
import {RootStackParamList} from '../types';
import {NativeStackNavigationProp} from 'react-native-screens/lib/typescript/native-stack/types';
import PrinterService from '../services/PrinterService';

interface NotesSignatureScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NotesSignature'>;
}

export default function NotesSignatureScreen({
  navigation,
}: NotesSignatureScreenProps) {
  const {state, dispatch} = useVehicle();
  const [isLoading, setIsLoading] = useState(false);

  // Remove all signature-related state and handlers

  const handleFinishAndPrint = async () => {
    console.log('handleFinishAndPrint called');
    setIsLoading(true);

    try {
      const intakeRecord = {
        ...state,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      await DatabaseService.saveIntakeRecord(intakeRecord);

      console.log('PrinterService:', PrinterService);
      console.log('PrinterService.printReceipt:', PrinterService.printReceipt);

      await PrinterService.printReceipt(intakeRecord);

      // Alert.alert(
      //   'Success!',
      //   'Vehicle intake completed. Please have customer sign the printed receipt.',
      //   [
      //     {
      //       text: 'New Intake',
      //       onPress: () => {
      //         dispatch({type: 'RESET_FORM'});
      //         navigation.navigate('IntakeForm');
      //       },
      //     },
      //   ],
      // );
    } catch (error) {
      console.error('Error completing intake:', error);
      Alert.alert('Error', 'Failed to complete intake. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Review & Sign</Text>

        {/* Damage Notes Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Damage Notes Summary</Text>
          {state.damageNotes.length > 0 ? (
            state.damageNotes.map((note, index) => (
              <View key={index} style={styles.damageItem}>
                <Text style={styles.damagePart}>{note.part}:</Text>
                <Text style={styles.damageType}>{note.damage}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noDamageText}>No damage noted</Text>
          )}
        </View>

        {/* General Comments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Comments</Text>
          <TextInput
            style={styles.commentsInput}
            value={state.generalComments}
            onChangeText={value =>
              dispatch({type: 'UPDATE_FIELD', field: 'generalComments', value})
            }
            placeholder="Add any additional comments about the vehicle..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Remove the entire signature section */}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.finishButton, isLoading && styles.disabledButton]}
            onPress={handleFinishAndPrint}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.finishButtonText}>Finish & Print</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Remove signature-related styles from the StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#cf2b24',
  },
  damageItem: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  damagePart: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    minWidth: 120,
  },
  damageType: {
    fontSize: 16,
    color: '#f44336',
  },
  noDamageText: {
    fontSize: 16,
    color: '#757575',
    fontStyle: 'italic',
  },
  commentsInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 100,
  },
  signatureContainer: {
    height: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden', // Add this
  },
  signature: {
    flex: 1,
  },
  clearButton: {
    backgroundColor: '#757575',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  backButton: {
    backgroundColor: '#757575',
    borderRadius: 10,
    padding: 15,
    flex: 0.45,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  finishButton: {
    backgroundColor: '#d2de24',
    borderRadius: 10,
    padding: 15,
    flex: 0.45,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#767c28',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
});

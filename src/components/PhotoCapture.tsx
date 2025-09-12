import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
} from 'react-native';
import {useVehicle} from '../context/VehicleContext';
import PhotoProcessingService from '../services/PhotoProcessingService';
import UploadQueueService from '../services/UploadQueueService';
import {PhotoRecord} from '../types';

interface PhotoCaptureProps {
  intakeId: string;
  vehiclePlate: string;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({intakeId, vehiclePlate}) => {
  const {state, dispatch} = useVehicle();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleCapturePhoto = async () => {
    try {
      setIsProcessing(true);
      const photo = await PhotoProcessingService.capturePhoto();
      
      if (photo) {
        // Generate upload filename
        const uploadFileName = PhotoProcessingService.generateUploadFileName(
          intakeId,
          vehiclePlate,
          state.photos.length,
        );
        
        const processedPhoto = {
          ...photo,
          fileName: uploadFileName,
        };
        
        // Add to context
        dispatch({type: 'ADD_PHOTO', photo: processedPhoto});
        
        // Add to upload queue
        await UploadQueueService.addPhotoToQueue(processedPhoto, intakeId);
        
        console.log('Photo captured and added to queue');
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectFromLibrary = async () => {
    try {
      setIsProcessing(true);
      const photo = await PhotoProcessingService.selectFromLibrary();
      
      if (photo) {
        // Generate upload filename
        const uploadFileName = PhotoProcessingService.generateUploadFileName(
          intakeId,
          vehiclePlate,
          state.photos.length,
        );
        
        const processedPhoto = {
          ...photo,
          fileName: uploadFileName,
        };
        
        // Add to context
        dispatch({type: 'ADD_PHOTO', photo: processedPhoto});
        
        // Add to upload queue
        await UploadQueueService.addPhotoToQueue(processedPhoto, intakeId);
        
        console.log('Photo selected and added to queue');
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePhoto = (photoId: string) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Remove from context
            dispatch({type: 'REMOVE_PHOTO', photoId});
            
            // Remove from upload queue
            await UploadQueueService.removePhotoFromQueue(photoId);
            
            console.log('Photo removed');
          },
        },
      ],
    );
  };

  const handleRetryUpload = async (photoId: string) => {
    await UploadQueueService.retryUpload(photoId);
  };

  const handleLinkToDamage = (photo: PhotoRecord) => {
    setSelectedPhoto(photo);
    setShowModal(true);
  };

  const handleDamagePartSelect = (damagePart: string) => {
    if (selectedPhoto) {
      dispatch({
        type: 'LINK_PHOTO_TO_DAMAGE',
        photoId: selectedPhoto.id,
        damagePart,
      });
    }
    setShowModal(false);
    setSelectedPhoto(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'local':
        return '📷';
      case 'uploading':
        return '⏳';
      case 'uploaded':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '📷';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'local':
        return '#2196F3';
      case 'uploading':
        return '#FF9800';
      case 'uploaded':
        return '#4CAF50';
      case 'failed':
        return '#F44336';
      default:
        return '#2196F3';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📸 Photo Documentation</Text>
      <Text style={styles.subtitle}>
        Add photos to document vehicle condition and damage
      </Text>

      {/* Photo Actions */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.cameraButton]}
          onPress={handleCapturePhoto}
          disabled={isProcessing}>
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>📷 Take Photo</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.libraryButton]}
          onPress={handleSelectFromLibrary}
          disabled={isProcessing}>
          <Text style={styles.actionButtonText}>🖼️ From Library</Text>
        </TouchableOpacity>
      </View>

      {/* Photo Grid */}
      {state.photos.length > 0 && (
        <View style={styles.photoGrid}>
          <Text style={styles.photoGridTitle}>
            Photos ({state.photos.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {state.photos.map((photo, index) => (
              <View key={photo.id} style={styles.photoItem}>
                <Image source={{uri: photo.uri}} style={styles.photoThumbnail} />
                <View style={styles.photoInfo}>
                  <Text style={styles.photoIndex}>#{index + 1}</Text>
                  <Text style={styles.photoStatus}>
                    {getStatusIcon(photo.status)}
                  </Text>
                </View>
                <View style={styles.photoActions}>
                  <TouchableOpacity
                    style={styles.photoActionButton}
                    onPress={() => handleLinkToDamage(photo)}>
                    <Text style={styles.photoActionText}>🔗</Text>
                  </TouchableOpacity>
                  {photo.status === 'failed' && (
                    <TouchableOpacity
                      style={styles.photoActionButton}
                      onPress={() => handleRetryUpload(photo.id)}>
                      <Text style={styles.photoActionText}>🔄</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.photoActionButton}
                    onPress={() => handleRemovePhoto(photo.id)}>
                    <Text style={styles.photoActionText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
                {photo.damagePart && (
                  <Text style={styles.damagePartLabel}>{photo.damagePart}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Damage Part Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Link Photo to Damage Part</Text>
            <Text style={styles.modalSubtitle}>
              Select the vehicle part this photo documents
            </Text>
            
            <ScrollView style={styles.damagePartsList}>
              {state.damageNotes.map((note, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.damagePartItem}
                  onPress={() => handleDamagePartSelect(note.part)}>
                  <Text style={styles.damagePartText}>{note.part}</Text>
                  <Text style={styles.damageTypeText}>{note.damage}</Text>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity
                style={styles.damagePartItem}
                onPress={() => handleDamagePartSelect('General')}>
                <Text style={styles.damagePartText}>General View</Text>
                <Text style={styles.damageTypeText}>Overall vehicle condition</Text>
              </TouchableOpacity>
            </ScrollView>
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: '#2196F3',
  },
  libraryButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  photoGrid: {
    marginTop: 16,
  },
  photoGridTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  photoItem: {
    marginRight: 12,
    alignItems: 'center',
    position: 'relative',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  photoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  photoIndex: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginRight: 4,
  },
  photoStatus: {
    fontSize: 16,
  },
  photoActions: {
    flexDirection: 'row',
    marginTop: 4,
  },
  photoActionButton: {
    padding: 4,
    marginHorizontal: 2,
  },
  photoActionText: {
    fontSize: 12,
  },
  damagePartLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  damagePartsList: {
    maxHeight: 300,
  },
  damagePartItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  damagePartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  damageTypeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default PhotoCapture;

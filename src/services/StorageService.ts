import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import SecurityUtils from '../utils/SecurityUtils';

class StorageService {
  async uploadJournalAttachment(file: File, userId: string): Promise<string> {
    if (!file || !userId) {
      throw new Error('Invalid file or user ID');
    }

    // Security checks
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('File size exceeds 5MB limit');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('File type not supported. Please upload JPEG, PNG, GIF, or WEBP images only.');
    }

    try {
      // Create a unique filename
      const fileExtension = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${timestamp}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      
      // Create reference to the path in storage
      const storageRef = ref(storage, `users/${userId}/journal_attachments/${fileName}`);
      
      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Uploaded attachment:', SecurityUtils.sanitizeForLog(fileName));
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading attachment:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to upload attachment');
    }
  }

  async deleteAttachment(downloadURL: string, userId: string): Promise<void> {
    try {
      // Extract the path from the download URL
      const urlPath = decodeURIComponent(downloadURL.split('/o/')[1].split('?')[0]);
      
      // Create a reference to the file
      const fileRef = ref(storage, urlPath);
      
      // Check if this file belongs to the user (security measure)
      if (!urlPath.includes(`users/${userId}/journal_attachments/`)) {
        throw new Error('Unauthorized access to file');
      }
      
      // Delete the file
      await deleteObject(fileRef);
      console.log('Deleted attachment');
    } catch (error) {
      console.error('Error deleting attachment:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to delete attachment');
    }
  }
}

export default new StorageService();

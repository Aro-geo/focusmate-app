import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import SecurityUtils from '../utils/SecurityUtils';

class JournalAttachmentService {
  /**
   * Upload an image attachment for a journal entry
   * @param file The file to upload
   * @param userId The user ID
   * @returns The download URL for the uploaded file
   */
  async uploadImage(file: File, userId: string): Promise<string> {
    console.log('uploadImage called with userId:', typeof userId, userId ? userId.substring(0, 5) + '...' : 'null/undefined');
    
    if (!file) {
      throw new Error('Invalid file');
    }
    
    if (!userId || typeof userId !== 'string' || userId.length === 0) {
      console.error('Invalid user ID in uploadImage:', userId);
      throw new Error('Invalid user ID');
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
      console.log('Uploaded image attachment:', SecurityUtils.sanitizeForLog(fileName));
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to upload image');
    }
  }

  /**
   * Delete an attachment from storage
   * @param url The URL of the attachment to delete
   * @param userId The user ID
   */
  async deleteImage(url: string, userId: string): Promise<void> {
    console.log('deleteImage called with userId:', typeof userId, userId ? userId.substring(0, 5) + '...' : 'null/undefined');
    
    if (!url) {
      throw new Error('Invalid URL');
    }
    
    if (!userId || typeof userId !== 'string' || userId.length === 0) {
      console.error('Invalid user ID in deleteImage:', userId);
      throw new Error('Invalid user ID');
    }

    try {
      // Extract the path from the download URL
      const urlPath = decodeURIComponent(url.split('/o/')[1].split('?')[0]);
      
      // Security check: Ensure the file belongs to the user
      if (!urlPath.includes(`users/${userId}/journal_attachments/`)) {
        throw new Error('Unauthorized access to file');
      }
      
      // Create a reference to the file
      const fileRef = ref(storage, urlPath);
      
      // Delete the file
      await deleteObject(fileRef);
      console.log('Deleted image attachment');
    } catch (error) {
      console.error('Error deleting image:', SecurityUtils.sanitizeForLog(String(error)));
      throw new Error('Failed to delete image');
    }
  }
}

export default new JournalAttachmentService();

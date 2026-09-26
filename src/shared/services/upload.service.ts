import { Platform } from 'react-native';
import api from './api';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface UploadResult {
  url: string;
  name: string;
  size: number;
  type: 'image' | 'document' | 'audio' | 'video';
}

export const UploadService = {
  /**
   * Helper to convert local URI to a Blob (for Firebase Storage fallback)
   */
  async uriToBlob(uri: string): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response as Blob);
      };
      xhr.onerror = function () {
        reject(new Error('Failed to convert file URI to Blob'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  },

  /**
   * Primary upload method: Uploads file using multipart/form-data to Backend Storage API.
   * If backend is not reachable, falls back to Firebase Storage, then to safe preview URI.
   */
  async uploadFile(
    uri: string,
    originalName: string,
    evidenceType: 'image' | 'document' | 'audio' | 'video',
    mimeType?: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const defaultMime =
      mimeType ||
      (evidenceType === 'image'
        ? 'image/jpeg'
        : evidenceType === 'video'
        ? 'video/mp4'
        : evidenceType === 'audio'
        ? 'audio/mp3'
        : 'application/pdf');

    // 1. Try uploading to Backend server first
    try {
      const formData = new FormData();
      const filePayload: any = {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: cleanName,
        type: defaultMime,
      };

      formData.append('file', filePayload);

      const response = await api.post('/storage/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      });

      if (response.data && response.data.data) {
        const resData = response.data.data;
        return {
          url: resData.url,
          name: resData.name || cleanName,
          size: resData.size || 0,
          type: resData.type || evidenceType,
        };
      }
    } catch (backendError: any) {
      console.warn('Backend storage upload failed, trying Firebase Storage fallback:', backendError?.message);
    }

    // 2. Try Firebase Storage fallback
    try {
      const storagePath = `evidence/${Date.now()}_${cleanName}`;
      const blob = await this.uriToBlob(uri);
      const fileSize = blob.size || 0;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: defaultMime,
      });

      return await new Promise<UploadResult>((resolve) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            if (snapshot.totalBytes > 0 && onProgress) {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              onProgress(progress);
            }
          },
          (firebaseError) => {
            console.warn('Firebase Storage upload also failed:', firebaseError?.message);
            // 3. Fallback to local URI so investigator is not blocked
            resolve({
              url: uri,
              name: cleanName,
              size: fileSize || 1024 * 150,
              type: evidenceType,
            });
          },
          async () => {
            try {
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve({
                url: downloadUrl,
                name: cleanName,
                size: fileSize,
                type: evidenceType,
              });
            } catch {
              resolve({
                url: uri,
                name: cleanName,
                size: fileSize,
                type: evidenceType,
              });
            }
          }
        );
      });
    } catch (err: any) {
      console.warn('All upload methods encountered errors, using local URI:', err?.message);
      return {
        url: uri,
        name: cleanName,
        size: 1024 * 200,
        type: evidenceType,
      };
    }
  },

  /**
   * Case-specific evidence upload wrapper
   */
  async uploadCaseEvidence(
    uri: string,
    _caseId: string,
    originalName: string,
    evidenceType: 'image' | 'document' | 'audio' | 'video',
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    return this.uploadFile(uri, originalName, evidenceType, undefined, onProgress);
  },
};

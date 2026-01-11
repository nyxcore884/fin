'use client';

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  StorageReference,
} from 'firebase/storage';
import { useStorage } from '@/firebase/provider';
import { useUser } from '@/firebase';

export const useUploadFile = () => {
  const storage = useStorage();
  const { user } = useUser();

  const uploadFile = (
    fileType: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    if (!user) {
      return Promise.reject('User not authenticated');
    }

    try {
      const fileRef: StorageReference = ref(
        storage,
        `${user.uid}/${fileType}/${file.name}`
      );
      const uploadTask = uploadBytesResumable(fileRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(Math.round(progress));
          },
          (error) => {
            console.error('Upload failed:', error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      return Promise.reject(error);
    }
  };

  return { uploadFile };
};

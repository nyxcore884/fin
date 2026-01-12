
export const verifyFirebaseConfig = () => {
  const requiredConfig = {
    'GCLOUD_STORAGE_BUCKET': process.env.GCLOUD_STORAGE_BUCKET,
    'GCP_PROJECT': process.env.GCP_PROJECT,
    'GEMINI_API_KEY': process.env.GEMINI_API_KEY
  };

  const missingConfig = Object.entries(requiredConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingConfig.length > 0) {
    throw new Error(`Missing configuration: ${missingConfig.join(', ')}`);
  }

  console.log('✅ All required configuration is present');
  return true;
};

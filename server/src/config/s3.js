// server/src/config/s3.js
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

// Test S3 connection
const testS3Connection = async () => {
  try {
    await s3.headBucket({ Bucket: process.env.AWS_S3_BUCKET_NAME }).promise();
    console.log('✅ S3 bucket connection successful');
  } catch (error) {
    console.error('❌ S3 connection failed:', error.message);
    
    // Create bucket if it doesn't exist
    if (error.statusCode === 404) {
      try {
        await s3.createBucket({ 
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          CreateBucketConfiguration: {
            LocationConstraint: process.env.AWS_REGION
          }
        }).promise();
        console.log('✅ S3 bucket created successfully');
      } catch (createError) {
        console.error('❌ Failed to create S3 bucket:', createError.message);
      }
    }
  }
};

module.exports = { s3, testS3Connection };

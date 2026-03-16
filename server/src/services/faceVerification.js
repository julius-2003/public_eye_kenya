/**
 * Face Verification Service
 * Handles face detection, storage, and verification
 */

import fs from 'fs';
import path from 'path';

/**
 * Store face descriptor for a user after face detection
 * This would typically receive a face descriptor array from the client
 * after face-api.js processes the image
 */
export const storeFaceDescriptor = async (user, faceDescriptorData, facePhotoUrl) => {
  try {
    // faceDescriptorData should be an array of 128 numbers from face-api.js
    if (!Array.isArray(faceDescriptorData) || faceDescriptorData.length !== 128) {
      throw new Error('Invalid face descriptor format. Expected array of 128 numbers.');
    }

    user.faceDescriptor = faceDescriptorData;
    user.facePhotoUrl = facePhotoUrl;
    await user.save();

    return {
      success: true,
      message: 'Face verified and stored successfully'
    };
  } catch (err) {
    return {
      success: false,
      message: err.message
    };
  }
};

/**
 * Calculate Euclidean distance between two face descriptors
 * Lower distance = more similar faces
 */
export const calculateFaceDistance = (descriptor1, descriptor2) => {
  if (!descriptor1 || !descriptor2 || descriptor1.length !== 128 || descriptor2.length !== 128) {
    return Infinity; // Invalid descriptors
  }

  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = descriptor1[i] - descriptor2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

/**
 * Verify if a new face matches the stored face descriptor
 * Threshold: 0.6 is typical for face-api.js (lower = more strict)
 */
export const verifyFaceMatch = (storedDescriptor, newDescriptor, threshold = 0.6) => {
  const distance = calculateFaceDistance(storedDescriptor, newDescriptor);
  const matches = distance < threshold;

  return {
    matches,
    distance,
    confidence: Math.max(0, 1 - (distance / threshold)), // 0-1 confidence score
    threshold
  };
};

/**
 * Check if user has a stored face descriptor
 */
export const hasStoredFace = (user) => {
  return user.faceDescriptor && user.faceDescriptor.length === 128;
};

/**
 * Get face verification status for admin review
 */
export const getFaceVerificationStatus = (user) => {
  return {
    hasFace: hasStoredFace(user),
    facePhotoUrl: user.facePhotoUrl || null,
    storedAt: user.facePhotoUrl ? new Date(user._id.getTimestamp()) : null // Estimate from _id
  };
};

/**
 * Calculate similarity score between two descriptors as percentage (0-100)
 * Returns confidence percentage and whether it meets the threshold
 */
export const calculateFaceSimilarity = (descriptor1, descriptor2) => {
  const distance = calculateFaceDistance(descriptor1, descriptor2);
  // Normalize distance to similarity percentage
  // Distance of 0 = 100% match, Distance of 1.0+ = 0% match
  const similarity = Math.max(0, 100 - (distance * 100));

  return {
    similarity: Math.round(similarity * 100) / 100, // Round to 2 decimal places
    distance: Math.round(distance * 1000) / 1000, // Round to 3 decimal places
    meetsThreshold: similarity >= 85 // 85% threshold for moderate confidence
  };
};

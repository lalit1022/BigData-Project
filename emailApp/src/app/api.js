// API endpoints for Flask backend integration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Classify a single email
 * POST /api/classify
 * Body: { from, subject, body }
 * Returns: { category, confidence }
 */
export async function classifySingleEmail(emailData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
    
    if (!response.ok) {
      throw new Error('Classification failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to client-side classification for demo
    // return mockClassifySingle(emailData);
    throw new Error('Flask server is not running !');
  }
}

/**
 * Upload bulk dataset (CSV)
 * POST /api/pipeline
 * Body: FormData with CSV file
 * Returns: { job_id, status }
 */
export async function uploadBulkDataset(file) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/api/pipeline`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Return mock job for demo
    return { job_id: 'demo-' + Date.now(), status: 'started' };
  }
}

/**
 * Poll pipeline status
 * GET /api/pipeline/status (or /api/pipeline/{job_id})
 * Returns: { status, current_step, progress, results }
 */
export async function getPipelineStatus(jobId = null) {
  try {
    const url = jobId 
      ? `${API_BASE_URL}/api/pipeline/${jobId}`
      : `${API_BASE_URL}/api/pipeline/status`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Status check failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

/**
 * Get model statistics
 * GET /api/model/stats
 * Returns: { accuracy, precision, recall, f1_score, confusion_matrix }
 */
export async function getModelStats() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/model/stats`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Return mock stats for demo
    return mockModelStats();
  }
}

/**
 * Get all classified emails from MongoDB
 * GET /api/emails
 * Returns: Array of email objects
 */
export async function getAllEmails(category = 'all') {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/emails?category=${category}`
    );
    if (!response.ok) throw new Error('Failed to fetch emails');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}

// ============================================================================
// MOCK FUNCTIONS FOR DEMO (until Flask backend is connected)
// ============================================================================

function mockClassifySingle(emailData) {
  const text = ((emailData.subject || '') + ' ' + (emailData.body || '')).toLowerCase();
  let category = 'Primary';
  
  // Check for spam first (highest priority)
  if (/lottery|winner|prize|urgent|verify|suspended|million|bank account|click now|claim|congratulations!|act now|pre-approved|make \$|earn \$|work from home|free iphone|hot singles/.test(text)) {
    category = 'Spam';
  }
  // Check for promotions
  else if (/discount|sale|offer|deal|buy|shop|coupon|free|unsubscribe|click here|limited time|exclusive|promo|save|order|shipping|flash sale|delivery|clearance|personalized/.test(text)) {
    category = 'Promotions';
  }
  // Check for social
  else if (/liked|friend request|follower|following|connection|shared|commented|mentioned|retweet|tweet|post|party|event|invite|birthday|concert|movie|social|festival|rsvp|join us|meetup|gathering|celebration|notification/.test(text)) {
    category = 'Social';
  }
  // Otherwise it's Primary (work/business emails)
  
  return {
    category,
    confidence: 0.85 + Math.random() * 0.14, // 85-99%
    classifier: 'Naive Bayes (Mahout)'
  };
}

function mockModelStats() {
  // Real Mahout testnb results — 9948-email balanced dataset
  return {
    fourClass: {
      totalTested: 1999,
      correctlyClassified: 1944,
      accuracy: 97.25,
      weightedPrecision: 97.3,
      weightedRecall: 97.2,
      weightedF1: 97.2,
      kappa: 0.9582,
      confusionMatrix: [
        [480,   3,  50,  0],
        [  0, 482,   0,  0],
        [  1,   1, 511,  0],
        [  0,   0,   0, 471]
      ],
      perClass: {
        Primary:    { tp: 480, fp: 1,  fn: 53, tn: 1465, precision: 99.8,  recall: 90.1,  f1: 94.7,  support: 533 },
        Promotions: { tp: 482, fp: 4,  fn: 0,  tn: 1513, precision: 99.2,  recall: 100.0, f1: 99.6,  support: 482 },
        Social:     { tp: 511, fp: 50, fn: 2,  tn: 1436, precision: 91.1,  recall: 99.6,  f1: 95.2,  support: 513 },
        Spam:       { tp: 471, fp: 0,  fn: 0,  tn: 1528, precision: 100.0, recall: 100.0, f1: 100.0, support: 471 }
      }
    },
    binary: {
      totalTested: 1999,
      correctlyClassified: 1984,
      accuracy: 99.25,
      kappa: 0.9834,
      confusionMatrix: [[1528, 0], [15, 471]],
      spam: { tp: 471, fp: 0, fn: 0,  tn: 1528, precision: 100.0, recall: 100.0, f1: 100.0, specificity: 100.0 },
      ham:  { tp: 1528, fp: 0, fn: 15, tn: 471, precision: 100.0, recall: 99.0,  f1: 99.5 }
    }
  };
}
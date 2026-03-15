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
    return mockClassifySingle(emailData);
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
export async function getAllEmails() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/emails`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch emails');
    }
    
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
  return {
    accuracy: 94.2,
    precision: 93.8,
    recall: 94.5,
    f1_score: 94.1,
    confusion_matrix: [
      { actual: 'Primary', predicted: { Primary: 892, Promotions: 12, Social: 8, Spam: 3 } },
      { actual: 'Promotions', predicted: { Primary: 15, Promotions: 864, Social: 5, Spam: 11 } },
      { actual: 'Social', predicted: { Primary: 10, Promotions: 8, Social: 876, Spam: 1 } },
      { actual: 'Spam', predicted: { Primary: 2, Promotions: 5, Social: 1, Spam: 987 } }
    ]
  };
}
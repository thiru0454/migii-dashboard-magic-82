// Function to get the next sequence number from localStorage
const getNextSequenceNumber = (): string => {
  const currentDate = new Date();
  const dateKey = currentDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  
  // Get the current sequence from localStorage
  const sequences = JSON.parse(localStorage.getItem('workerSequences') || '{}');
  const currentSequence = sequences[dateKey] || 0;
  
  // Increment the sequence
  const nextSequence = currentSequence + 1;
  
  // Save the new sequence
  sequences[dateKey] = nextSequence;
  localStorage.setItem('workerSequences', JSON.stringify(sequences));
  
  // Format the sequence number with leading zeros
  return nextSequence.toString().padStart(5, '0');
};

// Generate a unique worker ID in the format TN-DATE-XXXXX
export const generateWorkerId = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0].replace(/-/g, ''); // Format: YYYYMMDD
  const sequence = getNextSequenceNumber();
  
  return `TN-${dateStr}-${sequence}`;
}; 
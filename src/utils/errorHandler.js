// Error handling utilities

export const getErrorMessage = (error) => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

export const handleApiError = (error) => {
  const message = getErrorMessage(error);
  
  // Log error for debugging
  console.error('API Error:', error);
  
  // Handle specific error types
  if (message.includes('Network Error') || message.includes('fetch')) {
    return 'Unable to connect to server. Please check your internet connection.';
  }
  
  if (message.includes('401') || message.includes('Unauthorized')) {
    return 'Your session has expired. Please log in again.';
  }
  
  if (message.includes('403') || message.includes('Forbidden')) {
    return 'You do not have permission to perform this action.';
  }
  
  if (message.includes('404') || message.includes('Not Found')) {
    return 'The requested resource was not found.';
  }
  
  if (message.includes('500') || message.includes('Internal Server Error')) {
    return 'Server error. Please try again later.';
  }
  
  return message;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
  } else {
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
  }
  
  return errors;
};

export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = formData[field];
    const fieldRules = rules[field];
    
    if (fieldRules.required && (!value || value.trim() === '')) {
      errors[field] = `${fieldRules.label || field} is required`;
      return;
    }
    
    if (value && fieldRules.email && !validateEmail(value)) {
      errors[field] = 'Please enter a valid email address';
      return;
    }
    
    if (value && fieldRules.password) {
      const passwordErrors = validatePassword(value);
      if (passwordErrors.length > 0) {
        errors[field] = passwordErrors[0]; // Show first error
        return;
      }
    }
    
    if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `${fieldRules.label || field} must be at least ${fieldRules.minLength} characters`;
      return;
    }
    
    if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `${fieldRules.label || field} must be no more than ${fieldRules.maxLength} characters`;
      return;
    }
  });
  
  return errors;
};

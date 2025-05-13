exports.validatePassword = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()]/.test(password);

  if (password.length < minLength) {
    return 'Password must be at least 8 characters long.';
  }
  if (!hasUppercase) {
    return 'Password must contain at least one uppercase letter.';
  }
  if (!hasLowercase) {
    return 'Password must contain at least one lowercase letter.';
  }
  if (!hasNumber) {
    return 'Password must contain at least one number.';
  }
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character ()!@#$%^&*.';
  }
  return null; // No error
};

// Phone Number Validator
exports.validatePhoneNumber = (phoneNumber) => {
  const minLength = 8; // Minimum length for a valid phone number
  const numericRegex = /^[0-9]+$/; // Only digits allowed

  if (!phoneNumber) {
    return 'Phone number is required.';
  }
  if (phoneNumber.length < minLength) {
    return `Phone number must be at least ${minLength} digits long.`;
  }
  if (!numericRegex.test(phoneNumber)) {
    return 'Phone number must contain only numeric characters.';
  }
  if (/^0+$/.test(phoneNumber)) {
    return 'Phone number cannot be all zeros.';
  }
  return null; // No error
};

// First Name Validator
exports.validateFirstName = (firstName) => {
  const nameRegex = /^[A-Za-z\s'-]+$/; // Allows letters, spaces, hyphens, and apostrophes

  if (!firstName) {
    return 'First name is required.';
  }
  if (!nameRegex.test(firstName)) {
    return 'First name must contain only letters, spaces, hyphens, or apostrophes.';
  }
  if (firstName.length < 3) {
    return 'First name cannot be less than three characters long.';
  }
  return null; // No error
};

// Last Name Validator
exports.validateLastName = (lastName) => {
  const nameRegex = /^[A-Za-z\s'-]+$/; // Allows letters, spaces, hyphens, and apostrophes

  if (!lastName) {
    return 'Last name is required.';
  }
  if (!nameRegex.test(lastName)) {
    return 'Last name must contain only letters, spaces, hyphens, or apostrophes.';
  }
  if (lastName.length < 3) {
    return 'Last name cannot be less than  three characters long.';
  }
  return null; // No error
};


// Combined Validator (Optional)
exports.validateUserInput = (userData) => {
  const { firstName, lastName, phoneNumber} = userData;

  // Validate first name
  const firstNameError = exports.validateFirstName(firstName);
  if (firstNameError) return firstNameError;

  // Validate last name
  const lastNameError = exports.validateLastName(lastName);
  if (lastNameError) return lastNameError;

  // Validate phone number
  const phoneNumberError = exports.validatePhoneNumber(phoneNumber);
  if (phoneNumberError) return phoneNumberError;

  return null; // No errors
};








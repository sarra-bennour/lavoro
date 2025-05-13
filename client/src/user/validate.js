
export const validatePhoneNumber = (phoneNumber) => {
    const minLength = 8;
    const numericRegex = /^[0-9]+$/;
  
    if (!phoneNumber) return 'Phone number is required.';
    if (!numericRegex.test(phoneNumber)) return 'Phone number must contain only numeric characters.';
    if (phoneNumber.length < minLength) return `Phone number must be at least ${minLength} digits long.`;
    if (/^0+$/.test(phoneNumber)) return 'Phone number cannot be all zeros.';
    return null;
  };
  

  export const validateFirstName = (firstName) => {
    const nameRegex = /^[A-Za-z\s'-]+$/;
    if (!firstName) return 'First name is required.';
    if (!nameRegex.test(firstName)) return 'First name must contain only letters, spaces, hyphens, or apostrophes.';
    if (firstName.length < 3) return 'First name cannot be less than three characters long.';
    return null;
  };
  

  export const validateLastName = (lastName) => {
    const nameRegex = /^[A-Za-z\s'-]+$/;
    if (!lastName) return 'Last name is required.';
    if (!nameRegex.test(lastName)) return 'Last name must contain only letters, spaces, hyphens, or apostrophes.';
    if (lastName.length < 3) return 'Last name cannot be less than three characters long.';
    return null;
  };


export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required.';
    if (!emailRegex.test(email)) 
        return 'Email is not valid. It must be in the format a@b.c';  

};
  
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Swal from "sweetalert2";

const UpdateProfile = () => {
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState([]);
  const [skillsInputValue, setSkillsInputValue] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [imageSrc, setImageSrc] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [crop, setCrop] = useState({ aspect: 1 / 1 });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    firstName: null,
    lastName: null,
    phoneNumber: null,
    email: null,
    description: null,
    skills: null
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const imgRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error("No token found");
        }

        const response = await axios.get("https://lavoro-back.onrender.com/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });

        if (response.data) {
          console.log("Raw user data from API:", response.data); // Debug raw data
          setUser(response.data);
          setFirstName(response.data.firstName);
          setLastName(response.data.lastName);
          setPhoneNumber(response.data.phone_number);
          setDescription(response.data.description || "");

          // Handle skills: robust parsing for all backend cases
          let fetchedSkills = response.data.skills;
          console.log("Raw skills from API:", fetchedSkills); // Debug raw skills

          if (Array.isArray(fetchedSkills) && fetchedSkills.length === 1 && typeof fetchedSkills[0] === 'string') {
            const first = fetchedSkills[0].trim();
            if (first.startsWith('[') && first.endsWith(']')) {
              try {
                fetchedSkills = JSON.parse(first);
              } catch (e) {
                fetchedSkills = [];
              }
            } else {
              fetchedSkills = first.split(',').map(s => s.trim()).filter(Boolean);
            }
          } else if (typeof fetchedSkills === 'string') {
            const trimmed = fetchedSkills.trim();
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
              try {
                fetchedSkills = JSON.parse(trimmed);
              } catch (e) {
                fetchedSkills = [];
              }
            } else {
              fetchedSkills = trimmed.split(',').map(s => s.trim()).filter(Boolean);
            }
          } else if (!Array.isArray(fetchedSkills)) {
            fetchedSkills = [];
          }
          fetchedSkills = Array.isArray(fetchedSkills) ? fetchedSkills : [];
          console.log("Fetched skills (after robust parsing):", fetchedSkills); // Debug parsed skills
          setSkills(fetchedSkills);
          setSkillsInputValue(fetchedSkills.join(',')); // Set input display value
          setProfileImage(response.data.image);
        } else {
          navigate("/auth");
        }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate("/auth");
        } else {
          console.error("Error fetching user info:", err);
        }
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const validateField = (fieldName, value) => {
    let error = null;

    if (fieldName === 'firstName') {
      if (!value) error = 'First name is required.';
      else if (!/^[A-Za-z\s'-]+$/.test(value)) error = 'First name must contain only letters, spaces, hyphens, or apostrophes.';
      else if (value.length < 3) error = 'First name cannot be less than three characters long.';
    } 
    else if (fieldName === 'lastName') {
      if (!value) error = 'Last name is required.';
      else if (!/^[A-Za-z\s'-]+$/.test(value)) error = 'Last name must contain only letters, spaces, hyphens, or apostrophes.';
      else if (value.length < 3) error = 'Last name cannot be less than three characters long.';
    }
    else if (fieldName === 'phoneNumber') {
      if (!value) error = 'Phone number is required.';
      else if (value.length < 8) error = 'Phone number must be at least 8 digits long.';
      else if (!/^[0-9]+$/.test(value)) error = 'Phone number must contain only numeric characters.';
      else if (/^0+$/.test(value)) error = 'Phone number cannot be all zeros.';
    }
    else if (fieldName === 'email') {
      if (!value) error = 'Email is required.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Please enter a valid email address.';
    }
    else if (fieldName === 'description') {
      if (value.length > 500) error = 'Description cannot exceed 500 characters.';
    }
    else if (fieldName === 'skills') {
      if (value.some(skill => skill.length < 2)) error = 'Each skill must be at least 2 characters long.';
      else if (value.some(skill => !/^[A-Za-z\s-]+$/.test(skill))) error = 'Skills must contain only letters, spaces, or hyphens.';
    }

    setErrors(prev => ({ ...prev, [fieldName]: error }));
    return !error;
  };

  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    setFirstName(value);
    validateField('firstName', value);
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value;
    setLastName(value);
    validateField('lastName', value);
  };

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
    validateField('phoneNumber', value);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setUser(prev => ({ ...prev, email: value }));
    validateField('email', value);
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    validateField('description', value);

    // Define a list of known skills (could be expanded or loaded from elsewhere)
    const knownSkills = [
      'javascript', 'nodejs', 'node', 'react', 'express', 'expressjs', 'docker', 'flutter', 'python', 'java', 'c++', 'c#', 'php', 'html', 'css', 'mongodb', 'sql', 'typescript', 'angular', 'vue', 'django', 'spring', 'swift', 'kotlin', 'go', 'rust', 'aws', 'azure', 'gcp', 'firebase', 'graphql', 'redux', 'sass', 'less', 'bootstrap', 'tailwind', 'git', 'github', 'jira', 'linux', 'bash', 'shell', 'matlab', 'r', 'scala', 'perl', 'ruby', 'laravel', 'symfony', 'dotnet', 'android', 'ios', 'xamarin', 'ionic', 'cordova', 'unity', 'unreal', 'threejs', 'nextjs', 'nestjs', 'fastify', 'hapi', 'mocha', 'jest', 'chai', 'enzyme', 'testing-library', 'cypress', 'puppeteer', 'storybook', 
      'CI/CD','DevOps', 'Nexus', 'Jenkins', 'JUnit', 'SonarQube', 'GitHubAction'
    ];

    // Combine with current skills (case-insensitive)
    const currentSkills = Array.isArray(skills) ? skills : [];
    const lowerSkills = currentSkills.map(s => s.toLowerCase());

    // Normalize description: remove punctuation, lowercase, and split into words
    const normalizedDesc = value
      .replace(/[.,\/#!$%^&*;:{}=\-_`~()\[\]"]/g, ' ')
      .toLowerCase();
    const descWords = normalizedDesc.split(/\s+/).filter(Boolean);

    // Find new skills in the description (case-insensitive, punctuation-insensitive)
    const foundSkills = knownSkills.filter(skill => {
      const normalizedSkill = skill.toLowerCase();
      return descWords.includes(normalizedSkill) && !lowerSkills.includes(normalizedSkill);
    });

    if (foundSkills.length > 0) {
      const newSkills = [...currentSkills, ...foundSkills];
      setSkills(newSkills);
      setSkillsInputValue(newSkills.join(','));
      validateField('skills', newSkills);
    }
  };

  const handleSkillsChange = (e) => {
    const value = e.target.value;
    setSkillsInputValue(value);
    const newSkills = value.split(',').map(skill => skill.trim()).filter(skill => skill);
    console.log("Updated skills:", newSkills);
    setSkills(newSkills);
    validateField('skills', newSkills);
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    console.log("Skills after removal:", updatedSkills);
    setSkills(updatedSkills);
    setSkillsInputValue(updatedSkills.join(','));
    validateField('skills', updatedSkills);
  };

  const handleRestoreChanges = () => {
    // Also robustly parse skills when restoring changes
    let restoredSkills = user.skills;
    if (Array.isArray(restoredSkills) && restoredSkills.length === 1 && typeof restoredSkills[0] === 'string') {
      const first = restoredSkills[0].trim();
      if (first.startsWith('[') && first.endsWith(']')) {
        try {
          restoredSkills = JSON.parse(first);
        } catch (e) {
          restoredSkills = [];
        }
      } else {
        restoredSkills = first.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (typeof restoredSkills === 'string') {
      const trimmed = restoredSkills.trim();
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          restoredSkills = JSON.parse(trimmed);
        } catch (e) {
          restoredSkills = [];
        }
      } else {
        restoredSkills = trimmed.split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (!Array.isArray(restoredSkills)) {
      restoredSkills = [];
    }
    restoredSkills = Array.isArray(restoredSkills) ? restoredSkills : [];

    Swal.fire({
      title: "Restore Changes?",
      text: "Are you sure you want to discard all changes?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, restore!",
      cancelButtonText: "Cancel"
    }).then((result) => {
      if (result.isConfirmed) {
        setFirstName(user.firstName);
        setLastName(user.lastName);
        setPhoneNumber(user.phone_number);
        setDescription(user.description || "");
        const restoredSkills = Array.isArray(user.skills) ? user.skills : [];
        setSkills(restoredSkills);
        setSkillsInputValue(restoredSkills.join(','));
        setProfileImage(user.image);
        setImageSrc(null);
        setCroppedImage(null);
        setErrors({
          firstName: null,
          lastName: null,
          phoneNumber: null,
          email: null,
          description: null,
          skills: null
        });
        
        Swal.fire({
          title: "Restored!",
          text: "All changes have been discarded.",
          icon: "success"
        });
      }
    });
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No token found");
      }
  
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });
  
      if (result.isConfirmed) {
        const response = await axios.post(
          "https://lavoro-back.onrender.com/profiles/request-delete",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
  
        if (response.status === 200) {
          await Swal.fire({
            title: "Deleted!",
            text: "Profile delete request successful!",
            icon: "success",
          });
          window.location.reload();
        }
      }
    } catch (err) {
      if (err.response?.status === 400) {
        await Swal.fire({
          title: "Error",
          text: "You already sent a deletion request.",
          icon: "error",
        });
        window.location.reload();
      } else if (err.response?.status === 401) {
        await Swal.fire({
          title: "Session Expired",
          text: "Please log in again.",
          icon: "error",
        });
        localStorage.removeItem('token');
        navigate("/auth");
      } else {
        console.error("Error deleting profile:", err);
        await Swal.fire({
          title: "Error",
          text: "Failed to delete profile.",
          icon: "error",
        });
      }
    }
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Error accessing camera:", err);
      Swal.fire({
        title: "Error",
        text: "Could not access camera. Please check permissions.",
        icon: "error"
      });
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/png");
    setImageSrc(imageData);
    setShowCameraModal(false);
    setShowCropModal(true);
  };

  const previewImage = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (crop) => {
    if (imgRef.current && crop.width && crop.height) {
      const croppedImageUrl = getCroppedImg(imgRef.current, crop);
      setCroppedImage(croppedImageUrl);
    }
  };

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return canvas.toDataURL("image/png");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isFirstNameValid = validateField('firstName', firstName);
    const isLastNameValid = validateField('lastName', lastName);
    const isPhoneNumberValid = validateField('phoneNumber', phoneNumber);
    const isEmailValid = validateField('email', user.email);
    const isDescriptionValid = validateField('description', description);
    const isSkillsValid = validateField('skills', skills);
    
    if (!isFirstNameValid || !isLastNameValid || !isPhoneNumberValid || !isEmailValid || !isDescriptionValid || !isSkillsValid) {
      await Swal.fire({
        title: "Validation Error",
        text: "Please fix the errors in the form before submitting.",
        icon: "error",
      });
      return;
    }
    
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      alert("No token found. Please log in again.");
      navigate("/auth");
      return;
    }

    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("phoneNumber", phoneNumber);
    formData.append("email", user.email);
    formData.append("description", description);
    formData.append("skills", JSON.stringify(skills));

    if (croppedImage) {
      const blob = await fetch(croppedImage).then((res) => res.blob());
      formData.append("image", blob, "profile.png");
    } else if (profileImage) {
      formData.append("image", profileImage);
    }

    try {
      const response = await axios.post("https://lavoro-back.onrender.com/profiles/update", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      if (response.status === 200) {
        await Swal.fire({
          title: "Updated!",
          text: "Profile updated successfully!",
          icon: "success",
        });
        window.location.reload();
      }
    } catch (err) {
      if (err.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem('token');
        navigate("/auth");
      } else {
        console.error("Error updating profile:", err);
        await Swal.fire({
          title: "Error",
          text: "Failed updating profile!",
          icon: "error",
        });
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <p>Loading...</p>;
  }

  // Define a palette of soft colors to cycle through
  const colorPalette = [
    "#f0f4c3", // Light lime
    "#c8e6c9", // Light green
    "#b3e5fc", // Light blue
    "#ffccbc", // Light peach
    "#d1c4e9", // Light purple
    "#ffe082", // Light amber
    "#c5cae9", // Light indigo
    "#b2dfdb", // Light teal
  ];

  // Function to get a color based on the skill's index
  const getSkillColor = (index) => {
    return colorPalette[index % colorPalette.length];
  };

  console.log("Skills state before render:", skills);
  console.log("Skills input value before render:", skillsInputValue);

  return (
    <div className="row gap-3 justify-content-center">
      <div className="p-3 border-bottom border-top border-block-end-dashed tab-content">
        <div className="tab-pane show active overflow-hidden p-0 border-0" id="account-pane" role="tabpanel" aria-labelledby="account" tabIndex="0">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-1">
            <div className="fw-semibold d-block fs-15">Account Settings :</div>
            <div 
              className="btn btn-primary btn-sm" 
              onClick={handleRestoreChanges}
            >
              <i className="ri-loop-left-line lh-1 me-2"></i>Restore Changes
            </div>
          </div>
          <div className="row gy-3">
            <div className="col-xl-12">
              <div className="d-flex align-items-start flex-wrap gap-3">
                <div>
                  <span className="avatar avatar-xxl" style={{ marginLeft: "10px" }}>
                    {profileImage ? (
                     <img
                     src={
                       profileImage
                         ? profileImage.startsWith('data:image') 
                           ? profileImage
                           : profileImage.startsWith('http') || profileImage.startsWith('https')
                             ? profileImage
                             : `https://lavoro-back.onrender.com${profileImage}`
                         : "https://via.placeholder.com/100"
                     }
                     alt="Profile"
                     style={{
                       width: "100px",
                       height: "100px",
                       borderRadius: "50%",
                       objectFit: "cover",
                       marginBottom: "10px"
                     }}
                     onError={(e) => {
                       e.target.src = "https://via.placeholder.com/100";
                     }}
                   />
                    ) : (
                      <p>No profile image uploaded.</p>
                    )}
                  </span>
                </div>
                <div>
                  <span className="fw-medium d-block mb-2">Profile Picture</span>
                  <div className="btn-list mb-1">
                    <button 
                      className="btn btn-sm btn-primary btn-wave" 
                      data-bs-toggle="modal" 
                      data-bs-target="#imageSourceModal"
                    >
                      <i className="ri-upload-2-line me-1"></i>Change Image
                    </button>
                    <button 
                      className="btn btn-sm btn-primary1-light btn-wave" 
                      onClick={() => setProfileImage("")}
                    >
                      <i className="ri-delete-bin-line me-1"></i>Remove
                    </button>
                  </div>
                  <span className="d-block fs-12 text-muted">Use JPEG, PNG, or GIF. Best size: 200x200 pixels. Keep it under 5MB</span>
                </div>
              </div>
            </div>
            <div className="col-xl-12">
              <label htmlFor="profile-user-name" className="form-label">First Name :</label>
              <input
                type="text"
                className={`form-control ${errors.firstName ? 'is-invalid' : ''}`}
                id="profile-user-name"
                value={firstName}
                onChange={handleFirstNameChange}
                placeholder="Enter First Name"
              />
              {errors.firstName && (
                <div className="invalid-feedback d-block">{errors.firstName}</div>
              )}
            </div>
            <div className="col-xl-12">
              <label htmlFor="profile-last-name" className="form-label">Last Name :</label>
              <input
                type="text"
                className={`form-control ${errors.lastName ? 'is-invalid' : ''}`}
                id="profile-last-name"
                value={lastName}
                onChange={handleLastNameChange}
                placeholder="Enter Last Name"
              />
              {errors.lastName && (
                <div className="invalid-feedback d-block">{errors.lastName}</div>
              )}
            </div>
            <div className="col-xl-12">
              <label htmlFor="profile-phone-number" className="form-label">Phone Number :</label>
              <input
                type="text"
                className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`}
                id="profile-phone-number"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                placeholder="Enter Phone Number"
              />
              {errors.phoneNumber && (
                <div className="invalid-feedback d-block">{errors.phoneNumber}</div>
              )}
            </div>
            <div className="col-xl-12">
              <label htmlFor="profile-email" className="form-label">Email :</label>
              <input
                type="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                id="profile-email"
                value={user.email}
                onChange={handleEmailChange}
                placeholder="Enter Email"
              />
              {errors.email && (
                <div className="invalid-feedback d-block">{errors.email}</div>
              )}
            </div>
            <div className="col-xl-12">
              <label htmlFor="profile-description" className="form-label">Description :</label>
              <textarea
                className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                id="profile-description"
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Enter a brief description about yourself"
                rows="3"
              />
              {errors.description && (
                <div className="invalid-feedback d-block">{errors.description}</div>
              )}
            </div>
            <div className="col-xl-12">
              <label htmlFor="profile-skills" className="form-label">Skills (comma-separated) :</label>
              <input
                type="text"
                className={`form-control ${errors.skills ? 'is-invalid' : ''}`}
                id="profile-skills"
                value={skillsInputValue}
                onChange={handleSkillsChange}
                placeholder="Enter skills (e.g., JavaScript,Node.js,MongoDB)"
              />
              {errors.skills && (
                <div className="invalid-feedback d-block">{errors.skills}</div>
              )}
              <div className="mt-2 d-flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    style={{
                      backgroundColor: getSkillColor(index),
                      color: "#333",
                      padding: "5px 10px",
                      borderRadius: "15px",
                      display: "inline-flex",
                      alignItems: "center",
                      fontSize: "14px",
                      margin: "5px 0"
                    }}
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      style={{
                        marginLeft: "8px",
                        background: "none",
                        border: "none",
                        color: "#e74c3c",
                        cursor: "pointer",
                        fontSize: "12px",
                        lineHeight: "1"
                      }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card-footer border-top-0">
        <div className="btn-list float-end">
          <button className="btn btn-primary2 btn-wave" id="alert-confirm" onClick={handleDeleteAccount}>
            Deactivate Account
          </button>
          <button className="btn btn-primary btn-wave" onClick={handleSubmit} disabled={loading}>
            {loading ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Image Source Selection Modal */}
      <div className="modal fade" id="imageSourceModal" tabIndex="-1" aria-labelledby="imageSourceModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="imageSourceModalLabel">Choose Image Source</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="d-grid gap-2">
                <button 
                  type="button" 
                  className="btn btn-primary"
                  data-bs-dismiss="modal"
                  onClick={() => {
                    setShowCameraModal(true);
                    openCamera();
                  }}
                >
                  <i className="ri-camera-line me-2"></i>Capture Image
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current.click()}
                >
                  <i className="ri-upload-line me-2"></i>Upload Image from PC
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      {showCameraModal && (
        <div className="modal fade show d-block" id="cameraModal" tabIndex="-1" aria-labelledby="cameraModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="cameraModalLabel">Capture Photo</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowCameraModal(false);
                    const stream = videoRef.current?.srcObject;
                    if (stream) {
                      stream.getTracks().forEach(track => track.stop());
                    }
                  }}
                ></button>
              </div>
              <div className="modal-body text-center">
                <video ref={videoRef} width="100%" autoPlay></video>
                <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={capturePhoto}
                >
                  Capture
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCameraModal(false);
                    const stream = videoRef.current?.srcObject;
                    if (stream) {
                      stream.getTracks().forEach(track => track.stop());
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {showCropModal && (
        <div className="modal fade show d-block" id="cropModal" tabIndex="-1" aria-labelledby="cropModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="cropModalLabel">Crop Image</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCropModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <ReactCrop
                  src={imageSrc}
                  crop={crop}
                  onChange={(newCrop) => setCrop(newCrop)}
                  onComplete={onCropComplete}
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Crop me"
                    style={{ maxWidth: "100%", maxHeight: "500px", height: "auto", width: "auto" }}
                  />
                </ReactCrop>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setProfileImage(croppedImage || imageSrc);
                    setShowCropModal(false);
                  }}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCropModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={previewImage}
      />
    </div>
  );
};

export default UpdateProfile;
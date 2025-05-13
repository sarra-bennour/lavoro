import { useEffect, useState, useRef } from "react"
import { FaCamera, FaEye, FaEyeSlash } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import GoogleLogin from "./GoogleLogin"
import { validatePhoneNumber, validateFirstName, validateLastName, validateEmail } from "./validate"
import MicrosoftLogin from "./MicrosoftLogin"
import GitHubLogin from "./GitHubLogin"
import Recaptcha from "./Recaptcha"
import Switcher from "../partials/switcher"
import Swal from "sweetalert2";
import "../../public/assets/libs/sweetalert2/sweetalert2.min.css";

// Add these styles at the top of your component
const cupStyles = {
  container: {
    display: "flex",
    alignItems: "center",
    marginTop: "2px",
    marginBottom: "10px",
  },
  cup: {
    position: "relative",
    width: "20px",
    height: "20px",
    borderRadius: "0 0 20px 20px",
    border: "3px solid #333",
    marginRight: "10px",
    overflow: "hidden",
  },
  handle: {
    position: "absolute",
    right: "-15px",
    top: "10px",
    width: "15px",
    height: "20px",
    borderRadius: "0 10px 10px 0",
    border: "3px solid #333",
    borderLeft: "none",
  },
  water: {
    position: "absolute",
    bottom: "0",
    left: "0",
    width: "100%",
    transition: "all 0.5s ease",
  },
  requirements: {
    flex: "1",
  },
}

const Errorstyle = {
  color: "#ff6b6b",
  fontSize: "12px",
  marginTop: "5px",
  width: "100%",
  textAlign: "left",
}

const Suceessstyle = {
  color: "#4CAF50",
  fontSize: "12px",
  marginTop: "5px",
  width: "100%",
  textAlign: "left",
}

function SignUp() {
  const [firstName, setFirst] = useState("")
  const [lastName, setLast] = useState("")
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [emailAvailable, setEmailAvailable] = useState(null)
  const [password, setPassword] = useState("")
  const [phoneNumber, setPhone] = useState("")
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [error, setError] = useState("")
  const [showRequirements, setShowRequirements] = useState(false)
  const [passwordSuggestions, setPasswordSuggestions] = useState([])
  const [showPassword, setShowPassword] = useState(false)
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [fieldErrors, setFieldErrors] = useState({
    firstNameError: "",
    lastNameError: "",
    phoneError: "",
  })
  const [isTypingManually, setIsTypingManually] = useState(false)

  const fileInputRef = useRef(null)
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false)
  const recaptchaRef = useRef(null)

  const navigate = useNavigate()

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = localStorage.getItem("token")
        if (token) {
          const response = await axios.get("https://lavoro-back.onrender.com/users/me", {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          })
          if (response.data) {
            navigate("/profile") // Redirect to profile if already authenticated
          }
        }
      } catch (err) {
        console.error("Error checking authentication:", err)
      }
    }

    checkAuthentication()
  }, [navigate])

  const handleRecaptchaChange = (value) => {
    setIsRecaptchaVerified(!!value)
  }

  const handleRecaptchaExpired = () => {
    setIsRecaptchaVerified(false)
  }

  const passwordRequirements = [
    { text: "At least one uppercase letter", regex: /[A-Z]/ },
    { text: "At least one lowercase letter", regex: /[a-z]/ },
    { text: "At least one number", regex: /[0-9]/ },
    { text: "At least one special character", regex: /[!@#$%^&*(),.?":{}|<>]/ },
    { text: "At least 8 characters", regex: /.{8,}/ },
  ]

  const [visibleRequirements, setVisibleRequirements] = useState(passwordRequirements)

  const generatePassword = () => {
    const uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const lowercaseChars = "abcdefghijklmnopqrstuvwxyz"
    const numberChars = "0123456789"
    const specialChars = "!@#$%^&*()"

    const randomUppercase = uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)]
    const randomLowercase = lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)]
    const randomNumber = numberChars[Math.floor(Math.random() * numberChars.length)]
    const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)]

    const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars
    let remainingChars = ""
    for (let i = 0; i < 4; i++) {
      remainingChars += allChars[Math.floor(Math.random() * allChars.length)]
    }

    let suggestedPassword = randomUppercase + randomLowercase + randomNumber + randomSpecial + remainingChars
    suggestedPassword = suggestedPassword
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("")

    return suggestedPassword
  }

  const generatePasswordSuggestions = () => {
    const suggestions = [generatePassword()]
    setPasswordSuggestions(suggestions)
  }

  const handlePasswordSuggestionClick = (suggestedPassword) => {
    setPassword(suggestedPassword)
    setVisibleRequirements(passwordRequirements.filter((req) => !req.regex.test(suggestedPassword)))
    setIsTypingManually(false) // Reset the manual typing flag
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handlePasswordChange = (e) => {
    const input = e.target.value
    setPassword(input)
    setIsTypingManually(true) // User is typing manually
  }

  const handleFirstNameChange = (e) => {
    const value = e.target.value
    setFirst(value)
    setFieldErrors((prev) => ({ ...prev, firstNameError: validateFirstName(value) }))
  }

  const handleLastNameChange = (e) => {
    const value = e.target.value
    setLast(value)
    setFieldErrors((prev) => ({ ...prev, lastNameError: validateLastName(value) }))
  }

  const handlePhoneNumberChange = (e) => {
    const value = e.target.value
    setPhone(value)
    setFieldErrors((prev) => ({ ...prev, phoneError: validatePhoneNumber(value) }))
  }

  const checkEmailAvailability = async (email) => {
    if (!email) {
      setEmailAvailable(null)
      return
    }
    try {
      const response = await axios.get(`https://lavoro-back.onrender.com/users/check-email?email=${email}`)
      setEmailAvailable(!response.data.exists)
    } catch (error) {
      console.error("Error checking email availability:", error)
      setEmailAvailable(null)
    }
  }

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)

    const validationError = validateEmail(value)
    setEmailError(validationError)

    if (!validationError) {
      checkEmailAvailability(value)
    } else {
      setEmailAvailable(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const emailValidationError = validateEmail(email)
    setEmailError(emailValidationError)

    if (emailValidationError || !emailAvailable) {
      setError("Please enter a valid and available email.")
      return
    }

    const firstNameError = validateFirstName(firstName)
    const lastNameError = validateLastName(lastName)
    const phoneError = validatePhoneNumber(phoneNumber)

    if (firstNameError || lastNameError || phoneError) {
      setFieldErrors({
        firstNameError,
        lastNameError,
        phoneError,
      })
      return
    }

    const formData = new FormData()
    formData.append("firstName", firstName)
    formData.append("lastName", lastName)
    formData.append("email", email)
    formData.append("password", password)
    formData.append("phone_number", phoneNumber)
    if (image) formData.append("image", image)

    try {
      const response = await axios.post("https://lavoro-back.onrender.com/users/signup", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      })

      if (response.data.message) {
        Swal.fire({
          title: "Success!",
          text: "User registered successfully! Please check your email for verification.",
          icon: "success",
          confirmButtonText: "OK",
        })
      } else {
        throw new Error("No message received from server")
      }
    } catch (err) {
      console.error("Signup Error:", err)
      setError(err.response?.data?.error || "An error occurred during signup. Please try again.")
      Swal.fire({
        title: "Error!",
        text: err.response?.data?.error || "An error occurred during signup. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  }

 

  const PasswordStrengthCup = ({ password, requirements }) => {
    // Find the first unmet requirement
    const firstUnmetRequirement = requirements.find((req) => !req.regex.test(password))

    // Count how many requirements are met
    const metRequirementsCount = requirements.reduce((count, req) => count + (req.regex.test(password) ? 1 : 0), 0)

    // Calculate the percentage of the cup to fill
    const fillPercentage = (metRequirementsCount / requirements.length) * 100

    // Determine water color based on requirements met
    let waterColor = "#ff0000" // Red for 1-2 requirements
    if (metRequirementsCount >= requirements.length) {
      waterColor = "#4CAF50" // Green for all requirements met
    } else if (metRequirementsCount >= 3) {
      waterColor = "#FFA500" // Orange for 3-4 requirements
    }

    const waterStyle = {
      height: `${fillPercentage}%`,
      backgroundColor: waterColor,
    }

    return (
      <div style={cupStyles.container}>
        <div style={cupStyles.cup}>
          <div style={cupStyles.handle}></div>
          <div style={{ ...cupStyles.water, ...waterStyle }}></div>
        </div>
        <div style={cupStyles.requirements}>
          {firstUnmetRequirement ? (
            <div style={Errorstyle}>{firstUnmetRequirement.text}</div>
          ) : (
            <div style={Suceessstyle}>Password is strong!</div>
          )}
        </div>
      </div>
    )
  }

  const back = {
    backgroundColor: "#FFFFFF",
  }

  return (
    <div  >
      <div className="row authentication authentication-cover-main mx-0">
        <div className="col-xxl-6 col-xl-7">
          <div className="row justify-content-center align-items-center h-100">
            <div className="col-xxl-7 col-xl-9 col-lg-6 col-md-6 col-sm-8 col-12">
              <div className="card custom-card my-5 border">
                <div className="card-body p-5">
                  <p className="h5 mb-2 text-center">Sign Up</p>
                  <p className="mb-4 text-muted op-7 fw-normal text-center">Welcome! Begin by creating your account.</p>

                  <div className="btn-list text-center mt-3">
                                        <button className="btn btn-icon btn-wave btn-primary-light">
                                           <GitHubLogin />
                                        </button>
                                        <button className="btn btn-icon btn-wave btn-primary1-light">
                                      
                                                <GoogleLogin />
                                        </button>
                                        <button className="btn btn-icon btn-wave btn-primary2-light">
                                            <MicrosoftLogin />
                                        </button>
                                    </div>
                  <div className="text-center my-3 authentication-barrier">
                    <span>OR</span>
                  </div>

                  {error && <div className="alert alert-danger">{error}</div>}

                  <div className="mb-3 text-center">
                            <div className="image-upload-container" onClick={() => fileInputRef.current.click()}>
                              {imagePreview ? (
                                <img src={imagePreview || "/placeholder.svg"} alt="Profile Preview" className="profile-image" />
                              ) : (
                                <FaCamera size={17} />
                              )}
                            </div>
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/*"
                              onChange={handleImageChange}
                              style={{ display: "none" }}
                            />
                          </div>

                  <form onSubmit={handleSubmit} noValidate>
                    <div className="row gy-3">
                      <div className="col-xl-12">
                        <label htmlFor="signup-fullname" className="form-label text-default">
                          Full Name<sup className="fs-12 text-danger">*</sup>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="signup-fullname"
                          placeholder="Full name"
                          value={firstName + (firstName && lastName ? " " : "") + lastName}
                          onChange={(e) => {
                            const fullName = e.target.value
                            const nameParts = fullName.split(" ")
                            if (nameParts.length > 1) {
                              setFirst(nameParts[0])
                              setLast(nameParts.slice(1).join(" "))
                            } else {
                              setFirst(fullName)
                              setLast("")
                            }
                            setFieldErrors((prev) => ({
                              ...prev,
                              firstNameError: validateFirstName(nameParts[0] || ""),
                              lastNameError: validateLastName(nameParts.slice(1).join(" ") || ""),
                            }))
                          }}
                          required
                        />
                        {(fieldErrors.firstNameError || fieldErrors.lastNameError) && (
                          <div style={Errorstyle}>{fieldErrors.firstNameError || fieldErrors.lastNameError}</div>
                        )}
                      </div>

                      <div className="col-xl-12">
                        <label htmlFor="signup-phone" className="form-label text-default">
                          Phone Number<sup className="fs-12 text-danger">*</sup>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="signup-phone"
                          placeholder="Phone number"
                          value={phoneNumber}
                          onChange={handlePhoneNumberChange}
                          required
                        />
                        {fieldErrors.phoneError && <div style={Errorstyle}>{fieldErrors.phoneError}</div>}
                      </div>

                      <div className="col-xl-12">
                        <label htmlFor="signup-email" className="form-label text-default">
                          Email<sup className="fs-12 text-danger">*</sup>
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="signup-email"
                          placeholder="Email"
                          value={email}
                          onChange={handleEmailChange}
                          required
                        />
                        {emailError && <div style={Errorstyle}>{emailError}</div>}
                        {emailAvailable === false && <div style={Errorstyle}>Email is already taken</div>}
                        {emailAvailable === true && <div style={Suceessstyle}>Email is available</div>}
                      </div>

                      <div className="col-xl-12">
                        <label htmlFor="signup-password" className="form-label text-default">
                          Password<sup className="fs-12 text-danger">*</sup>
                        </label>
                        <div className="position-relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control create-password-input"
                            id="signup-password"
                            placeholder="Password"
                            value={password}
                            onFocus={() => {
                              setShowRequirements(true)
                              generatePasswordSuggestions()
                              setIsTypingManually(false)
                            }}
                            onBlur={() => setTimeout(() => setShowRequirements(false), 200)}
                            onChange={handlePasswordChange}
                            required
                          />
                         <a
  href="javascript:void(0);"
  className="show-password-button text-muted"
  onClick={() => setShowPassword(!showPassword)}
>
  <i className={showPassword ? "ri-eye-line align-middle" : "ri-eye-off-line align-middle"}></i>
</a>
                        </div>
                        {showRequirements && (
                          <PasswordStrengthCup password={password} requirements={passwordRequirements} />
                        )}
                        {showRequirements && !isTypingManually && passwordSuggestions.length > 0 && (
                          <div className="password-suggestions mt-2">
                            {passwordSuggestions.map((suggestion, index) => (
                              <span
                                key={index}
                                className="badge bg-light text-dark me-2 p-2"
                                style={{ cursor: "pointer" }}
                                onMouseDown={() => {
                                  handlePasswordSuggestionClick(suggestion)
                                  setShowRequirements(false)
                                }}
                              >
                                                            <div className="text-muted mb-1">Suggested password:  {suggestion} </div>

                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="col-xl-12 mt-3">
  <Recaptcha
    ref={recaptchaRef}
    onChange={handleRecaptchaChange}
    onExpired={handleRecaptchaExpired}
  />
</div>
                      </div>

                    <div className="d-grid mt-4">
                      <button
                        className="btn btn-primary"
                        type="submit"
                        disabled={!isRecaptchaVerified}
                        style={{
                          opacity: !isRecaptchaVerified ? 0.6 : 1,
                          cursor: !isRecaptchaVerified ? "not-allowed" : "pointer",
                        }}
                      >
                        Create Account
                      </button>
                    </div>
                  </form>

                  <div className="text-center">
                    <p className="text-muted mt-3 mb-0">
                      Already have an account?{" "}
                      <a href="/signin" className="text-primary">
                        Sign In
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-6 col-xl-5 col-lg-12 d-xl-block d-none px-0">
          <div className="authentication-cover overflow-hidden">
            
            <div className="aunthentication-cover-content d-flex align-items-center justify-content-center">
              <img 
            src="./public/signin.png" // Replace with your GIF URL
            alt="Project Management Animation"
            style={{
              width: '500px',
              height: '500px',
              
            }}
          />
            </div>
          </div>
        </div>
      </div>

      {showAlert && <CustomAlert message={alertMessage} onClose={() => setShowAlert(false)} />}
    </div>
  )
}

export default SignUp


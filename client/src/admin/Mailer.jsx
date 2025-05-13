import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Modal, Button, Form } from 'react-bootstrap';
import ReactQuill from "react-quill";
import "quill/dist/quill.snow.css"; 


const Mailer = ({ show, handleClose, adminEmail }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('https://lavoro-back.onrender.com/admin/all-users');
        if (response.data.success) {
          setUsers(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        Swal.fire('Error', 'Failed to load recipients', 'error');
      }
    };

    if (show) {
      fetchUsers();
    }
  }, [show]);

  const handleUserSelect = (email) => {
    setSelectedUsers(prev => {
      if (prev.includes(email)) {
        return prev.filter(e => e !== email);
      } else {
        return [...prev, email];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.email));
    }
  };

  const handleSendMail = async () => {
    if (!selectedUsers.length) {
      Swal.fire('Error', 'Please select at least one recipient', 'error');
      return;
    }

    if (!subject.trim()) {
      Swal.fire('Error', 'Please enter a subject', 'error');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('https://lavoro-back.onrender.com/admin/send', {
        to: selectedUsers,
        subject,
        content
      });

      if (response.data.success) {
        Swal.fire('Success', `Email sent to ${response.data.count} recipients`, 'success');
        handleClose();
      }
    } catch (error) {
      console.error('Error sending email:', error);
      const errorMsg = error.response?.data?.message || 'Failed to send email';
      Swal.fire('Error', errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered style={{ marginLeft: '50px'}}>
      <Modal.Header closeButton>
        <Modal.Title>Compose Mail</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="row">
          <div className="col-xl-6 mb-3">
            <label htmlFor="fromMail" className="form-label">
              From<sup><i className="ri-star-s-fill text-success fs-8"></i></sup>
            </label>
            <input 
              type="email" 
              className="form-control" 
              id="fromMail" 
              value={adminEmail} 
              readOnly 
            />
          </div>
          <div className="col-xl-6 mb-3">
            <label htmlFor="toMail" className="form-label">
              To<sup><i className="ri-star-s-fill text-success fs-8"></i></sup>
            </label>
            <div className="dropdown">
              <button
                className="btn btn-outline-secondary dropdown-toggle w-100 text-start"
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-expanded={showDropdown}
              >
                {selectedUsers.length > 0 
                  ? `${selectedUsers.length} selected` 
                  : 'Select recipients'}
              </button>
              <div 
                className={`dropdown-menu w-100 ${showDropdown ? 'show' : ''}`}
                style={{ maxHeight: '300px', overflowY: 'auto' }}
              >
                <div className="px-3 py-1">
                  <Form.Check
                    type="checkbox"
                    label="Select All"
                    checked={selectedUsers.length === users.length}
                    onChange={handleSelectAll}
                  />
                </div>
                <div className="dropdown-divider"></div>
                {users.map(user => (
                  <div key={user._id} className="dropdown-item">
                    <Form.Check
                      type="checkbox"
                      id={`user-${user._id}`}
                      label={`${user.firstName} ${user.lastName} (${user.email})`}
                      checked={selectedUsers.includes(user.email)}
                      onChange={() => handleUserSelect(user.email)}
                    />
                  </div>
                ))}
              </div>
            </div>
            {selectedUsers.length > 0 && (
              <div className="mt-2">
                <small className="text-muted">Selected: {selectedUsers.join(', ')}</small>
              </div>
            )}
          </div>
          <div className="col-xl-12 mb-3">
            <label htmlFor="subject" className="form-label">
              Subject
            </label>
            <input 
              type="text" 
              className="form-control" 
              id="subject" 
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="col-xl-12">
            <label className="form-label">Content:</label>
            <div className="mail-compose">
              <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent}
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                  ]
                }}
              />
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSendMail}
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Mailer;
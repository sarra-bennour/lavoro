import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';


function DeleteRequests({ onAccept, onReject }) {
  const [deleteRequests, setDeleteRequests] = useState([]);
  const [error, setError] = useState(null);

  // Fetch pending deletion requests
  useEffect(() => {
    const fetchDeleteRequests = async () => {
      try {
        const response = await axios.get('https://lavoro-back.onrender.com/admin/delete-requests', {
          withCredentials: true,
        });
        setDeleteRequests(response.data);
      } catch (err) {
        setError('Failed to fetch delete requests.');
        console.error('Error fetching delete requests:', err);
      }
    };

    fetchDeleteRequests();
  }, []);

  // Handle accept or reject action
  const handleAction = async (requestId, action) => {
    try {
      const response = await axios.post(
        'https://lavoro-back.onrender.com/admin/handle-delete-request',
        { notificationId: requestId, action },
        { withCredentials: true }
      );
  
      if (response.status === 200) {
        setDeleteRequests((prevRequests) =>
          prevRequests.filter((request) => request._id !== requestId)
        );
        Swal.fire('Success', `Request ${action}d successfully.`, 'success');
      }
    } catch (err) {
      console.error('Error handling delete request:', err);
      if (err.response && err.response.data.error) {
        Swal.fire('Error', err.response.data.error, 'error');
      } else {
        Swal.fire('Error', 'Failed to handle delete request.', 'error');
      }
    }
  };

  return (
    <div className="card custom-card mb-4">
      <div className="card-header justify-content-between">
        <div className="card-title">Pending Deletion Requests</div>
        <a href="#" className="btn btn-light btn-sm text-muted">
          View All
        </a>
      </div>
      <div className="card-body">
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <ul className="list-unstyled personal-favourite mb-0">
          {deleteRequests.length > 0 ? (
            deleteRequests.map((request) => (
              <li key={request._id}>
                <div className="d-flex align-items-center">
                  <div className="me-2">
                    <span className="avatar avatar-sm">
                      <img
                        src={
                          request.triggered_by?.image
                            ? request.triggered_by.image.startsWith('http') || 
                              request.triggered_by.image.startsWith('https')
                              ? request.triggered_by.image
                              : `https://lavoro-back.onrender.com${request.triggered_by.image}`
                            : 'https://via.placeholder.com/50'
                        }
                        alt={`${request.triggered_by?.firstName || ''} ${request.triggered_by?.lastName || ''}`}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/50';
                        }}
                      />
                    </span>
                  </div>
                  <div className="flex-fill text-truncate">
                    <span className="fw-medium d-block mb-0">
                      {request.triggered_by?.firstName || 'Unknown'} {request.triggered_by?.lastName || ''}
                    </span>
                    <span className="text-muted d-block fs-12 w-75 text-truncate">
                      Request to delete account.
                    </span>
                  </div>
                  <div className="btn-list text-nowrap">
                    <button
                      aria-label="button"
                      type="button"
                      className="btn btn-icon btn-sm btn-success-light"
                      onClick={() => handleAction(request._id, 'approve')}
                    >
                      <i className="ri-check-line"></i>
                    </button>
                    <button
                      aria-label="button"
                      type="button"
                      className="btn btn-icon btn-sm btn-danger-light me-0"
                      onClick={() => handleAction(request._id, 'reject')}
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <p>No pending deletion requests.</p>
          )}
        </ul>
      </div>
    </div>
  );
}

export default DeleteRequests;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const TaskCommentsTab = ({ taskId, projectData }) => {
  const [comments, setComments] = useState([]);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchCommentsAndCheckRole = async () => {
      try {
        setLoading(true);

        // Get current user
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const userResponse = await axios.get('https://lavoro-back.onrender.com/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setCurrentUser(userResponse.data);

        // Fetch comments
        const commentsResponse = await axios.get(`https://lavoro-back.onrender.com/tasks/getComments/${taskId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setComments(commentsResponse.data);

        // Get user role
        const userRole = userResponse.data.role?.RoleName;
        console.log('User role:', userRole);

        // Additional check: if Team Manager, verify they are the manager of this project
        if (userRole === 'Team Manager' && projectData) {
          console.log('User is Team Manager, checking if assigned to project');
          // Check if the current user is the team manager of the project
          const isTeamManagerOfProject = projectData.manager_id?._id === userResponse.data._id;
          console.log('Is team manager of project:', isTeamManagerOfProject);
          setIsManager(isTeamManagerOfProject);
        }
        // If Project Manager, verify they are the project manager of this project
        else if (userRole === 'Project Manager' && projectData) {
          console.log('User is Project Manager, checking if assigned to project');
          // Check if the current user is the project manager of the project
          const isProjectManagerOfProject = projectData.ProjectManager_id?._id === userResponse.data._id;
          console.log('Is project manager of project:', isProjectManagerOfProject);
          setIsManager(isProjectManagerOfProject);
        }
        // Admin can always comment
        else if (userRole === 'Admin') {
          console.log('User is Admin, allowing comment');
          setIsManager(true);
        }
        // Other roles cannot comment
        else {
          console.log('User has role', userRole, 'which cannot comment');
          setIsManager(false);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching comments or checking role:', error);
        setLoading(false);
      }
    };

    fetchCommentsAndCheckRole();
  }, [taskId, projectData]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('https://lavoro-back.onrender.com/tasks/comment', {
        task_id: taskId,
        content: newComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add the new comment to the list
      setComments([response.data, ...comments]);
      setNewComment('');
      setShowCommentForm(false);

      // Show success toast
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });

      Toast.fire({
        icon: 'success',
        title: 'Comment added successfully'
      });
    } catch (error) {
      console.error('Error adding comment:', error);

      // Show error toast
      Swal.fire({
        icon: 'error',
        title: 'Comment Failed',
        text: error.response?.data?.error || 'Only managers can add comments'
      });
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`https://lavoro-back.onrender.com/tasks/deleteComment/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Remove the deleted comment from the list
      setComments(comments.filter(comment => comment._id !== commentId));

      // Show success toast
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });

      Toast.fire({
        icon: 'success',
        title: 'Comment deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting comment:', error);

      // Show error toast
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error.response?.data?.error || 'Only managers can delete comments'
      });
    }
  };

  if (loading) return <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>;

  return (
    <div className="p-3">
      {isManager && (
        <div className="mb-3">
          {comments.length === 0 ? (
            <button
              className="btn btn-primary"
              onClick={() => setShowCommentForm(true)}
            >
              <i className="ri-add-line me-1"></i> Add Comment
            </button>
          ) : (
            <div className="d-flex justify-content-end">
              <button
                className="btn btn-primary"
                onClick={() => setShowCommentForm(true)}
              >
                <i className="ri-add-line me-1"></i> Add Comment
              </button>
            </div>
          )}
        </div>
      )}

      {showCommentForm && (
        <div className="card mb-3">
          <div className="card-body">
            <h5 className="card-title">Add Comment</h5>
            <textarea
              className="form-control mb-2"
              rows="3"
              placeholder="Write your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={() => {
                  setShowCommentForm(false);
                  setNewComment('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                Post Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-4">
          <i className="ri-chat-3-line fs-3 text-muted"></i>
          <p className="text-muted mt-2">No comments yet</p>
          {!isManager && (
            <p className="text-muted">Only project managers and team managers can add comments</p>
          )}
        </div>
      ) : (
        <div className="comment-list">
          {comments.map((comment) => (
            <div key={comment._id} className="card mb-3 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center mb-2">
                  {comment.user_id?.image ? (
                    <img
                      src={
                        comment.user_id.image.startsWith('http') ||
                        comment.user_id.image.startsWith('https')
                          ? comment.user_id.image
                          : `https://lavoro-back.onrender.com${comment.user_id.image}`
                      }
                      alt={`${comment.user_id?.firstName || ''} ${comment.user_id?.lastName || ''}`.trim() || 'User'}
                      className="avatar avatar-sm rounded-circle me-2"
                      onError={(e) => {
                        e.target.src = '../assets/images/faces/11.jpg';
                      }}
                    />
                  ) : (
                    <div className="avatar avatar-sm bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center">
                      <span className="text-white">
                        {comment.user_id?.firstName?.charAt(0)}{comment.user_id?.lastName?.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <h6 className="mb-0">
                      {comment.user_id?.firstName} {comment.user_id?.lastName}
                      {comment.user_id?.role?.RoleName && (
                        <span className="badge bg-info-transparent text-info ms-2">
                          {comment.user_id.role.RoleName}
                        </span>
                      )}
                    </h6>
                    <small className="text-muted">
                      {new Date(comment.created_at).toLocaleString()}
                    </small>
                  </div>
                  {isManager && comment.user_id?._id === currentUser?._id && (
                    <div className="ms-auto">
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteComment(comment._id)}
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  )}
                </div>
                <p className="mb-0 mt-2 ps-2 border-start border-primary">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskCommentsTab;
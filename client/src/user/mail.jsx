
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Offcanvas } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const Mail = () => {
  const [allEmails, setAllEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
          setUser(response.data);
          fetchEmails(response.data._id);
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate("/signin");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  const fetchEmails = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('https://lavoro-back.onrender.com/email/emails', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid response format');
      }

      const userEmails = response.data.filter(email =>
        (email.senderUser?._id === userId) ||
        (email.receiverUser?._id === userId)
      );

      setAllEmails(userEmails);
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };

  const getFilteredEmails = () => {
    if (!user || !allEmails.length) return [];

    let filtered = allEmails;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(email =>
        (email.subject && email.subject.toLowerCase().includes(query)) ||
        (email.text && email.text.toLowerCase().includes(query)) ||
        (email.from && email.from.toLowerCase().includes(query)) ||
        (email.to && email.to.toLowerCase().includes(query))
      );
    }

    switch(activeTab) {
      case 'inbox':
        return filtered.filter(email =>
          email.receiverUser?._id === user._id &&
          !email.isArchived
        );
      case 'sent':
        return filtered.filter(email =>
          email.senderUser?._id === user._id &&
          !email.isArchived
        );
      case 'starred':
        return filtered.filter(email =>
          email.isStarred &&
          !email.isArchived
        );
      case 'archive':
        return filtered.filter(email =>
          email.isArchived
        );
      default:
        return filtered.filter(email =>
          !email.isArchived
        );
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleEmailClick = async (emailId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://lavoro-back.onrender.com/email/emails/${emailId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSelectedEmail(response.data);
      setShowOffcanvas(true);
    } catch (error) {
      console.error('Error fetching email details:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const toggleStarEmail = async (emailId) => {
    try {
      setLoadingAction(true);
      const token = localStorage.getItem('token');
      await axios.patch(
        `https://lavoro-back.onrender.com/email/emails/${emailId}/star`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (user) fetchEmails(user._id);
    } catch (error) {
      console.error('Error toggling star:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleArchiveEmail = async (emailId) => {
    try {
      setLoadingAction(true);
      const token = localStorage.getItem('token');
      await axios.patch(
        `https://lavoro-back.onrender.com/email/emails/${emailId}/archive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (user) fetchEmails(user._id);
    } catch (error) {
      console.error('Error toggling archive:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const deleteEmail = async (emailId) => {
    try {
      setLoadingAction(true);
      const token = localStorage.getItem('token');
      await axios.delete(
        `https://lavoro-back.onrender.com/email/emails/${emailId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (user) fetchEmails(user._id);
      setShowOffcanvas(false);
    } catch (error) {
      console.error('Error deleting email:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  const formatEmailDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-TN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const extractEmailAddress = (emailString) => {
    if (!emailString) return '';
    const matches = emailString.match(/<([^>]+)>/);
    return matches ? matches[1] : emailString;
  };

  const formatEmailText = (text) => {
    return text.split('\n').map((paragraph, index) => (
      <p key={index} className="mb-2">
        {paragraph.trim() === '' ? <br /> : paragraph}
      </p>
    ));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="alert alert-danger">Please sign in to view your emails</div>;
  }

  const filteredEmails = getFilteredEmails();

  return (
    <>
      <br />
      <div className="main-mail-container mb-2 gap-2 d-flex">
        <div className="mail-navigation border">
          <div className="d-grid align-items-top p-3 border-bottom border-block-end-dashed">
           
          </div>
          <div>
            <ul className="list-unstyled mail-main-nav" id="mail-main-nav">
              <li className="px-0 pt-0">
                <span className="fs-11 text-muted op-7 fw-medium">
                  MAILS
                </span>
              </li>
              <li className={activeTab === 'inbox' ? 'active mail-type' : 'mail-type'}>
                <a onClick={() => handleTabChange('inbox')}>
                  <div className="d-flex align-items-center">
                    <span className="me-2 lh-1">
                      <i className="ri-inbox-line align-middle fs-16" />
                    </span>
                    <span className="flex-fill text-nowrap">Inbox</span>
                    <span className="badge bg-primary2 rounded-pill">
                      {allEmails.filter(e =>
                        e.receiverUser?._id === user._id &&
                        !e.isArchived
                      ).length}
                    </span>
                  </div>
                </a>
              </li>
              <li className={activeTab === 'sent' ? 'active mail-type' : 'mail-type'}>
                <a onClick={() => handleTabChange('sent')}>
                  <div className="d-flex align-items-center">
                    <span className="me-2 lh-1">
                      <i className="ri-send-plane-line align-middle fs-16" />
                    </span>
                    <span className="flex-fill text-nowrap">Sent</span>
                    <span className="badge bg-primary1 rounded-pill">
                      {allEmails.filter(e =>
                        e.senderUser?._id === user._id &&
                        !e.isArchived
                      ).length}
                    </span>
                  </div>
                </a>
              </li>
              <li className={activeTab === 'starred' ? 'active mail-type' : 'mail-type'}>
                <a onClick={() => handleTabChange('starred')}>
                  <div className="d-flex align-items-center">
                    <span className="me-2 lh-1">
                      <i className="ri-star-line align-middle fs-16" />
                    </span>
                    <span className="flex-fill text-nowrap">Starred</span>
                    <span className="badge bg-primary1 rounded-pill">
                      {allEmails.filter(e => e.isStarred && !e.isArchived).length}
                    </span>
                  </div>
                </a>
              </li>
              <li className={activeTab === 'archive' ? 'active mail-type' : 'mail-type'}>
                <a onClick={() => handleTabChange('archive')}>
                  <div className="d-flex align-items-center">
                    <span className="me-2 lh-1">
                      <i className="ri-archive-line align-middle fs-16" />
                    </span>
                    <span className="flex-fill text-nowrap">Archive</span>
                    <span className="badge bg-primary1 rounded-pill">
                      {allEmails.filter(e => e.isArchived).length}
                    </span>
                  </div>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="total-mails border">
          <div className="p-3 d-flex align-items-center border-bottom border-block-end-dashed flex-wrap gap-2">
            <form onSubmit={handleSearch} className="input-group">
              <input
                type="text"
                className="form-control shadow-none"
                placeholder="Search Email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className="btn btn-primary"
                type="submit"
              >
                <i className="ri-search-line me-1" /> Search
              </button>
            </form>
          </div>
          <div className="px-3 p-2 d-flex align-items-center border-bottom flex-wrap gap-2">
            <div className="me-3">
              <input
                className="form-check-input check-all"
                type="checkbox"
                id="checkAll"
                defaultValue=""
                aria-label="..."
              />
            </div>
            <div className="flex-fill">
              <h6 className="fw-medium mb-0">
                {activeTab === 'inbox' ? 'Inbox' :
                 activeTab === 'sent' ? 'Sent' :
                 activeTab === 'starred' ? 'Starred' :
                 activeTab === 'archive' ? 'Archive' : 'All Mails'}
              </h6>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-icon btn-light me-1 d-lg-none d-block total-mails-close btn-sm">
                <i className="ri-close-line" />
              </button>
            </div>
          </div>
          <div className="mail-messages" id="mail-messages">
            {filteredEmails.length === 0 ? (
              <div className="text-center py-5">
                <i className="ri-mail-forbid-line fs-40 text-muted mb-3"></i>
                <h5>No emails found</h5>
                <p className="text-muted">
                  {activeTab === 'inbox'
                    ? "Your inbox is empty"
                    : activeTab === 'sent'
                      ? "You haven't sent any emails yet"
                      : activeTab === 'starred'
                        ? "No starred emails"
                        : activeTab === 'archive'
                          ? "Archive is empty"
                          : "No emails to display"}
                </p>
              </div>
            ) : (
              <ul className="list-unstyled mb-0 mail-messages-container">
                {filteredEmails.map(email => {
                  const isSent = email.senderUser?._id === user._id;
                  const isReceived = email.receiverUser?._id === user._id;

                  return (
                    <li
                      key={email._id}
                      className={`${selectedEmail?._id === email._id ? 'active' : ''} ${email.isStarred ? 'starred-email' : ''}`}
                      onClick={() => handleEmailClick(email._id)}
                    >
                      <div className="d-flex align-items-top">
                        <div className="me-3 mt-1">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`checkbox-${email._id}`}
                          />
                        </div>
                        <div className="flex-fill text-truncate">
                          <p className="mb-1 fs-12 fw-medium">
                            {isSent ? `To: ${extractEmailAddress(email.to)}` : `From: ${extractEmailAddress(email.senderUser?.email)}`}
                            {!email.isRead && isReceived && (
                              <span className="badge bg-primary rounded-pill ms-2">New</span>
                            )}
                            {email.isStarred && (
                              <i className="ri-star-fill text-warning ms-2"></i>
                            )}
                            {email.isArchived && (
                              <i className="ri-archive-line text-primary ms-2"></i>
                            )}
                            <span className="float-end text-muted fw-normal fs-11">
                              {formatEmailDate(email.createdAt)}
                            </span>
                          </p>
                          <div className="mail-msg mb-0">
                            <span className="d-block mb-0 fw-medium text-truncate w-75">
                              {email.subject}
                            </span>
                            <div className="fs-12 text-muted w-75 text-truncate mail-msg-content">
                              {email.text.substring(0, 100)}...
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Email Details Offcanvas */}
        <Offcanvas
          show={showOffcanvas}
          onHide={() => setShowOffcanvas(false)}
          placement="end"
          className="mail-info-offcanvas"
          style={{zIndex: 1060}}
        >
          <Offcanvas.Body className="p-0">
            {selectedEmail && (
              <div className="mails-information">
                <div className="mail-info-header d-flex flex-wrap gap-2 align-items-center p-3 border-bottom">
                  <span className="avatar avatar-md me-2 avatar-rounded mail-msg-avatar me-1">
                    {selectedEmail.senderUser.email?.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-fill">
                    <h6 className="mb-0 fw-medium">{selectedEmail.senderUser.firstName?.split('<')[0].trim()}</h6>
                    <span className="text-muted fs-11">{extractEmailAddress(selectedEmail.senderUser.email)}</span>
                  </div>
                  <div className="mail-action-icons d-flex align-items-center gap-2">
                    <button
                      className={`btn btn-sm btn-icon ${selectedEmail.isStarred ? 'btn-warning' : 'btn-outline-secondary'}`}
                      title="Starred"
                      onClick={() => toggleStarEmail(selectedEmail._id)}
                      disabled={loadingAction}
                    >
                      <i className={`ri-star-${selectedEmail.isStarred ? 'fill' : 'line'}`}></i>
                    </button>
                    <button
                      className={`btn btn-sm btn-icon ${selectedEmail.isArchived ? 'btn-primary' : 'btn-outline-secondary'}`}
                      title={selectedEmail.isArchived ? "Unarchive" : "Archive"}
                      onClick={() => toggleArchiveEmail(selectedEmail._id)}
                      disabled={loadingAction}
                    >
                      <i className="ri-archive-line"></i>
                    </button>
                    <button
                      className="btn btn-sm btn-icon btn-outline-danger"
                      title="Delete"
                      onClick={() => deleteEmail(selectedEmail._id)}
                      disabled={loadingAction}
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-icon btn-outline-secondary"
                      onClick={() => setShowOffcanvas(false)}
                      aria-label="Close"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                </div>

                <div className="mail-info-body p-3" id="mail-info-body">
                  <div className="d-sm-flex d-block align-items-center justify-content-between mb-3">
                    <div>
                      <p className="fs-20 fw-medium mb-0">{selectedEmail.subject}</p>
                      <p className="text-muted mb-0 fs-12">
                        To: {extractEmailAddress(selectedEmail.to)}
                      </p>
                    </div>
                    <div className="float-end">
                      <span className="fs-12 text-muted">
                        {formatEmailDate(selectedEmail.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="main-mail-content mb-3">
                    {formatEmailText(selectedEmail.text)}
                  </div>
                </div>

                
              </div>
            )}
          </Offcanvas.Body>
        </Offcanvas>
      </div>
    </>
  );
};

export default Mail;
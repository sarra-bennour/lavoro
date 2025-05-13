import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Dropzone from 'react-dropzone';

const File = () => {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareFileId, setShareFileId] = useState(null);
  const [usersToShare, setUsersToShare] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [makePublic, setMakePublic] = useState(false);
  const [permission, setPermission] = useState('view');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showFileDetails, setShowFileDetails] = useState(false);
  const [fileDetails, setFileDetails] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [fileToMove, setFileToMove] = useState(null);
  const navigate = useNavigate();

  // Fetch all data on component mount or when currentFolder changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/signin');
          return;
        }

        // Fetch user info
        const userResponse = await axios.get("https://lavoro-back.onrender.com/users/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userResponse.data);

        // Fetch files based on current folder
        const filesEndpoint = currentFolder
          ? `https://lavoro-back.onrender.com/files/folders/${currentFolder}`
          : "https://lavoro-back.onrender.com/files/shared";

        const [filesResponse, foldersResponse, usersResponse] = await Promise.all([
          axios.get(filesEndpoint, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get("https://lavoro-back.onrender.com/files/folders", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get("https://lavoro-back.onrender.com/users/all", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        // Handle response based on whether we're in a folder or not
        if (currentFolder) {
          setFiles(filesResponse.data.files || []);
          setFolders(filesResponse.data.folder?.sub_folders || []);
          setSharedFiles([]); // Clear shared files when in a folder
        } else {
          setFiles(filesResponse.data.ownedFiles || []);
          setSharedFiles(filesResponse.data.sharedFiles || []);
          setFolders(foldersResponse.data.folders || []);
        }

        const usersArray = usersResponse.data.data;
        setAllUsers(usersArray.filter(u => u._id !== userResponse.data._id));

      } catch (err) {
        console.error("Error fetching data:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/signin');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, currentFolder]);


  const handleDelete = async (fileId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `https://lavoro-back.onrender.com/files/${fileId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Refresh the files list
            const filesResponse = await axios.get(
                currentFolder
                    ? `https://lavoro-back.onrender.com/files/folders/${currentFolder}`
                    : "https://lavoro-back.onrender.com/files/shared",
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (currentFolder) {
                setFiles(filesResponse.data.files || []);
            } else {
                setFiles(filesResponse.data.ownedFiles || []);
                setSharedFiles(filesResponse.data.sharedFiles || []);
            }

        } catch (err) {
            console.error("Error deleting file:", err);
            alert('Failed to delete file');
        }

};

  // Fetch folder contents when a folder is clicked
  const fetchFolderContents = async (folderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `https://lavoro-back.onrender.com/files/folders/${folderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCurrentFolder(folderId);
      setFiles(response.data.files || []);
      setFolders(response.data.folder?.sub_folders || []);
      setActiveTab('all'); // Switch to all files view when entering a folder

    } catch (err) {
      console.error("Error fetching folder contents:", err);
      alert('Failed to load folder contents');
    }
  };

  // Handle file upload via Dropzone
  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    // Include current folder in upload if set
    if (currentFolder) {
      formData.append('folder_id', currentFolder);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        "https://lavoro-back.onrender.com/files/upload",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setFiles(prev => [...prev, response.data.file]);
    } catch (err) {
      console.error("Error uploading file:", err);
      alert('Failed to upload file');
    }
  };
  const handleDownload = async (fileId) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
            `https://lavoro-back.onrender.com/files/file/${fileId}?download=true`,
            {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            }
        );

        // Create a URL and simulate download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;

        // Extract filename from content-disposition header if available
        let filename = 'download';
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (err) {
        console.error("Error downloading file:", err);
        alert('Failed to download file');
    }
};


  const handleShare = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `https://lavoro-back.onrender.com/files/share/${shareFileId}`,
        {
          userIds: usersToShare,
          permission,
          makePublic
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowShareModal(false);
      setUsersToShare([]);
      setMakePublic(false);

      // Refresh files list
      const filesResponse = await axios.get("https://lavoro-back.onrender.com/files/shared", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(filesResponse.data.ownedFiles);
      setSharedFiles(filesResponse.data.sharedFiles);
    } catch (err) {
      console.error("Error sharing file:", err);
      alert('Failed to share file');
    }
  };

  // Toggle user selection for sharing
  const toggleUserSelection = (userId) => {
    setUsersToShare(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Handle create folder
  const handleCreateFolder = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
        return;
      }

      if (!newFolderName.trim()) {
        alert('Folder name cannot be empty');
        return;
      }

      const response = await axios.post(
        "https://lavoro-back.onrender.com/files/folders/create",
        {
          name: newFolderName,
          parentFolder: currentFolder
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        // Refresh folders list
        const foldersResponse = await axios.get("https://lavoro-back.onrender.com/files/folders", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFolders(foldersResponse.data.folders);

        setNewFolderName('');
        // Close modal
        document.getElementById('create-folder').classList.remove('show');
        document.querySelector('.modal-backdrop').remove();
      }
    } catch (err) {
      console.error("Error creating folder:", err);
      alert(err.response?.data?.error || 'Failed to create folder');
    }
  };

  // Handle moving file to folder
  const handleMoveFile = async (fileId, folderId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `https://lavoro-back.onrender.com/files/${fileId}/move`,
        { folderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Refresh files list
        const filesResponse = await axios.get(
          currentFolder
            ? `https://lavoro-back.onrender.com/files/folders/${currentFolder}`
            : "https://lavoro-back.onrender.com/files/shared",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (currentFolder) {
          setFiles(filesResponse.data.files || []);
        } else {
          setFiles(filesResponse.data.ownedFiles || []);
          setSharedFiles(filesResponse.data.sharedFiles || []);
        }

        setShowMoveModal(false);
      }
    } catch (err) {
      console.error("Error moving file:", err);
      alert('Failed to move file');
    }
  };

  // Open share modal
  const openShareModal = (fileId) => {
    setShareFileId(fileId);
    setUsersToShare([]);
    setMakePublic(false);
    setPermission('view');
    setShowShareModal(true);
  };

  // Open move file modal
  const openMoveModal = (fileId) => {
    setFileToMove(fileId);
    setShowMoveModal(true);
  };

  // Get current files based on active tab and current folder
  const getCurrentFiles = () => {
    let result = [];

    if (activeTab === 'all') {
      result = [...files, ...sharedFiles];
    } else if (activeTab === 'owned') {
      result = files;
    } else if (activeTab === 'shared') {
      result = sharedFiles;
    } else if (activeTab === 'folders') {
      return []; // Folders tab shows folders, not files
    }

    // Filter by search term if set
    if (searchTerm) {
      result = result.filter(file =>
        file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.file_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result;
  };

  // Filter files by category
  const filterFilesByCategory = (category) => {
    let filesToFilter = getCurrentFiles();
    return filesToFilter.filter(file => file.file_type === category);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    switch(fileType) {
      case 'image': return <i className="ri-image-line fs-20"></i>;
      case 'video': return <i className="ri-video-line fs-20"></i>;
      case 'audio': return <i className="ri-music-2-line fs-20"></i>;
      case 'document': return <i className="ri-file-text-line fs-20"></i>;
      case 'archive': return <i className="ri-archive-line fs-20"></i>;
      default: return <i className="ri-file-line fs-20"></i>;
    }
  };

  // Get folder icon
  const getFolderIcon = () => {
    return <i className="ri-folder-2-fill fs-20 text-warning"></i>;
  };

  // Get file details
  const getFileDetails = async (fileId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`https://lavoro-back.onrender.com/files/${fileId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFileDetails(response.data.file);
      setShowFileDetails(true);
    } catch (err) {
      console.error("Error fetching file details:", err);
      alert('Failed to fetch file details');
    }
  };

  // Open category modal
  const openCategoryModal = (category) => {
    setCurrentCategory(category);
    setShowCategoryModal(true);
  };

  // Navigate back to parent folder
  const navigateToParentFolder = async () => {
    if (!currentFolder) return;

    try {
      const token = localStorage.getItem('token');
      const folderResponse = await axios.get(
        `https://lavoro-back.onrender.com/files/folders/${currentFolder}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const parentFolder = folderResponse.data.folder?.parent_folder;
      setCurrentFolder(parentFolder || null);

      if (parentFolder) {
        const parentResponse = await axios.get(
          `https://lavoro-back.onrender.com/files/folders/${parentFolder}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFiles(parentResponse.data.files || []);
        setFolders(parentResponse.data.folder?.sub_folders || []);
      } else {
        // If going back to root, fetch all files
        const filesResponse = await axios.get(
          "https://lavoro-back.onrender.com/files/shared",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFiles(filesResponse.data.ownedFiles || []);
        setSharedFiles(filesResponse.data.sharedFiles || []);

        const foldersResponse = await axios.get(
          "https://lavoro-back.onrender.com/files/folders",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFolders(foldersResponse.data.folders || []);
      }
    } catch (err) {
      console.error("Error navigating to parent folder:", err);
      alert('Failed to navigate to parent folder');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const currentFiles = getCurrentFiles();
  const totalFiles = currentFiles.length;
  const totalSize = currentFiles.reduce((acc, file) => acc + file.file_size, 0);

  return (
    <>
      <link rel="stylesheet" href="../assets/libs/dropzone/dropzone.css" />

      <div className="container-fluid">
        {/* Page Header */}
        <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
          <div>
            <nav>
              <ol className="breadcrumb mb-1">
                <li className="breadcrumb-item">
                  <a href="javascript:void(0);">Pages</a>
                </li>
                <span className="mx-1">→</span>
                <li className="breadcrumb-item active" aria-current="page">
                  File Manager
                </li>
              </ol>
            </nav>
            <h1 className="page-title fw-medium fs-18 mb-0">File Manager</h1>
          </div>
          
        </div>

        {/* Main Content */}
        <div className="row">
          {/* Sidebar */}
          <div className="col-xxl-3">
            <div className="row">
              <div className="col-xl-12">
                <div className="card custom-card">
                  <div className="d-flex p-3 flex-wrap gap-2 align-items-center justify-content-between border-bottom">
                    <div className="flex-fill">
                      <h6 className="fw-medium mb-0">File Manager</h6>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3 p-3 border-bottom border-block-end-dashed">
                    <span className="avatar avatar-xl online">
                      {user?.image ? (
                        <img
                          src={
                            user.image.startsWith('http') || user.image.startsWith('https')
                              ? user.image
                              : `https://lavoro-back.onrender.com${user.image}`
                          }
                          alt="Profile"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/100";
                          }}
                        />
                      ) : (
                        <p>No profile image uploaded.</p>
                      )}
                    </span>
                    <div className="main-profile-info">
                      <h6 className="fw-semibold mb-1">{user?.firstName} {user?.lastName}</h6>
                      <p className="text-muted fs-11 mb-2">{user?.role?.RoleName}</p>
                      <p className="mb-0">{user?.email}</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <ul className="list-unstyled files-main-nav" id="files-main-nav">
                      <li className="px-0 pt-0">
                        <span className="fs-12 text-muted">My Files</span>
                      </li>
                      <li className={`files-type ${activeTab === 'all' ? 'active' : ''}`}>
                        <a href="javascript:void(0)" onClick={() => {
                          setActiveTab('all');
                          setCurrentFolder(null);
                        }}>
                          <div className="d-flex align-items-center">
                            <div className="me-2">
                              <i className="ri-folder-2-line fs-16" />
                            </div>
                            <span className="flex-fill text-nowrap">
                              All Files
                            </span>
                            <span className="badge bg-primary">{files.length + sharedFiles.length}</span>
                          </div>
                        </a>
                      </li>
                      <li className={`files-type ${activeTab === 'owned' ? 'active' : ''}`}>
                        <a href="javascript:void(0)" onClick={() => {
                          setActiveTab('owned');
                          setCurrentFolder(null);
                        }}>
                          <div className="d-flex align-items-center">
                            <div className="me-2">
                              <i className="ri-history-fill fs-16" />
                            </div>
                            <span className="flex-fill text-nowrap">
                              My Files
                            </span>
                            <span className="badge bg-primary">{files.length}</span>
                          </div>
                        </a>
                      </li>
                      <li className={`files-type ${activeTab === 'shared' ? 'active' : ''}`}>
                        <a href="javascript:void(0)" onClick={() => {
                          setActiveTab('shared');
                          setCurrentFolder(null);
                        }}>
                          <div className="d-flex align-items-center">
                            <div className="me-2">
                              <i className="ri-share-forward-line fs-16" />
                            </div>
                            <span className="flex-fill text-nowrap">
                              Shared Files
                            </span>
                            <span className="badge bg-primary">{sharedFiles.length}</span>
                          </div>
                        </a>
                      </li>
                      <li className={`files-type ${activeTab === 'folders' ? 'active' : ''}`}>
                        <a href="javascript:void(0)" onClick={() => {
                          setActiveTab('folders');
                          setCurrentFolder(null);
                        }}>
                          <div className="d-flex align-items-center">
                            <div className="me-2">
                              <i className="ri-folder-2-fill fs-16" />
                            </div>
                            <span className="flex-fill text-nowrap">
                              Folders
                            </span>
                            <span className="badge bg-primary">{folders.length}</span>
                          </div>
                        </a>
                      </li>
                      <li className="px-0 pt-3">
                        <span className="fs-12 text-muted">Upload File</span>
                      </li>
                      <li className="p-3 border border-dashed">
                        <Dropzone onDrop={onDrop} multiple={false}>
                          {({getRootProps, getInputProps}) => (
                            <div {...getRootProps()} className="dropzone bg-light">
                              <input {...getInputProps()} />
                              <p>Drag & drop a file here, or click to select</p>
                              <em>(Only one file will be accepted)</em>
                            </div>
                          )}
                        </Dropzone>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main File Area */}
          <div className="col-xxl-6">
            <div className="card custom-card overflow-hidden">
              <div className="card-body p-0">
                <div className="file-manager-folders">
                  {/* Folder Navigation Breadcrumb */}
                  <div className="d-flex p-3 align-items-center border-bottom">
                    {currentFolder && (
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        onClick={navigateToParentFolder}
                      >
                        <i className="ri-arrow-left-line"></i> Back
                      </button>
                    )}
                    <div className="breadcrumb mb-0">
                      <span
                        className="breadcrumb-item"
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          setCurrentFolder(null);
                          setActiveTab('all');
                        }}
                      >
                        Root
                      </span>
                      {currentFolder && (
                        <span className="breadcrumb-item active">
                          {folders.find(f => f._id === currentFolder)?.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="d-flex p-3 flex-wrap gap-2 align-items-center justify-content-between border-bottom">
                    <div className="flex-fill">
                      <h6 className="fw-medium mb-0">
                        {activeTab === 'all' && 'All Files'}
                        {activeTab === 'owned' && 'My Files'}
                        {activeTab === 'shared' && 'Shared With Me'}
                        {activeTab === 'folders' && 'Folders'}
                      </h6>
                    </div>
                    <div className="d-flex gap-2 flex-lg-nowrap flex-wrap justify-content-sm-end w-75">
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control w-50"
                          placeholder={activeTab === 'folders' ? 'Search Folder' : 'Search File'}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button
                          className="btn btn-primary-light"
                          type="button"
                        >
                          <i className="ri-search-line" />
                        </button>
                      </div>
                      <button
                        className="btn btn-sm btn-light"
                        onClick={() => currentFolder ? fetchFolderContents(currentFolder) : window.location.reload()}
                      >
                        <i className="ri-refresh-line"></i> Refresh
                      </button>
                      {activeTab === 'folders' && (
                        <button
                          className="btn btn-primary btn-w-md d-flex align-items-center justify-content-center btn-wave waves-light text-nowrap"
                          data-bs-toggle="modal"
                          data-bs-target="#create-folder"
                        >
                          <i className="ri-add-circle-line align-middle me-1" />
                          Create Folder
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Access Folders (shown when not in Folders tab) */}
                  {activeTab !== 'folders' && (
                    <div className="p-3 file-folders-container">
                      <div className="d-flex mb-3 align-items-center justify-content-between">
                        <p className="mb-0 fw-medium fs-14">Quick Access</p>
                        <a
                          href="javascript:void(0);"
                          className="fs-12 text-muted fw-medium"
                        >
                          View All
                          <i className="ti ti-arrow-narrow-right ms-1" />
                        </a>
                      </div>
                      <div className="row mb-3">
                        {/* Images Folder */}
                        <div className="col-xxl-4 col-xl-6 col-lg-6 col-md-6">
                          <div
                            className="card custom-card shadow-none border"
                            onClick={() => openCategoryModal('image')}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-body">
                              <div className="d-flex align-items-center gap-3 flex-wrap">
                                <div className="main-card-icon primary">
                                  <div className="avatar avatar-md bg-primary-transparent border border-primary border-opacity-10">
                                    <div className="avatar avatar-sm text-primary">
                                      <i className="ri-image-line fs-24" />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-fill">
                                  <a href="javascript:void(0);" className="d-block fw-medium">
                                    Images
                                  </a>
                                  <span className="fs-12 text-muted">
                                    {Math.round(
                                      currentFiles.filter(f => f.file_type === 'image').length /
                                      (totalFiles || 1) * 100
                                    )}% Used
                                  </span>
                                </div>
                                <div className="text-end">
                                  <span className="fw-medium">
                                    {currentFiles.filter(f => f.file_type === 'image').length} files
                                  </span>
                                  <span className="d-block fs-12 text-muted">
                                    {formatFileSize(
                                      currentFiles.filter(f => f.file_type === 'image')
                                        .reduce((acc, file) => acc + file.file_size, 0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Videos Folder */}
                        <div className="col-xxl-4 col-xl-6 col-lg-6 col-md-6">
                          <div
                            className="card custom-card shadow-none border"
                            onClick={() => openCategoryModal('video')}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-body">
                              <div className="d-flex align-items-center gap-3 flex-wrap">
                                <div className="main-card-icon primary1">
                                  <div className="avatar avatar-md bg-primary1-transparent border border-primary1 border-opacity-10">
                                    <div className="avatar avatar-sm text-primary1">
                                      <i className="ri-video-line fs-24" />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-fill">
                                  <a href="javascript:void(0);" className="d-block fw-medium">
                                    Videos
                                  </a>
                                  <span className="fs-12 text-muted">
                                    {Math.round(
                                      currentFiles.filter(f => f.file_type === 'video').length /
                                      (totalFiles || 1) * 100
                                    )}% Used
                                  </span>
                                </div>
                                <div className="text-end">
                                  <span className="fw-medium">
                                    {currentFiles.filter(f => f.file_type === 'video').length} files
                                  </span>
                                  <span className="d-block fs-12 text-muted">
                                    {formatFileSize(
                                      currentFiles.filter(f => f.file_type === 'video')
                                        .reduce((acc, file) => acc + file.file_size, 0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Documents Folder */}
                        <div className="col-xxl-4 col-xl-6 col-lg-6 col-md-6">
                          <div
                            className="card custom-card shadow-none border"
                            onClick={() => openCategoryModal('document')}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-body">
                              <div className="d-flex align-items-center gap-3 flex-wrap">
                                <div className="main-card-icon secondary">
                                  <div className="avatar avatar-md bg-secondary-transparent border border-secondary border-opacity-10">
                                    <div className="avatar avatar-sm text-secondary">
                                      <i className="ri-file-text-line fs-24" />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-fill">
                                  <a href="javascript:void(0);" className="d-block fw-medium">
                                    Documents
                                  </a>
                                  <span className="fs-12 text-muted">
                                    {Math.round(
                                      currentFiles.filter(f => f.file_type === 'document').length /
                                      (totalFiles || 1) * 100
                                    )}% Used
                                  </span>
                                </div>
                                <div className="text-end">
                                  <span className="fw-medium">
                                    {currentFiles.filter(f => f.file_type === 'document').length} files
                                  </span>
                                  <span className="d-block fs-12 text-muted">
                                    {formatFileSize(
                                      currentFiles.filter(f => f.file_type === 'document')
                                        .reduce((acc, file) => acc + file.file_size, 0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Audio Folder */}
                        <div className="col-xxl-4 col-xl-6 col-lg-6 col-md-6">
                          <div
                            className="card custom-card shadow-none border"
                            onClick={() => openCategoryModal('audio')}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-body">
                              <div className="d-flex align-items-center gap-3 flex-wrap">
                                <div className="main-card-icon success">
                                  <div className="avatar avatar-md bg-success-transparent border border-success border-opacity-10">
                                    <div className="avatar avatar-sm text-success">
                                      <i className="ri-music-2-line fs-24" />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-fill">
                                  <a href="javascript:void(0);" className="d-block fw-medium">
                                    Audio
                                  </a>
                                  <span className="fs-12 text-muted">
                                    {Math.round(
                                      currentFiles.filter(f => f.file_type === 'audio').length /
                                      (totalFiles || 1) * 100
                                    )}% Used
                                  </span>
                                </div>
                                <div className="text-end">
                                  <span className="fw-medium">
                                    {currentFiles.filter(f => f.file_type === 'audio').length} files
                                  </span>
                                  <span className="d-block fs-12 text-muted">
                                    {formatFileSize(
                                      currentFiles.filter(f => f.file_type === 'audio')
                                        .reduce((acc, file) => acc + file.file_size, 0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Archives Folder */}
                        <div className="col-xxl-4 col-xl-6 col-lg-6 col-md-6">
                          <div
                            className="card custom-card shadow-none border"
                            onClick={() => openCategoryModal('archive')}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-body">
                              <div className="d-flex align-items-center gap-3 flex-wrap">
                                <div className="main-card-icon warning">
                                  <div className="avatar avatar-md bg-warning-transparent border border-warning border-opacity-10">
                                    <div className="avatar avatar-sm text-warning">
                                      <i className="ri-archive-line fs-24" />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-fill">
                                  <a href="javascript:void(0);" className="d-block fw-medium">
                                    Archives
                                  </a>
                                  <span className="fs-12 text-muted">
                                    {Math.round(
                                      currentFiles.filter(f => f.file_type === 'archive').length /
                                      (totalFiles || 1) * 100
                                    )}% Used
                                  </span>
                                </div>
                                <div className="text-end">
                                  <span className="fw-medium">
                                    {currentFiles.filter(f => f.file_type === 'archive').length} files
                                  </span>
                                  <span className="d-block fs-12 text-muted">
                                    {formatFileSize(
                                      currentFiles.filter(f => f.file_type === 'archive')
                                        .reduce((acc, file) => acc + file.file_size, 0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Folders Card */}
                        <div className="col-xxl-4 col-xl-6 col-lg-6 col-md-6">
                          <div
                            className="card custom-card shadow-none border"
                            onClick={() => setActiveTab('folders')}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="card-body">
                              <div className="d-flex align-items-center gap-3 flex-wrap">
                                <div className="main-card-icon warning">
                                  <div className="avatar avatar-md bg-danger-transparent border border-warning border-opacity-10">
                                    <div className="avatar avatar-sm text-danger">
                                      <i className="ri-folder-line fs-24" />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-fill">
                                  <a href="javascript:void(0);" className="d-block fw-medium">
                                    Folders
                                  </a>
                                  <span className="fs-12 text-muted">
                                    {Math.round(
                                      folders.length /
                                      (folders.length + files.length + sharedFiles.length || 1) * 100
                                    )}% Used
                                  </span>
                                </div>
                                <div className="text-end">
                                  <span className="fw-medium">
                                    {folders.length} folders
                                  </span>
                                  <span className="d-block fs-12 text-muted">
                                    {formatFileSize(
                                      files.filter(f => f.folder_id).reduce((acc, file) => acc + file.file_size, 0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Folders List (shown when Folders tab is active) */}
                  {activeTab === 'folders' && (
                    <div className="p-3">
                      <div className="row">
                        {folders
                          .filter(folder =>
                            (!currentFolder && !folder.parent_folder) ||
                            (currentFolder && folder.parent_folder === currentFolder)
                          )
                          .filter(folder =>
                            folder.name.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map(folder => (
                            <div className="col-xxl-4 col-xl-6 col-lg-6 col-md-6" key={folder._id}>
                              <div
                                className="card custom-card shadow-none border folder-card"
                                onClick={() => fetchFolderContents(folder._id)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="card-body">
                                  <div className="d-flex align-items-center gap-3 flex-wrap">
                                    <div className="folder-icon">
                                      {getFolderIcon()}
                                    </div>
                                    <div className="flex-fill">
                                      <a href="javascript:void(0);" className="d-block fw-medium">
                                        {folder.name}
                                      </a>
                                      <span className="fs-12 text-muted">
                                        Created: {new Date(folder.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <div className="text-end">
                                      <span className="badge bg-light text-default">
                                        {files.filter(f => f.folder_id === folder._id).length} files
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Files List (shown when not in Folders tab) */}
                  {activeTab !== 'folders' && (
                    <div className="p-3">
                      <div className="table-responsive border border-bottom-0">
                        <table className="table text-nowrap table-hover">
                          <thead>
                            <tr>
                              <th scope="col">Name</th>
                              <th scope="col">Category</th>
                              <th scope="col">Size</th>
                              <th scope="col">Date Modified</th>
                              <th scope="col">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="files-list">
                            {currentFiles.length > 0 ? (
                              currentFiles.map(file => (
                                <tr key={file._id}>
                                  <th scope="row">
                                    <div className="d-flex align-items-center">
                                      <div className="me-0">
                                        <span className="avatar avatar-md">
                                          {getFileIcon(file.file_type)}
                                        </span>
                                      </div>
                                      <div>
                                        <a href="javascript:void(0);" onClick={() => getFileDetails(file._id)}>
                                          {file.file_name}
                                        </a>
                                      </div>
                                    </div>
                                  </th>
                                  <td>{file.file_type}</td>
                                  <td>{formatFileSize(file.file_size)}</td>
                                  <td>{new Date(file.uploaded_at).toLocaleDateString()}</td>
                                  <td>
                                    <div className="hstack gap-2 fs-15">
                                      <button
                                        className="btn btn-icon btn-sm btn-primary2-light"
                                        onClick={() => handleDownload(file._id)}
                                      >
                                        <i className="ri-download-line" />
                                      </button>
                                      {activeTab !== 'shared' && (
                                        <>
                                          <button
                                            className="btn btn-icon btn-sm btn-primary-light"
                                            onClick={() => openShareModal(file._id)}
                                          >
                                            <i className="ri-share-forward-line" />
                                          </button>
                                          <button
                                            className="btn btn-icon btn-sm btn-warning-light"
                                            onClick={() => openMoveModal(file._id)}
                                          >
                                            <i className="ri-folder-shared-line" />
                                          </button>
                                        </>
                                      )}
                                      <button
    className="btn btn-icon btn-sm btn-danger-light"
    onClick={() => handleDelete(file._id)}
>
    <i className="ri-delete-bin-line" />
</button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="5" className="text-center py-4">
                                  {currentFolder ? 'This folder is empty' : 'No files found'}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Storage Info */}
          <div className="col-xxl-3">
            <div className="card custom-card overflow-hidden">
              <div className="card-body">
                <div className="d-flex align-items-start gap-3">
                  <div>
                    <span className="avatar avatar-md bg-secondary-transparent">
                      <i className="ri-hard-drive-2-fill fs-16" />
                    </span>
                  </div>
                  <div className="flex-fill">
                    <div className="mb-3">
                      {" "}
                      Storage Usage
                      <p className="mb-0">
                        <span className="fw-bold fs-14">
                          {formatFileSize(totalSize)}
                        </span> Used
                      </p>
                      <p className="fs-11 text-muted mb-0">
                        {totalFiles} files in {activeTab === 'all' ? 'total' : activeTab === 'owned' ? 'your files' : 'shared files'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer p-0">
                <div className="m-3 mb-0">
                  <span className="fs-12 text-muted">Storage Details</span>
                </div>
                <ul className="list-group list-group-flush">
                  {['image', 'video', 'audio', 'document', 'archive'].map(type => {
                    const typeFiles = currentFiles.filter(f => f.file_type === type);
                    const totalSize = typeFiles.reduce((acc, file) => acc + file.file_size, 0);
                    const percentage = totalFiles > 0 ? (typeFiles.length / totalFiles * 100).toFixed(0) : 0;

                    return (
                      <li className="list-group-item" key={type}>
                        <div className="d-flex align-items-center gap-3">
                          <div className="avatar avatar-lg bg-primary-transparent border border-primary border-opacity-10">
                            <div className="avatar avatar-sm text-primary">
                              {getFileIcon(type)}
                            </div>
                          </div>
                          <div className="flex-fill">
                            <span className="fw-medium">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                            <span className="text-muted fs-12 d-block">
                              {typeFiles.length} files
                            </span>
                          </div>
                          <div>
                            <span className="fw-medium text-primary mb-0 fs-14">
                              {formatFileSize(totalSize)}
                            </span>
                          </div>
                        </div>
                        <div
                          className="progress progress-md p-1 bg-primary-transparent mt-3"
                          role="progressbar"
                          aria-valuenow={percentage}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div
                            className="progress-bar progress-bar-striped progress-bar-animated"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Create Folder Modal */}
        <div
          className="modal fade"
          id="create-folder"
          tabIndex={-1}
          aria-labelledby="create-folder"
          data-bs-keyboard="false"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title">Create Folder</h6>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <label htmlFor="create-folder1" className="form-label">
                  Folder Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="create-folder1"
                  placeholder="Folder Name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                {currentFolder && (
                  <p className="mt-2 text-muted">
                    Will be created inside: {folders.find(f => f._id === currentFolder)?.name}
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-sm btn-icon btn-light"
                  data-bs-dismiss="modal"
                >
                  <i className="ri-close-fill" />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={handleCreateFolder}
                  disabled={!newFolderName.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">Share File</h6>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowShareModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Share with users:</label>
                    <div className="list-group" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {allUsers.map(user => (
                        <div key={user._id} className="list-group-item">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={usersToShare.includes(user._id)}
                              onChange={() => toggleUserSelection(user._id)}
                              id={`user-${user._id}`}
                            />
                            <label className="form-check-label" htmlFor={`user-${user._id}`}>
                              {user.firstName} {user.lastName} ({user.email})
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Permission:</label>
                    <select
                      className="form-select"
                      value={permission}
                      onChange={(e) => setPermission(e.target.value)}
                    >
                      <option value="view">View Only</option>
                      <option value="edit">Edit</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => setShowShareModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleShare}
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Move File Modal */}
        {showMoveModal && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">Move File to Folder</h6>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowMoveModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <div
                      className="list-group-item list-group-item-action"
                      onClick={() => handleMoveFile(fileToMove, null)}
                    >
                      <div className="d-flex align-items-center">
                        <div className="me-2">
                          <i className="ri-folder-line fs-16" />
                        </div>
                        <div>
                          Root Directory (No Folder)
                        </div>
                      </div>
                    </div>
                    {folders.map(folder => (
                      <div
                        key={folder._id}
                        className="list-group-item list-group-item-action"
                        onClick={() => handleMoveFile(fileToMove, folder._id)}
                      >
                        <div className="d-flex align-items-center">
                          <div className="me-2">
                            <i className="ri-folder-fill fs-16 text-warning" />
                          </div>
                          <div>
                            {folder.name}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => setShowMoveModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Files Modal */}
        {showCategoryModal && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h6 className="modal-title">
                    {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)} Files
                  </h6>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowCategoryModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="table-responsive">
                    <table className="table text-nowrap table-hover">
                      <thead>
                        <tr>
                          <th scope="col">File Name</th>
                          <th scope="col">Size</th>
                          <th scope="col">Date Modified</th>
                          <th scope="col">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filterFilesByCategory(currentCategory).map(file => (
                          <tr key={file._id}>
                            <th scope="row">
                              <div className="d-flex align-items-center">
                                <div className="me-2">
                                  <span className="avatar avatar-sm">
                                    {getFileIcon(file.file_type)}
                                  </span>
                                </div>
                                <div>
                                  <a href="javascript:void(0);" onClick={() => getFileDetails(file._id)}>
                                    {file.file_name}
                                  </a>
                                </div>
                              </div>
                            </th>
                            <td>{formatFileSize(file.file_size)}</td>
                            <td>{new Date(file.uploaded_at).toLocaleDateString()}</td>
                            <td>
                              <div className="hstack gap-2 fs-15">
                                <button
                                  className="btn btn-icon btn-sm btn-primary2-light"
                                  onClick={() => handleDownload(file._id)}
                                >
                                  <i className="ri-download-line" />
                                </button>
                                {activeTab !== 'shared' && (
                                  <button
                                    className="btn btn-icon btn-sm btn-primary-light"
                                    onClick={() => openShareModal(file._id)}
                                  >
                                    <i className="ri-share-forward-line" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-sm btn-light"
                    onClick={() => setShowCategoryModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* {showFileDetails && fileDetails && (
          <div className="offcanvas offcanvas-end show" tabIndex={-1} style={{ visibility: 'visible' }}>
            <div className="offcanvas-body p-0">
              <div className="selected-file-details">
                <div className="d-flex p-3 align-items-center justify-content-between border-bottom">
                  <div>
                    <h6 className="fw-medium mb-0">File Details</h6>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="dropdown me-1">
                      <button
                        className="btn btn-sm btn-icon btn-primary-light btn-wave waves-light waves-effect waves-light"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <i className="ri-more-2-fill" />
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setShowShareModal(true);
                              setShareFileId(fileDetails._id);
                              setShowFileDetails(false);
                            }}
                          >
                            Share
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item" onClick={() => handleDownload(fileDetails._id)}>
                            Download
                          </button>
                        </li>
                      </ul>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-icon btn-outline-light border"
                      onClick={() => setShowFileDetails(false)}
                    >
                      <i className="ri-close-line" />
                    </button>
                  </div>
                </div>
                <div className="filemanager-file-details" id="filemanager-file-details">
                  <div className="p-3 text-center border-bottom border-block-end-dashed">
                    <div className="file-details mb-3">
                      <span className="avatar avatar-xxl">
                        {getFileIcon(fileDetails.file_type)}
                      </span>
                    </div>
                    <div>
                      <p className="mb-0 fw-medium fs-16">
                        {fileDetails.file_name}
                      </p>
                      <p className="mb-0 text-muted fs-10">
                        {formatFileSize(fileDetails.file_size)} | {new Date(fileDetails.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 border-bottom border-block-end-dashed">
                    <ul className="list-group">
                      <li className="list-group-item">
                        <div>
                          <span className="fw-medium">File Format : </span>
                          <span className="fs-12 text-muted">{fileDetails.file_extension}</span>
                        </div>
                      </li>
                      <li className="list-group-item">
                        <div>
                          <p className="fw-medium mb-0">File Type : </p>
                          <span className="fs-12 text-muted">
                            {fileDetails.file_type}
                          </span>
                        </div>
                      </li>
                      <li className="list-group-item">
                        <p className="fw-medium mb-0">Owner : </p>
                        <span className="fs-12 text-muted">
                          {fileDetails.owner_id?.firstName} {fileDetails.owner_id?.lastName}
                        </span>
                      </li>
                    </ul>
                  </div>
                  {fileDetails.shared_with && fileDetails.shared_with.length > 0 && (
                    <div className="p-3">
                      <p className="mb-2 fw-medium fs-14">Shared With :</p>
                      {fileDetails.shared_with.map(share => (
                        <div key={share.user_id?._id} className="d-flex align-items-center p-2 mb-1">
                          <span className="avatar avatar-sm me-2 avatar-rounded">
                            {share.user_id?.image ? (
                              <img
                                src={
                                  share.user_id?.image.startsWith('http') || share.user_id?.image.startsWith('https')
                                    ? share.user_id?.image
                                    : `https://lavoro-back.onrender.com${share.user_id?.image}`
                                }
                                alt="Profile"
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/100";
                                }}
                              />
                            ) : (
                              <p>No profile image uploaded.</p>
                            )}
                          </span>
                          <span className="fw-medium flex-fill">
                            {share.user_id?.firstName} {share.user_id?.lastName}
                          </span>
                          <span className="badge bg-success-transparent fw-normal">
                            {share.permission}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )} */}


        {/* File Details Offcanvas */}
{showFileDetails && fileDetails && (
  <div className="offcanvas offcanvas-end show" tabIndex={-1} style={{ visibility: 'visible', width: '600px' }}>
    <div className="offcanvas-body p-0">
      <div className="selected-file-details">
        <div className="d-flex p-3 align-items-center justify-content-between border-bottom">
          <div>
            <h6 className="fw-medium mb-0">File Details</h6>
          </div>
          <div className="d-flex align-items-center">
            <div className="dropdown me-1">
              <button
                className="btn btn-sm btn-icon btn-primary-light btn-wave waves-light waves-effect waves-light"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="ri-more-2-fill" />
              </button>
              <ul className="dropdown-menu">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowShareModal(true);
                      setShareFileId(fileDetails._id);
                      setShowFileDetails(false);
                    }}
                  >
                    Share
                  </button>
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => handleDownload(fileDetails._id)}>
                    Download
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={() => {
                      handleDelete(fileDetails._id);
                      setShowFileDetails(false);
                    }}
                  >
                    Delete
                  </button>
                </li>
              </ul>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-icon btn-outline-light border"
              onClick={() => setShowFileDetails(false)}
            >
              <i className="ri-close-line" />
            </button>
          </div>
        </div>

        <div className="filemanager-file-details" id="filemanager-file-details">
          {/* File Preview Section */}
          <div className="p-3 border-bottom border-block-end-dashed" style={{ maxHeight: '400px', overflow: 'auto' }}>
            {fileDetails.file_type === 'image' && (
              <div className="text-center">
                <img
                  src={fileDetails.file_url}
                  alt={fileDetails.file_name}
                  className="img-fluid rounded"
                  style={{ maxHeight: '350px' }}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x300?text=Image+Not+Available";
                  }}
                />
              </div>
            )}

            {fileDetails.file_type === 'video' && (
              <div className="ratio ratio-16x9">
                <video controls className="rounded">
                  <source src={fileDetails.file_url} type={`video/${fileDetails.file_extension}`} />
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {fileDetails.file_type === 'audio' && (
              <div className="text-center">
                <div className="mb-3">
                  <i className="ri-music-2-line fs-1 text-primary"></i>
                </div>
                <audio controls className="w-100">
                  <source src={fileDetails.file_url} type={`audio/${fileDetails.file_extension}`} />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {fileDetails.file_type === 'document' && (
              <div className="text-center">
                {['pdf'].includes(fileDetails.file_extension) ? (
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(fileDetails.file_url)}&embedded=true`}
                    className="w-100"
                    style={{ height: '350px', border: 'none' }}
                    title={fileDetails.file_name}
                  ></iframe>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '200px' }}>
                    <i className="ri-file-text-line fs-1 text-muted"></i>
                    <p className="mt-2">Preview not available for this document type</p>
                    <button
                      className="btn btn-primary mt-2"
                      onClick={() => handleDownload(fileDetails._id)}
                    >
                      Download to View
                    </button>
                  </div>
                )}
              </div>
            )}

            {!['image', 'video', 'audio', 'document'].includes(fileDetails.file_type) && (
              <div className="text-center py-4">
                <div className="avatar avatar-xxl">
                  {getFileIcon(fileDetails.file_type)}
                </div>
                <p className="mt-2">No preview available for this file type</p>
                <button
                  className="btn btn-primary mt-2"
                  onClick={() => handleDownload(fileDetails._id)}
                >
                  Download File
                </button>
              </div>
            )}
          </div>

          {/* File Info Section */}
          <div className="p-3">
            <h6 className="fw-semibold mb-3">{fileDetails.file_name}</h6>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <p className="mb-1 text-muted">Type</p>
                  <p className="fw-medium">{fileDetails.file_type}</p>
                </div>

                <div className="mb-3">
                  <p className="mb-1 text-muted">Size</p>
                  <p className="fw-medium">{formatFileSize(fileDetails.file_size)}</p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-3">
                  <p className="mb-1 text-muted">Uploaded</p>
                  <p className="fw-medium">{new Date(fileDetails.uploaded_at).toLocaleDateString()}</p>
                </div>

                <div className="mb-3">
                  <p className="mb-1 text-muted">Format</p>
                  <p className="fw-medium text-uppercase">{fileDetails.file_extension}</p>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <p className="mb-1 text-muted">Owner</p>
              <div className="d-flex align-items-center">
                <span className="avatar avatar-sm me-2">
                  {fileDetails.owner_id?.image ? (
                    <img
                      src={
                        fileDetails.owner_id.image.startsWith('http') || fileDetails.owner_id.image.startsWith('https')
                          ? fileDetails.owner_id.image
                          : `https://lavoro-back.onrender.com${fileDetails.owner_id.image}`
                      }
                      alt="Owner"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/100";
                      }}
                    />
                  ) : (
                    <span className="avatar-initial bg-primary rounded-circle">
                      {fileDetails.owner_id?.firstName?.charAt(0)}{fileDetails.owner_id?.lastName?.charAt(0)}
                    </span>
                  )}
                </span>
                <span className="fw-medium">
                  {fileDetails.owner_id?.firstName} {fileDetails.owner_id?.lastName}
                </span>
              </div>
            </div>

            {fileDetails.shared_with && fileDetails.shared_with.length > 0 && (
              <div className="mb-3">
                <p className="mb-2 fw-medium">Shared With</p>
                <div className="d-flex flex-wrap gap-2">
                  {fileDetails.shared_with.map(share => (
                    <div key={share.user_id?._id} className="d-flex align-items-center bg-light rounded p-2">
                      <span className="avatar avatar-xs me-2">
                        {share.user_id?.image ? (
                          <img
                            src={
                              share.user_id.image.startsWith('http') || share.user_id.image.startsWith('https')
                                ? share.user_id.image
                                : `https://lavoro-back.onrender.com${share.user_id.image}`
                            }
                            alt="User"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/100";
                            }}
                          />
                        ) : (
                          <span className="avatar-initial bg-secondary rounded-circle">
                            {share.user_id?.firstName?.charAt(0)}{share.user_id?.lastName?.charAt(0)}
                          </span>
                        )}
                      </span>
                      <div>
                        <p className="mb-0 fw-medium small">
                          {share.user_id?.firstName} {share.user_id?.lastName}
                        </p>
                        <span className="badge bg-success-transparent small">
                          {share.permission}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <button
                className="btn btn-primary w-100"
                onClick={() => handleDownload(fileDetails._id)}
              >
                <i className="ri-download-line me-2"></i> Download File
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      </div>
    </>
  );
};

export default File;
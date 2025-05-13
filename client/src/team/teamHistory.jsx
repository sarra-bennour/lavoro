import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';


const TeamHistoryTimeline = () => {
    const { id: teamId } = useParams();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Get color based on change type
    const getColorByChangeType = (changeType) => {
        const typeColors = {
            'Team Created': 'primary1',
            'Team Updated': 'primary2',
            'Status Update': 'primary3',
            'Member Added': 'success',
            'Member Removed': 'danger',
            'Manager Changed': 'warning',
            'Tags Updated': 'info',
            'Description Updated': 'secondary',
            'Capacity Updated': 'primary',
            'Color Updated': 'purple',
            'Team Archived': 'dark',
            'Team Unarchived': 'success',
            'Other Update': 'light'
        };
        return typeColors[changeType] || 'primary';
    };

    // Safely format any value for display
    const formatValue = (value) => {
        if (value === null || value === undefined) return 'None';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    // Special formatting for array values
    const formatArrayValue = (value) => {
        if (!value) return 'None';
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'string') return value;
        return 'Invalid format';
    };

    // Generate appropriate description for each change type
    const formatChangeDescription = (item) => {
        const descriptions = {
            'Team Created': 'Team was created',
            'Team Updated': 'Team details were updated',
            'Status Update': `Status changed from ${formatValue(item.old_value)} to ${formatValue(item.new_value)}`,
            'Member Added': `Member added: ${item.additional_info?.member_name || 'Unknown'}`,
            'Member Removed': `Member removed: ${item.additional_info?.member_name || 'Unknown'}`,
            'Manager Changed': `Manager changed from ${formatValue(item.old_value)} to ${formatValue(item.new_value)}`,
            'Tags Updated': `Tags updated: ${formatArrayValue(item.new_value)}`,
            'Description Updated': 'Description was updated',
            'Capacity Updated': `Capacity changed from ${formatValue(item.old_value)} to ${formatValue(item.new_value)}`,
            'Color Updated': `Team color changed to ${formatValue(item.new_value)}`,
            'Team Archived': 'Team was archived',
            'Team Unarchived': 'Team was restored from archive',
            'Other Update': item.additional_info?.description || 'Team was updated'
        };
        return descriptions[item.change_type] || 'Team update occurred';
    };

    // Fetch team history from API
    useEffect(() => {
        const fetchTeamHistory = async () => {
            try {
                setLoading(true);
                setError('');
                
                const response = await axios.get(`https://lavoro-back.onrender.com/teams/history/${teamId}`);
                
                if (response.data.success) {
                    setHistory(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to load team history');
                }
            } catch (err) {
                console.error('API Error:', err);
                setError(err.response?.data?.message || 'Failed to fetch team history');
            } finally {
                setLoading(false);
            }
        };

        fetchTeamHistory();
    }, [teamId]);

    // Loading state
    if (loading) {
        return (
            <div className="d-flex justify-content-center py-4">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="alert alert-danger mx-3">
                <i className="ri-error-warning-line me-2"></i>
                {error}
            </div>
        );
    }

    // Empty state
    if (history.length === 0) {
        return (
            <div className="alert alert-info mx-3">
                <i className="ri-information-line me-2"></i>
                No history available for this team
            </div>
        );
    }


    

    // Main timeline rendering
    return (
        
        <div className="row justify-content-center timeline-3">
            <style>
  {`
    .avatar-initials {
      color: #000000; /* Dark black text */
      font-weight: 600; /* Make it slightly bolder */
    }
  `}
</style>
            <div className="col-xxl-11">
                <div className="card custom-card">
                    <div className="card-header pb-4">
                        <div className="card-title">Team History Timeline</div>
                    </div>
                    <div className="card-body pt-xxl-5 mt-xxl-5">
                        <div className="timeline-steps">
                            {history.map((item, index) => {
                                const changeDescription = formatChangeDescription(item);
                                const changedAt = item.changed_at ? new Date(item.changed_at) : new Date();
                                const userInitials = item.changed_by 
                                    ? `${item.changed_by.firstName?.charAt(0) || ''}${item.changed_by.lastName?.charAt(0) || ''}`
                                    : 'SY';
                                const colorClass = getColorByChangeType(item.change_type);

                                return (
                                    <div className="timeline-step" key={item._id || index}>
                                        <div className="timeline-content">
                                            <div className="inner-circle"></div>
                                            <div className={`card custom-card mb-0 border border-opacity-25 border-${colorClass} bg-${colorClass}-transparent ${index % 2 === 0 ? '' : 'content-top'}`}>
                                                <div className="card-body">
                                                <span className="avatar avatar-sm avatar-rounded">
  {item.changed_by?.image ? (
    <img 
      src={item.changed_by.image} 
      alt={`${item.changed_by.firstName || ''} ${item.changed_by.lastName || ''}`}
      onError={(e) => {
        e.target.onerror = null;
        e.target.parentElement.innerHTML = `<span class="avatar-initials">${userInitials}</span>`;
      }}
    />
  ) : (
    <span className="avatar-initials">{userInitials}</span>
  )}
</span>
                                                    <p className="fw-medium mt-1 mb-1">
                                                        {changedAt.toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="mb-1 fw-semibold">
                                                        {item.change_type || 'Update'}: 
                                                        <span className="text-muted fw-normal mb-0 mb-lg-0">
                                                            {' '}{changeDescription}
                                                        </span>
                                                    </p>
                                                    {item.additional_info?.notes && (
                                                        <p className="text-muted small mt-1 mb-0">
                                                            Notes: {item.additional_info.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamHistoryTimeline;
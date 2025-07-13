// DOM Elements
const postForm = document.getElementById('postForm');
const postContent = document.getElementById('postContent');
const mediaUpload = document.getElementById('mediaUpload');
const scheduledPosts = document.getElementById('scheduledPosts');
const noPostsMessage = document.getElementById('noPostsMessage');
const saveDraftBtn = document.getElementById('saveDraft');

// State
let posts = JSON.parse(localStorage.getItem('scheduledPosts')) || [];
let mediaFiles = [];

// Initialize the app
function init() {
    renderScheduledPosts();
    setupEventListeners();
}

// Set up event listeners
function setupEventListeners() {
    // Form submission
    postForm.addEventListener('submit', handleSubmit);
    
    // Media upload
    mediaUpload.addEventListener('change', handleMediaUpload);
    
    // Save draft
    saveDraftBtn.addEventListener('click', saveAsDraft);
}

// Handle form submission
function handleSubmit(e) {
    e.preventDefault();
    
    const content = postContent.value.trim();
    if (!content && mediaFiles.length === 0) {
        showAlert('Please enter some content or upload media', 'danger');
        return;
    }
    
    const selectedPlatforms = getSelectedPlatforms();
    if (selectedPlatforms.length === 0) {
        showAlert('Please select at least one platform', 'warning');
        return;
    }
    
    const scheduleTime = document.getElementById('scheduleTime').value;
    const post = {
        id: Date.now(),
        content,
        media: [...mediaFiles],
        platforms: selectedPlatforms,
        scheduledFor: scheduleTime || new Date().toISOString(),
        status: scheduleTime ? 'scheduled' : 'posted',
        createdAt: new Date().toISOString()
    };
    
    // Add to posts array
    posts.unshift(post);
    
    // Save to localStorage
    savePosts();
    
    // Render updated posts
    renderScheduledPosts();
    
    // Show success message
    const message = scheduleTime 
        ? 'Post scheduled successfully!'
        : 'Posted successfully!';
    
    showAlert(message, 'success');
    
    // Reset form
    resetForm();
}

// Handle media upload
function handleMediaUpload(e) {
    const files = Array.from(e.target.files);
    
    // Filter for image and video files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    const validFiles = files.filter(file => allowedTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
        showAlert('Only JPG, PNG, GIF, and MP4 files are allowed', 'warning');
    }
    
    // Add to media files array
    mediaFiles = [...mediaFiles, ...validFiles];
    
    // Show preview
    showMediaPreview();
}

// Show media preview
function showMediaPreview() {
    // Remove existing preview if any
    const existingPreview = document.getElementById('mediaPreview');
    if (existingPreview) {
        existingPreview.remove();
    }
    
    if (mediaFiles.length === 0) return;
    
    const previewContainer = document.createElement('div');
    previewContainer.id = 'mediaPreview';
    previewContainer.className = 'preview-container mt-3';
    
    mediaFiles.forEach((file, index) => {
        const preview = document.createElement('div');
        preview.className = 'media-item d-flex align-items-center mb-2';
        
        // Create preview element based on file type
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.className = 'img-thumbnail me-2';
            img.style.maxHeight = '50px';
            preview.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.className = 'img-thumbnail me-2';
            video.style.maxHeight = '50px';
            video.controls = false;
            preview.appendChild(video);
        }
        
        // Add file name
        const fileName = document.createElement('span');
        fileName.className = 'me-2 small';
        fileName.textContent = file.name;
        preview.appendChild(fileName);
        
        // Add remove button
        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-sm btn-outline-danger ms-auto';
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = () => removeMediaFile(index);
        preview.appendChild(removeBtn);
        
        previewContainer.appendChild(preview);
    });
    
    // Insert after media upload input
    mediaUpload.parentNode.insertBefore(previewContainer, mediaUpload.nextSibling);
}

// Remove media file from preview
function removeMediaFile(index) {
    mediaFiles.splice(index, 1);
    showMediaPreview();
    
    // If no more files, remove the preview container
    if (mediaFiles.length === 0) {
        const previewContainer = document.getElementById('mediaPreview');
        if (previewContainer) {
            previewContainer.remove();
        }
    }
}

// Get selected platforms with their display names and icons
function getSelectedPlatforms() {
    const platforms = [
        { value: 'facebook', name: 'Facebook', icon: 'fa-facebook', color: '#1877f2' },
        { value: 'x', name: 'X', icon: 'fa-x-twitter', color: '#000000' },
        { value: 'linkedin', name: 'LinkedIn', icon: 'fa-linkedin', color: '#0a66c2' },
        { value: 'instagram', name: 'Instagram', icon: 'fa-instagram', color: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }
    ];
    
    return Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => {
            return platforms.find(p => p.value === checkbox.value);
        })
        .filter(Boolean);
}

// Save as draft
function saveAsDraft() {
    const content = postContent.value.trim();
    if (!content && mediaFiles.length === 0) {
        showAlert('Nothing to save as draft', 'warning');
        return;
    }
    
    const selectedPlatforms = getSelectedPlatforms();
    const draft = {
        id: Date.now(),
        content,
        media: [...mediaFiles],
        platforms: selectedPlatforms,
        status: 'draft',
        createdAt: new Date().toISOString()
    };
    
    // Add to drafts (or update existing draft)
    const existingDraftIndex = posts.findIndex(p => p.status === 'draft');
    if (existingDraftIndex !== -1) {
        posts[existingDraftIndex] = draft;
    } else {
        posts.unshift(draft);
    }
    
    // Save to localStorage
    savePosts();
    
    // Render updated posts
    renderScheduledPosts();
    
    showAlert('Draft saved successfully!', 'success');
}

// Render scheduled posts
function renderScheduledPosts() {
    // Clear current posts
    scheduledPosts.innerHTML = '';
    
    if (posts.length === 0) {
        noPostsMessage.style.display = 'block';
        return;
    }
    
    noPostsMessage.style.display = 'none';
    
    // Sort posts by scheduled time (newest first)
    const sortedPosts = [...posts].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    // Create post elements
    sortedPosts.forEach(post => {
        const postElement = createPostElement(post);
        scheduledPosts.appendChild(postElement);
    });
}

// Create post element
function createPostElement(post) {
    const postElement = document.createElement('div');
    postElement.className = 'list-group-item post-item fade-in';
    postElement.dataset.id = post.id;
    
    // Format date
    const postDate = new Date(post.scheduledFor || post.createdAt);
    const formattedDate = postDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Status badge
    const statusClass = {
        'scheduled': 'bg-warning',
        'posted': 'bg-success',
        'draft': 'bg-secondary'
    }[post.status] || 'bg-secondary';
    
    // Platform badges
    const platformBadges = post.platforms.map(platform => {
        const platformInfo = getSelectedPlatforms().find(p => p.value === platform);
        if (!platformInfo) return '';
        
        const isGradient = platformInfo.color.includes('gradient');
        const style = isGradient 
            ? `background: ${platformInfo.color}; -webkit-background-clip: text; -webkit-text-fill-color: transparent;`
            : `color: ${platformInfo.color};`;
            
        return `
            <span class="platform-badge" style="border-color: ${isGradient ? '#e9ecef' : platformInfo.color}20; background: ${isGradient ? 'none' : platformInfo.color}10;">
                <i class="fab ${platformInfo.icon}" style="${style}"></i>
                ${platformInfo.name}
            </span>
        `;
    }).join('');
    
    // Media preview (first media item if any)
    let mediaPreview = '';
    if (post.media && post.media.length > 0) {
        const firstMedia = post.media[0];
        if (firstMedia.type.startsWith('image/')) {
            mediaPreview = `
                <div class="mt-2">
                    <img src="${firstMedia.preview || firstMedia}" 
                         class="img-thumbnail" 
                         style="max-height: 100px;">
                    ${post.media.length > 1 ? `+${post.media.length - 1} more` : ''}
                </div>`;
        } else if (firstMedia.type.startsWith('video/')) {
            mediaPreview = `
                <div class="mt-2">
                    <video src="${firstMedia.preview || firstMedia}"
                           class="img-thumbnail"
                           style="max-height: 100px;"
                           controls></video>
                    ${post.media.length > 1 ? `+${post.media.length - 1} more` : ''}
                </div>`;
        }
    }
    
    // Post HTML
    postElement.innerHTML = `
        <div class="d-flex justify-content-between align-items-start">
            <div>
                <div class="post-content mb-1">${post.content || '<em>No text content</em>'}</div>
                ${mediaPreview}
                <div class="post-meta mt-3">
                    <div class="d-flex flex-wrap align-items-center mb-2">
                        <span class="badge ${statusClass} me-2 mb-1">${post.status}</span>
                        <span class="me-auto">${formattedDate}</span>
                    </div>
                    <div class="platforms-container">
                        ${platformBadges}
                    </div>
                </div>
            </div>
            <div class="post-actions">
                ${post.status === 'scheduled' ? `
                    <button class="btn btn-sm btn-outline-success me-1" onclick="postNow(${post.id})">
                        <i class="fas fa-paper-plane"></i> Post Now
                    </button>
                ` : ''}
                ${post.status === 'draft' ? `
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="editDraft(${post.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                ` : ''}
                <button class="btn btn-sm btn-outline-danger" onclick="deletePost(${post.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    
    return postElement;
}

// Post now (for scheduled posts)
function postNow(postId) {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;
    
    // Update post status
    posts[postIndex].status = 'posted';
    posts[postIndex].scheduledFor = new Date().toISOString();
    
    // Save and re-render
    savePosts();
    renderScheduledPosts();
    
    showAlert('Posted successfully!', 'success');
}

// Edit draft
function editDraft(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    // Set form values
    postContent.value = post.content || '';
    
    // Set media files
    mediaFiles = post.media || [];
    showMediaPreview();
    
    // Set platforms
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = post.platforms.includes(checkbox.value);
    });
    
    // Remove the draft from the list
    posts = posts.filter(p => p.id !== postId);
    savePosts();
    renderScheduledPosts();
    
    // Scroll to form
    postContent.focus();
}

// Delete post
function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    posts = posts.filter(p => p.id !== postId);
    savePosts();
    renderScheduledPosts();
    
    showAlert('Post deleted', 'info');
}

// Save posts to localStorage
function savePosts() {
    // Convert File objects to a storable format
    const postsToSave = posts.map(post => {
        // If media contains File objects, we need to handle them
        const media = post.media ? post.media.map(file => {
            if (file instanceof File) {
                return {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    preview: file.type.startsWith('image/') || file.type.startsWith('video/') 
                        ? URL.createObjectURL(file) 
                        : null
                };
            }
            return file;
        }) : [];
        
        return {
            ...post,
            media
        };
    });
    
    localStorage.setItem('scheduledPosts', JSON.stringify(postsToSave));
}

// Reset form
function resetForm() {
    postForm.reset();
    mediaFiles = [];
    
    // Remove media preview if any
    const previewContainer = document.getElementById('mediaPreview');
    if (previewContainer) {
        previewContainer.remove();
    }
}

// Show alert
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        setTimeout(() => alertDiv.remove(), 150);
    }, 3000);
}

// Make functions available globally
window.postNow = postNow;
window.editDraft = editDraft;
window.deletePost = deletePost;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

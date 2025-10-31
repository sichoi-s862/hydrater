const API_BASE = '';

let currentUser = null;
let currentFilter = 'all';

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();
});

// Authentication
async function checkAuthStatus() {
  try {
    const response = await fetch(`${API_BASE}/auth/status`, {
      credentials: 'include'
    });
    const data = await response.json();

    if (data.authenticated) {
      currentUser = data.user;
      showDashboard();
      await loadUserProfile();
      await loadDrafts();
    } else {
      showLogin();
    }
  } catch (error) {
    console.error('Error checking auth:', error);
    showLogin();
  }
}

function login() {
  window.location.href = `${API_BASE}/auth/twitter`;
}

async function logout() {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    currentUser = null;
    showLogin();
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

function showLogin() {
  document.getElementById('login-page').classList.add('active');
  document.getElementById('dashboard').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('login-page').classList.remove('active');
  document.getElementById('dashboard').classList.remove('hidden');
  document.getElementById('username').textContent = `@${currentUser.username}`;
}

// Profile Management
async function loadUserProfile() {
  try {
    const response = await fetch(`${API_BASE}/api/user/profile`, {
      credentials: 'include'
    });
    const data = await response.json();

    document.getElementById('interests').value = data.interests?.join(', ') || '';
    document.getElementById('brand-direction').value = data.brandDirection || '';
    document.getElementById('author-style').value = data.authorStyle || '';
    document.getElementById('target-audience').value = data.targetAudience || '';
    document.getElementById('tone').value = data.tone || 'professional';
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const interests = document.getElementById('interests').value
    .split(',')
    .map(i => i.trim())
    .filter(i => i);

  const profile = {
    interests,
    brandDirection: document.getElementById('brand-direction').value,
    authorStyle: document.getElementById('author-style').value,
    targetAudience: document.getElementById('target-audience').value,
    tone: document.getElementById('tone').value
  };

  try {
    const response = await fetch(`${API_BASE}/api/user/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(profile)
    });

    if (response.ok) {
      showStatus('Profile saved successfully!', 'success');
    } else {
      showStatus('Failed to save profile', 'error');
    }
  } catch (error) {
    console.error('Error saving profile:', error);
    showStatus('Failed to save profile', 'error');
  }
});

// Content Actions
async function analyzeTendency() {
  showStatus('Analyzing your posting style...', 'info');

  try {
    const response = await fetch(`${API_BASE}/api/drafts/analyze`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      showStatus(`Analysis complete! Topics: ${data.analysis.commonTopics.slice(0, 3).join(', ')}`, 'success');
    } else {
      showStatus('Failed to analyze tendency', 'error');
    }
  } catch (error) {
    console.error('Error analyzing:', error);
    showStatus('Failed to analyze tendency', 'error');
  }
}

async function crawlContent() {
  showStatus('Crawling latest news...', 'info');

  try {
    const response = await fetch(`${API_BASE}/api/drafts/crawl`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      showStatus(`Found ${data.contentCount} relevant articles!`, 'success');
    } else {
      showStatus('Failed to crawl content', 'error');
    }
  } catch (error) {
    console.error('Error crawling:', error);
    showStatus('Failed to crawl content', 'error');
  }
}

async function generateDrafts() {
  showStatus('Generating drafts... This may take a moment.', 'info');

  try {
    const response = await fetch(`${API_BASE}/api/drafts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ count: 3 })
    });

    if (response.ok) {
      const data = await response.json();
      showStatus(`Generated ${data.drafts.length} drafts!`, 'success');
      await loadDrafts();
    } else {
      showStatus('Failed to generate drafts', 'error');
    }
  } catch (error) {
    console.error('Error generating drafts:', error);
    showStatus('Failed to generate drafts', 'error');
  }
}

// Drafts Management
async function loadDrafts(status) {
  try {
    const url = status ? `${API_BASE}/api/drafts?status=${status}` : `${API_BASE}/api/drafts`;
    const response = await fetch(url, { credentials: 'include' });
    const data = await response.json();

    renderDrafts(data.drafts);
  } catch (error) {
    console.error('Error loading drafts:', error);
  }
}

function renderDrafts(drafts) {
  const container = document.getElementById('drafts-list');

  if (!drafts || drafts.length === 0) {
    container.innerHTML = '<p class="empty-state">No drafts yet. Click "Generate Drafts" to get started!</p>';
    return;
  }

  container.innerHTML = drafts.map(draft => `
    <div class="draft-card">
      <div class="draft-content">${draft.editedContent || draft.content}</div>
      <div class="draft-meta">
        <span class="draft-status ${draft.status}">${draft.status}</span>
        <span>${new Date(draft.createdAt).toLocaleDateString()}</span>
      </div>
      <div class="draft-actions">
        ${draft.status !== 'published' ? `
          <button onclick="editDraft('${draft.id}')" class="btn">Edit</button>
          <button onclick="regenerateDraft('${draft.id}')" class="btn">Regenerate</button>
          <button onclick="publishDraft('${draft.id}')" class="btn btn-primary">Publish</button>
          <button onclick="deleteDraft('${draft.id}')" class="btn">Delete</button>
        ` : `
          <a href="https://twitter.com/${currentUser.username}/status/${draft.tweetId}" target="_blank" class="btn">View Tweet</a>
        `}
      </div>
    </div>
  `).join('');
}

function filterDrafts(status) {
  currentFilter = status;

  // Update active tab
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.filter === status) {
      tab.classList.add('active');
    }
  });

  loadDrafts(status === 'all' ? null : status);
}

async function editDraft(draftId) {
  const newContent = prompt('Edit your draft:');
  if (!newContent) return;

  try {
    const response = await fetch(`${API_BASE}/api/drafts/${draftId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ editedContent: newContent })
    });

    if (response.ok) {
      showStatus('Draft updated!', 'success');
      await loadDrafts();
    } else {
      showStatus('Failed to update draft', 'error');
    }
  } catch (error) {
    console.error('Error editing draft:', error);
    showStatus('Failed to update draft', 'error');
  }
}

async function regenerateDraft(draftId) {
  showStatus('Regenerating draft...', 'info');

  try {
    const response = await fetch(`${API_BASE}/api/drafts/${draftId}/regenerate`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      showStatus('Draft regenerated!', 'success');
      await loadDrafts();
    } else {
      showStatus('Failed to regenerate draft', 'error');
    }
  } catch (error) {
    console.error('Error regenerating draft:', error);
    showStatus('Failed to regenerate draft', 'error');
  }
}

async function publishDraft(draftId) {
  if (!confirm('Are you sure you want to publish this draft to X?')) return;

  showStatus('Publishing to X...', 'info');

  try {
    const response = await fetch(`${API_BASE}/api/drafts/${draftId}/publish`, {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      showStatus('Published successfully!', 'success');
      await loadDrafts();
    } else {
      showStatus('Failed to publish draft', 'error');
    }
  } catch (error) {
    console.error('Error publishing draft:', error);
    showStatus('Failed to publish draft', 'error');
  }
}

async function deleteDraft(draftId) {
  if (!confirm('Are you sure you want to delete this draft?')) return;

  try {
    const response = await fetch(`${API_BASE}/api/drafts/${draftId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (response.ok) {
      showStatus('Draft deleted', 'success');
      await loadDrafts();
    } else {
      showStatus('Failed to delete draft', 'error');
    }
  } catch (error) {
    console.error('Error deleting draft:', error);
    showStatus('Failed to delete draft', 'error');
  }
}

// Utility
function showStatus(message, type) {
  const statusEl = document.getElementById('action-status');
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;

  setTimeout(() => {
    statusEl.className = 'status-message';
  }, 5000);
}

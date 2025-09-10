// Wortholic Researcher - Enhanced JavaScript Integration
// Preserves all original GPT Researcher functionality while adapting to the new UI

const WortholicResearcher = (() => {
  // Preserve all original state variables
  let isResearchActive = false;
  let connectionTimeout = null;
  let conversationHistory = [];
  let isInitialLoad = true;
  let cookiesEnabled = true;
  let allReports = '';
  let currentReport = '';
  let isFirstReport = true;
  let chatContainer = null;
  let lastRequestData = null;

  // WebSocket monitoring variables
  let socket = null;
  let connectionStartTime = null;
  let lastActivityTime = null;
  let connectionAttempts = 0;
  let messagesReceived = 0;
  let websocketMonitorInterval = null;
  let dispose_socket = null;
  let reconnectAttempts = 0;
  let maxReconnectAttempts = 5;
  let reconnectInterval = 2000;

  const init = () => {
    
    // Check if cookies are enabled
    checkCookiesEnabled();

    // Load history immediately on page load
    loadConversationHistory();

    // After a short delay, mark initial load as complete
    setTimeout(() => {
      isInitialLoad = false;
    }, 1000);

    // Setup form submission - integrate with new UI
    const researchForm = document.getElementById('researchForm');
    if (researchForm) {
      researchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        startResearch();
        return false;
      });
    }

    // Initialize new UI elements
    initWortholicUI();

    // Initialize chat functionality for new UI
    initWortholicChat();

    // Initialize navigation
    initNavigation();

    updateState('initial');

  };

  // Initialize Wortholic-specific UI enhancements
  const initWortholicUI = () => {
    // Progress section integration
    const progressSection = document.getElementById('progressSection');
    const spinner = document.getElementById('spinner');
    
    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('open');
      });
    }

    // Auto-resize textarea
    const taskTextarea = document.getElementById('task');
    if (taskTextarea) {
      taskTextarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
      });
    }

    // Download button handlers
    initDownloadButtons();
  };

  // Initialize navigation
  const initNavigation = () => {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Add active class to clicked item
        this.classList.add('active');
        
        // Handle section switching
        const section = this.dataset.section;
        if (section) {
          handleSectionSwitch(section);
        }
      });
    });
  };

  // Handle section switching
  const handleSectionSwitch = (section) => {
    
    switch (section) {
      case 'research':
        // Already on research - do nothing
        break;
      case 'history':
        showHistoryPanel();
        break;
      case 'analytics':
        showToast('Analytics section coming soon!');
        break;
      case 'settings':
        showToast('Settings section coming soon!');
        break;
    }
  };

  // Show history in a more integrated way
  const showHistoryPanel = () => {
    loadConversationHistory();
    
    if (!conversationHistory || conversationHistory.length === 0) {
      showToast('No research history found');
      return;
    }

    // Create history display in the main content area
    const researchPanel = document.querySelector('.research-panel');
    if (researchPanel) {
      const historyHTML = generateHistoryHTML();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = historyHTML;
      tempDiv.className = 'history-display fade-in';
      
      // Replace research form temporarily
      const originalContent = researchPanel.innerHTML;
      researchPanel.innerHTML = '';
      researchPanel.appendChild(tempDiv);
      
      // Add back button
      const backBtn = document.createElement('button');
      backBtn.className = 'btn btn-secondary mb-3';
      backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Research';
      backBtn.addEventListener('click', () => {
        researchPanel.innerHTML = originalContent;
        // Re-initialize form handlers
        initWortholicUI();
        document.querySelector('.nav-item[data-section="research"]').classList.add('active');
        document.querySelector('.nav-item[data-section="history"]').classList.remove('active');
      });
      
      researchPanel.insertBefore(backBtn, tempDiv);
    }
  };

  // Generate HTML for history display
  const generateHistoryHTML = () => {
    let html = '<h2 style="margin-bottom: 2rem; color: var(--wortholic-dark);"><i class="fas fa-history"></i> Research History</h2>';
    
    conversationHistory.forEach((entry, index) => {
      const timestamp = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'Unknown date';
      const links = entry.links || {};
      
      html += `
        <div class="history-entry-card" style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; border: 1px solid #e5e7eb; cursor: pointer;" 
             onclick="loadResearchEntry(${index})">
          <h4 style="margin-bottom: 0.5rem; color: var(--wortholic-dark);">${entry.prompt || 'Unnamed Research'}</h4>
          <p style="color: #6b7280; margin-bottom: 1rem; font-size: 0.9rem;">${timestamp}</p>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${links.pdf ? `<a href="${links.pdf}" class="btn btn-sm btn-outline-primary" target="_blank" onclick="event.stopPropagation()"><i class="fas fa-file-pdf"></i> PDF</a>` : ''}
            ${links.docx ? `<a href="${links.docx}" class="btn btn-sm btn-outline-primary" target="_blank" onclick="event.stopPropagation()"><i class="fas fa-file-word"></i> Word</a>` : ''}
            ${links.md ? `<a href="${links.md}" class="btn btn-sm btn-outline-primary" target="_blank" onclick="event.stopPropagation()"><i class="fas fa-file-alt"></i> MD</a>` : ''}
          </div>
        </div>
      `;
    });
    
    return html;
  };

  // Initialize Wortholic chat interface
  const initWortholicChat = () => {
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');

    if (!chatInput || !chatSend || !chatMessages) return;

    // Chat input handlers
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendWortholicMessage();
      }
    });

    chatSend.addEventListener('click', sendWortholicMessage);

    // Auto-resize input
    chatInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });
  };

  // Send message in Wortholic chat interface
  const sendWortholicMessage = () => {
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    
    if (!chatInput || !chatMessages) return;
    
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addWortholicMessage(message, true);
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant loading-message';
    loadingDiv.innerHTML = `
      <strong>Wortholic Assistant</strong>
      <p><i class="fas fa-circle-notch fa-spin"></i> Analyzing your question...</p>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Send through WebSocket if available, otherwise simulate response
    const messageToSend = `chat ${JSON.stringify({ message: message })}`;
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(messageToSend);
    } else {
      // Simulate AI response for offline mode
      setTimeout(() => {
        loadingDiv.remove();
        addWortholicMessage("I'm ready to help analyze your research data. Please start a research above and I'll be able to provide specific insights about your findings.", false);
      }, 1500);
    }
  };

  // Add message to Wortholic chat interface
  const addWortholicMessage = (content, isUser = false) => {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    if (isUser) {
      messageDiv.innerHTML = `<p>${escapeHtml(content)}</p>`;
    } else {
      messageDiv.innerHTML = `<strong>Wortholic Assistant</strong><p>${content}</p>`;
    }
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  };

  // Initialize download buttons
  const initDownloadButtons = () => {
    const buttons = ['downloadPDF', 'downloadWord', 'downloadMD'];
    buttons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.addEventListener('click', function(e) {
          if (this.href === '#' || this.classList.contains('disabled')) {
            e.preventDefault();
            showToast('Please complete a research first');
          }
        });
      }
    });
  };

  // Start research with new UI integration
  const startResearch = () => {
    const progressSection = document.getElementById('progressSection');
    const spinner = document.getElementById('spinner');
    const submitBtn = document.getElementById('submitButton');
    const reportContainer = document.getElementById('reportContainer');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');

    // Clear previous results
    if (reportContainer) reportContainer.style.display = 'none';
    
    // Show progress
    if (progressSection) {
      progressSection.style.display = 'block';
      progressSection.classList.add('fade-in');
    }
    
    // Update submit button
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>Researching...';
    }

    // Enable chat
    if (chatInput && chatSend) {
      setTimeout(() => {
        chatInput.disabled = false;
        chatSend.disabled = false;
        chatInput.placeholder = "Research started! Ask me anything...";
      }, 2000);
    }

    // Reset state
    allReports = '';
    currentReport = '';
    isFirstReport = true;
    
    updateState('in_progress');
    
    // Add initial message to progress
    addAgentResponse({
      output: '🔍 Wortholic is gathering information and analyzing your research topic...'
    });

    // Start WebSocket connection
    dispose_socket = listenToSockEvents();
  };

  // WebSocket event handling (preserved from original)
  const listenToSockEvents = () => {
    const { protocol, host, pathname } = window.location;
    const ws_uri = `${protocol === 'https:' ? 'wss:' : 'ws:'}//${host}${pathname}ws`;

    connectionTimeout = setTimeout(() => {
      updateState('error');
    }, 30000);

    const converter = new showdown.Converter({
      ghCodeBlocks: true,
      tables: true,
      tasklists: true,
      smartIndentationFix: true,
      simpleLineBreaks: true,
      openLinksInNewWindow: true,
      parseImgDimensions: true
    });

    connectionAttempts++;
    socket = new WebSocket(ws_uri);
    let reportContent = '';
    let downloadLinkData = null;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      messagesReceived++;
      lastActivityTime = Date.now();

      if (data.type === 'logs') {
        addAgentResponse(data);
      } else if (data.type === 'report') {
        reportContent += data.output;
        const report_type = document.querySelector('select[name="report_type"]').value;
        
        if (report_type === 'detailed_report') {
          allReports += data.output;
          writeReport({ output: allReports, type: 'report' }, converter, false, false);
        } else {
          writeReport({ output: data.output, type: 'report' }, converter, false, true);
        }

        // Check if this appears to be the end of the report (contains conclusion or final content)
        if (data.output && (data.output.includes('## Conclusion') || data.output.includes('# Conclusion') || data.output.length > 500)) {
          // Set up download links after a short delay to allow report generation to complete
          setTimeout(() => {
            setupDownloadLinksFromTask();
            updateState('finished');
            isResearchActive = false;
          }, 2000);
        }
      } else if (data.type === 'path') {
        updateState('finished');
        downloadLinkData = updateDownloadLink(data);
        isResearchActive = false;

        if (reportContent && downloadLinkData) {
          saveToHistory(reportContent, downloadLinkData);
        }
      } else if (data.type === 'chat') {
        // Handle chat messages
        const loadingMessages = document.querySelectorAll('.loading-message');
        if (loadingMessages.length > 0) {
          loadingMessages[loadingMessages.length - 1].remove();
        }
        if (data.content) {
          addWortholicMessage(data.content, false);
        }
      }
    };

    socket.onopen = (event) => {
      clearTimeout(connectionTimeout);
      connectionStartTime = Date.now();
      lastActivityTime = Date.now();
      reconnectAttempts = 0;

      const task = document.getElementById('task').value;
      const report_type = document.querySelector('select[name="report_type"]').value;
      const report_source = document.querySelector('select[name="report_source"]').value;
      const tone = document.querySelector('select[name="tone"]').value;

      const requestData = {
        task: task,
        report_type: report_type,
        report_source: report_source,
        source_urls: [],
        tone: tone,
        agent: "Auto Agent",
        query_domains: []
      };

      lastRequestData = requestData;
      socket.send(`start ${JSON.stringify(requestData)}`);
    };

    socket.onclose = (event) => {
      connectionStartTime = null;
      if (isResearchActive) {
        reconnectWebSocket();
      }
    };

    socket.onerror = (error) => {
      updateState('error');
    };

    return () => {
      try {
        isResearchActive = false;
        if (socket && socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
          socket.close();
        }
        connectionStartTime = null;
      } catch (e) {
      }
    };
  };

  // Add agent response to progress section
  const addAgentResponse = (data) => {
    const output = document.getElementById('output');
    if (!output) return;
    
    const responseDiv = document.createElement('div');
    responseDiv.className = 'agent_response';
    responseDiv.innerHTML = data.output;
    output.appendChild(responseDiv);
    output.scrollTop = output.scrollHeight;
    output.style.display = 'block';
  };

  // Write report to container
  const writeReport = (data, converter, isFinal = false, append = false) => {
    const reportContainer = document.getElementById('reportContainer');
    if (!reportContainer) return;

    // Show report container
    reportContainer.style.display = 'block';

    const reportContent = document.getElementById('reportContent');
    if (!reportContent) {
      reportContainer.innerHTML = '<div id="reportContent"></div>';
    }

    const contentDiv = document.getElementById('reportContent');
    const markdownOutput = converter.makeHtml(data.output);

    if (isFinal || !append) {
      contentDiv.innerHTML = markdownOutput;
    } else {
      contentDiv.innerHTML += markdownOutput;
    }

    contentDiv.scrollTop = contentDiv.scrollHeight;
  };

  // Update download links
  const updateDownloadLink = (data) => {
    if (!data.output) return;

    const { pdf, docx, md, json } = data.output;
    const currentLinks = { pdf, docx, md, json };

    const updateLink = (id, path) => {
      const element = document.getElementById(id);
      if (element && path) {
        element.setAttribute('href', path);
        element.classList.remove('disabled');
      }
    };

    updateLink('downloadPDF', pdf);
    updateLink('downloadWord', docx);
    updateLink('downloadMD', md);

    return currentLinks;
  };

  // Setup download links from current task
  const setupDownloadLinksFromTask = async () => {
    try {
      const task = document.getElementById('task').value;
      if (!task) return;
      
      // Try to find recent files that match our research
      const response = await fetch('/outputs/');
      if (response.ok) {
        const html = await response.text();
        // Extract file names from directory listing that contain our task
        const cleanTask = task.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const fileRegex = new RegExp(`task_\\d+_[^"]*${cleanTask.substring(0, 10)}[^"]*\\.(pdf|docx|md)`, 'gi');
        const matches = html.match(fileRegex);
        
        if (matches && matches.length > 0) {
          // Get the most recent files (they should have similar names)
          const basePattern = matches[0].replace(/\.(pdf|docx|md)$/, '');
          
          const updateLink = (id, ext) => {
            const element = document.getElementById(id);
            if (element) {
              const filename = `${basePattern}.${ext}`;
              element.setAttribute('href', `/outputs/${filename}`);
              element.classList.remove('disabled');
              element.setAttribute('download', filename);
            }
          };

          updateLink('downloadPDF', 'pdf');
          updateLink('downloadWord', 'docx');
          updateLink('downloadMD', 'md');
          
          return true;
        }
      }
    } catch (error) {
    }
    
    // Fallback: Use generic approach based on task and current timestamp
    const task = document.getElementById('task').value;
    const timestamp = Math.floor(Date.now() / 1000);
    const cleanTask = task.replace(/[^a-zA-Z0-9]/g, '');
    const researchId = `task_${timestamp}_${cleanTask}`;
    
    const updateLink = (id, filename) => {
      const element = document.getElementById(id);
      if (element) {
        element.setAttribute('href', `/outputs/${researchId}.${filename}`);
        element.classList.remove('disabled');
        element.setAttribute('download', `${researchId}.${filename}`);
      }
    };

    updateLink('downloadPDF', 'pdf');
    updateLink('downloadWord', 'docx');
    updateLink('downloadMD', 'md');
    
    return false;
  };

  // Update UI state
  const updateState = (state) => {
    const submitBtn = document.getElementById('submitButton');
    const progressSection = document.getElementById('progressSection');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');

    switch (state) {
      case 'in_progress':
        isResearchActive = true;
        if (chatInput) chatInput.disabled = true;
        if (chatSend) chatSend.disabled = true;
        break;
        
      case 'finished':
        isResearchActive = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-search" style="margin-right: 8px;"></i>Begin Research';
        }
        if (chatInput) {
          chatInput.disabled = false;
          chatInput.placeholder = "Ask about your research...";
        }
        if (chatSend) chatSend.disabled = false;
        
        showToast('Research completed successfully!');
        break;
        
      case 'error':
        isResearchActive = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-search" style="margin-right: 8px;"></i>Begin Research';
        }
        showToast('Research failed. Please try again.', 5000);
        break;
        
      case 'initial':
        isResearchActive = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-search" style="margin-right: 8px;"></i>Begin Research';
        }
        break;
    }
  };

  // Show toast notification
  const showToast = (message, duration = 3000) => {
    let toast = document.getElementById('wortholic-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'wortholic-toast';
      toast.className = 'wortholic-toast';
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--wortholic-primary);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-size: 0.9rem;
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.transform = 'translateX(0)';

    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
    }, duration);
  };

  // Storage functions (preserved from original)
  const checkCookiesEnabled = () => {
    try {
      document.cookie = "testcookie=1; path=/";
      const cookieEnabled = document.cookie.indexOf("testcookie") !== -1;
      if (!cookieEnabled) {
        cookiesEnabled = false;
      } else {
        document.cookie = "testcookie=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        cookiesEnabled = true;
      }
      return cookieEnabled;
    } catch (e) {
      cookiesEnabled = false;
      return false;
    }
  };

  const setCookie = (name, value, days) => {
    if (!cookiesEnabled) {
      try {
        localStorage.setItem(name, value);
        return true;
      } catch (e) {
        return false;
      }
    }
    
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';
    return true;
  };

  const getCookie = (name) => {
    if (!cookiesEnabled) {
      try {
        return localStorage.getItem(name);
      } catch (e) {
        return null;
      }
    }
    
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  };

  const loadConversationHistory = () => {
    try {
      const storedHistory = getCookie('conversationHistory');
      if (storedHistory && storedHistory.trim() !== '') {
        conversationHistory = JSON.parse(storedHistory);
      } else {
        conversationHistory = [];
      }
    } catch (error) {
      conversationHistory = [];
    }
  };

  const saveConversationHistory = () => {
    try {
      if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(0, 20);
      }
      const storageHistory = conversationHistory.map(entry => ({
        prompt: entry.prompt || '',
        links: entry.links || {},
        timestamp: entry.timestamp || new Date().toISOString()
      }));
      setCookie('conversationHistory', JSON.stringify(storageHistory), 30);
    } catch (error) {
    }
  };

  const saveToHistory = (report, downloadLinks) => {
    if (!downloadLinks) return;

    const prompt = document.getElementById('task').value;
    const historyEntry = {
      prompt,
      links: {
        pdf: downloadLinks.pdf || '',
        docx: downloadLinks.docx || '',
        md: downloadLinks.md || '',
        json: downloadLinks.json || ''
      },
      timestamp: new Date().toISOString()
    };

    if (!conversationHistory) conversationHistory = [];
    conversationHistory.unshift(historyEntry);
    saveConversationHistory();
  };

  // Reconnect WebSocket
  const reconnectWebSocket = () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
      return false;
    }

    reconnectAttempts++;
    const backoff = reconnectInterval * Math.pow(1.5, reconnectAttempts - 1);

    setTimeout(() => {
      try {
        dispose_socket = listenToSockEvents();
        return true;
      } catch (e) {
        return false;
      }
    }, backoff);

    return true;
  };

  // Escape HTML
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // Global functions for history integration
  window.loadResearchEntry = (index) => {
    const entry = conversationHistory[index];
    if (!entry) return;

    document.getElementById('task').value = entry.prompt;
    
    // Switch back to research view
    const researchPanel = document.querySelector('.research-panel');
    const researchForm = document.getElementById('researchForm');
    
    if (researchPanel && !researchForm) {
      location.reload(); // Reload to get back to research form
    }
    
    showToast('Research parameters loaded. You can start the research again.');
  };

  return {
    init,
    startResearch,
    showToast,
    addWortholicMessage,
    sendWortholicMessage
  };
})();

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', WortholicResearcher.init);
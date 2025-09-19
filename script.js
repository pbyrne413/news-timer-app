class NewsTimer {
    constructor() {
        this.totalTimeLimit = 30 * 60; // 30 minutes in seconds
        this.isRunning = false;
        this.interval = null;
        this.currentSource = null;
        this.dailyTimeUsed = 0;
        this.sessionsCount = 0;
        this.autoStart = false;
        this.authToken = null; // Store authentication token
        
        // Individual source timers (will be loaded from API)
        this.sourceTimers = {};
        
        this.initializeElements();
        this.loadDataFromAPI(); // Try API first, fallback to localStorage
        this.setupEventListeners();
        // Don't auto-request notification permission - let user do it manually
    }
    
    // Get authentication token for admin operations
    async getAuthToken() {
        if (this.authToken) {
            console.log('Using cached auth token');
            return this.authToken;
        }
        
        try {
            console.log('Requesting new auth token from /dev-auth...');
            const response = await window.apiService.request('/dev-auth');
            console.log('Auth response:', response);
            this.authToken = response.token;
            console.log('Auth token obtained:', this.authToken ? 'Success' : 'Failed');
            console.log('Token value:', this.authToken);
            return this.authToken;
        } catch (error) {
            console.error('Failed to get auth token:', error);
            console.error('Error details:', error.message);
            throw error;
        }
    }
    
    async loadDataFromAPI() {
        const startTime = Date.now();
        try {
            // Load sources and settings from API with timeout
            const [sources, settings] = await Promise.all([
                Promise.race([
                    window.apiService.getSources(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Sources request timeout')), 15000)
                    )
                ]),
                Promise.race([
                    window.apiService.getSettings(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Settings request timeout')), 10000)
                    )
                ])
            ]);
            
            // Update source timers from API data
            // Don't overwrite local state if timer is currently running
            if (!this.isRunning) {
                this.sourceTimers = {};
                sources.forEach(source => {
                    this.sourceTimers[source.key] = {
                        allocated: source.allocated,
                        used: source.used,
                        sessions: source.sessions,
                        overrunTime: source.overrunTime || 0
                    };
                    
                    // Create DOM elements for sources that don't exist in the HTML
                    if (!document.querySelector(`.source-card[data-source="${source.key}"]`)) {
                        this.addSourceToUI(source.key, source.name, source.url, source.icon);
                    } else {
                        // Update existing source with favicon if URL is available
                        if (source.url) {
                            this.updateSourceIcon(source.key, source.url);
                        }
                    }
                });
            } else {
                // If timer is running, only update non-current sources to avoid jumps
                sources.forEach(source => {
                    if (source.key !== this.currentSource) {
                        this.sourceTimers[source.key] = {
                            allocated: source.allocated,
                            used: source.used,
                            sessions: source.sessions,
                            overrunTime: source.overrunTime || 0
                        };
                        
                        // Create DOM elements for sources that don't exist in the HTML
                        if (!document.querySelector(`.source-card[data-source="${source.key}"]`)) {
                            this.addSourceToUI(source.key, source.name, source.url, source.icon);
                        } else {
                            // Update existing source with favicon if URL is available
                            if (source.url) {
                                this.updateSourceIcon(source.key, source.url, source.favicon_url);
                            }
                        }
                    }
                });
            }
            
            // Update settings
            this.totalTimeLimit = settings.totalTimeLimit;
            this.autoStart = Boolean(settings.autoStart); // Convert integer to boolean
            
            // Calculate daily time used
            // Don't overwrite if timer is currently running to avoid jumps
            if (!this.isRunning) {
                this.dailyTimeUsed = sources.reduce((sum, source) => sum + source.used, 0);
            }
            
            
            // Update UI
            this.initializeProgressElements(); // Initialize progress elements after data is loaded
            this.updateDisplay();
            this.loadSettingsIntoModal();
            
            // Mark as online mode
            this.isOnlineMode = true;
            this.updateConnectionStatus(true);
            
            const loadTime = Date.now() - startTime;
            console.log(`✅ Data loaded from API in ${loadTime}ms`);
            this.showNotification(`Connected to server. Data loaded in ${loadTime}ms.`, 'success');
            
        } catch (error) {
            console.error('Failed to load data from API:', error);
            this.showNotification('Server unavailable. Using offline mode with local storage.', 'warning');
            // Fallback to localStorage
            this.loadDataFromLocalStorage();
            this.initializeProgressElements(); // Initialize progress elements after data is loaded
            this.isOnlineMode = false;
            this.updateConnectionStatus(false);
        }
    }
    
    loadDataFromLocalStorage() {
        try {
            // Load from localStorage as fallback
            const savedData = localStorage.getItem('newsTimerData');
            if (savedData) {
                const data = JSON.parse(savedData);
                this.sourceTimers = data.sourceTimers || {};
                this.totalTimeLimit = data.totalTimeLimit || 30 * 60;
                this.autoStart = data.autoStart || false;
                this.dailyTimeUsed = data.dailyTimeUsed || 0;
            } else {
                this.initializeDefaultData();
            }
            
            this.updateDisplay();
            this.loadSettingsIntoModal();
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            this.initializeDefaultData();
        }
    }
    
    saveDataToLocalStorage() {
        try {
            const data = {
                sourceTimers: this.sourceTimers,
                totalTimeLimit: this.totalTimeLimit,
                autoStart: this.autoStart,
                dailyTimeUsed: this.dailyTimeUsed
            };
            localStorage.setItem('newsTimerData', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
        }
    }
    
    initializeDefaultData() {
        // Start with empty source timers - all sources come from database
        this.sourceTimers = {};
        this.updateDisplay();
    }
    
    initializeElements() {
        // Main timer elements
        this.totalTimeDisplay = document.getElementById('total-time-left'); // May be null if removed
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.totalTimeLimitInput = document.getElementById('total-time-limit');
        this.autoStartCheckbox = document.getElementById('auto-start');
        this.distributeTimeBtn = document.getElementById('distribute-time');
        
        // Stats elements
        this.timeUsedDisplay = document.getElementById('time-used');
        this.sessionsCountDisplay = document.getElementById('sessions-count');
        this.timeRemainingDisplay = document.getElementById('time-remaining');
        this.notification = document.getElementById('notification');
        
        // Modal elements
        this.settingsBtn = document.getElementById('settings-btn');
        this.settingsModal = document.getElementById('settings-modal');
        this.closeModalBtn = document.getElementById('close-modal');
        this.saveSettingsBtn = document.getElementById('save-settings');
        this.cancelSettingsBtn = document.getElementById('cancel-settings');
        this.exportDataBtn = document.getElementById('export-data');
        this.importDataBtn = document.getElementById('import-data');
        this.clearAllDataBtn = document.getElementById('clear-all-data');
        this.addSourceBtn = document.getElementById('add-source-btn');
        this.requestNotificationsBtn = document.getElementById('request-notifications');
        this.connectionStatus = document.getElementById('connection-status');
        
        // Math challenge modal elements
        this.mathChallengeModal = document.getElementById('math-challenge-modal');
        this.closeMathModalBtn = document.getElementById('close-math-modal');
        this.checkMathAnswerBtn = document.getElementById('check-math-answer');
        this.cancelMathChallengeBtn = document.getElementById('cancel-math-challenge');
        this.xValueInput = document.getElementById('x-value');
        this.yValueInput = document.getElementById('y-value');
        this.equation1Display = document.getElementById('equation1');
        this.equation2Display = document.getElementById('equation2');
        
        // Add source modal elements
        this.addSourceModal = document.getElementById('add-source-modal');
        this.closeAddSourceModalBtn = document.getElementById('close-add-source-modal');
        this.addSourceSubmitBtn = document.getElementById('add-source-submit');
        this.cancelAddSourceBtn = document.getElementById('cancel-add-source');
        this.newSourceNameInput = document.getElementById('new-source-name');
        this.newSourceIconInput = document.getElementById('new-source-icon');
        this.newSourceUrlInput = document.getElementById('new-source-url');
        this.newSourceAllocationInput = document.getElementById('new-source-allocation');
        
        // Progress elements (will be populated dynamically)
        this.sourceProgressElements = {};
        this.sourceUsedElements = {};
        this.sourceTotalElements = {};
        this.sourceAllocationElements = {};
        this.progressItems = {};
    }
    
    initializeProgressElements() {
        // Initialize progress elements for existing sources
        Object.keys(this.sourceTimers).forEach(source => {
            this.sourceProgressElements[source] = document.getElementById(`${source}-progress`);
            this.sourceUsedElements[source] = document.getElementById(`${source}-used`);
            this.sourceTotalElements[source] = document.getElementById(`${source}-total`);
            this.sourceAllocationElements[source] = document.getElementById(`${source}-alloc`);
            this.progressItems[source] = document.querySelector(`.source-card[data-source="${source}"]`);
            
            // Set up event listeners for progress items (source clicking)
            if (this.progressItems[source]) {
                this.progressItems[source].addEventListener('click', () => this.selectSource(source));
            }
            
            // Set up event listeners for source allocation changes in modal
            if (this.sourceAllocationElements[source]) {
                this.sourceAllocationElements[source].addEventListener('change', () => this.updateSourceAllocationFromModal(source));
            }
        });
    }
    
    setupEventListeners() {
        // Main timer controls
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // Settings modal
        this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
        this.closeModalBtn.addEventListener('click', () => this.closeSettingsModal());
        this.saveSettingsBtn.addEventListener('click', () => {
            console.log('Save settings button clicked');
            this.saveSettingsFromModal();
        });
        this.cancelSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
        this.distributeTimeBtn.addEventListener('click', () => {
            console.log('Distribute time button clicked');
            this.distributeTimeEvenly();
        });
        
        // Data management
        this.exportDataBtn.addEventListener('click', () => this.exportData());
        this.importDataBtn.addEventListener('click', () => this.importData());
        this.clearAllDataBtn.addEventListener('click', () => this.clearAllData());
        this.addSourceBtn.addEventListener('click', () => this.openMathChallenge());
        this.requestNotificationsBtn.addEventListener('click', () => this.requestNotificationPermission());
        
        // Math challenge modal
        this.closeMathModalBtn.addEventListener('click', () => this.closeMathChallenge());
        this.checkMathAnswerBtn.addEventListener('click', () => this.checkMathAnswer());
        this.cancelMathChallengeBtn.addEventListener('click', () => this.closeMathChallenge());
        
        // Add source modal
        this.closeAddSourceModalBtn.addEventListener('click', () => this.closeAddSourceModal());
        this.addSourceSubmitBtn.addEventListener('click', () => this.submitAddSource());
        this.cancelAddSourceBtn.addEventListener('click', () => this.closeAddSourceModal());
        
        // Progress item clicks and source allocation changes will be set up in initializeProgressElements()
        
        // Close modals when clicking outside
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeSettingsModal();
        });
        this.mathChallengeModal.addEventListener('click', (e) => {
            if (e.target === this.mathChallengeModal) this.closeMathChallenge();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Space to start/pause timer (not in input fields)
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
                }
            }
            
            // Escape to close modals
            if (e.code === 'Escape') {
                if (!this.settingsModal.classList.contains('hidden')) {
                    this.closeSettingsModal();
                }
                if (!this.mathChallengeModal.classList.contains('hidden')) {
                    this.closeMathChallenge();
                }
                if (!this.addSourceModal.classList.contains('hidden')) {
                    this.closeAddSourceModal();
                }
            }
        });
    }
    
    async selectSource(source) {
        // If timer is running and we're switching sources, pause first
        if (this.isRunning && this.currentSource !== source) {
            this.pause();
        }
        
        // Remove active class from all sources
        Object.keys(this.progressItems).forEach(s => {
            if (this.progressItems[s]) {
                this.progressItems[s].classList.remove('active', 'selected');
            }
        });
        
        // Add active class to selected source
        if (this.progressItems[source]) {
            this.progressItems[source].classList.add('active', 'selected');
        }
        this.currentSource = source;
        
        // Auto-start the timer for the selected source
        this._fromSelectSource = true; // Set flag
        this.start();
        
        this.showNotification(`Started ${this.getSourceDisplayName(source)} timer`, 'success');
    }
    
    start() {
        if (!this.currentSource) {
            this.showNotification('Please select a news source first.', 'warning');
            return;
        }
        
        if (this.dailyTimeUsed >= this.totalTimeLimit) {
            this.showNotification('Daily time limit reached! Please reset.', 'warning');
            return;
        }
        
        // Don't start if already running (unless we're switching sources)
        if (this.isRunning && this.interval) {
            return;
        }
        
        // Clear any existing interval to prevent multiple timers
        if (this.interval) {
            clearInterval(this.interval);
        }
        
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        if (this.totalTimeDisplay) {
            this.totalTimeDisplay.classList.add('running');
        }
        
        this.interval = setInterval(async () => {
            this.dailyTimeUsed++;
            this.sourceTimers[this.currentSource].used++;
            
            // Update overrun time if applicable
            if (this.sourceTimers[this.currentSource].used > this.sourceTimers[this.currentSource].allocated) {
                this.sourceTimers[this.currentSource].overrunTime = 
                    this.sourceTimers[this.currentSource].used - this.sourceTimers[this.currentSource].allocated;
            }
            
            this.updateDisplay();
            
            // Save to API every 10 seconds
            if (this.dailyTimeUsed % 10 === 0) {
                await this.saveCurrentState();
            }
            
            // Check if current source allocated time is reached (but allow overrun)
            if (this.sourceTimers[this.currentSource].used >= this.sourceTimers[this.currentSource].allocated) {
                this.sourceAllocatedTimeReached();
            }
            
            // Check if total daily time is up (this is the hard limit)
            if (this.dailyTimeUsed >= this.totalTimeLimit) {
                this.dailyTimeUp();
            }
        }, 1000);
        
        // Only show notification if not called from selectSource
        if (!this._fromSelectSource) {
            this.showNotification(`Started ${this.getSourceDisplayName(this.currentSource)} timer`, 'success');
        }
        this._fromSelectSource = false;
    }
    
    pause() {
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        if (this.totalTimeDisplay) {
            this.totalTimeDisplay.classList.remove('running');
        }
        
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        // Save current state when pausing
        this.saveCurrentState();
        
        this.showNotification('Timer paused.', 'info');
    }
    
    async reset() {
        this.pause();
        this.dailyTimeUsed = 0;
        this.currentSource = null;
        
        // Reset all source timers
        Object.keys(this.sourceTimers).forEach(source => {
            this.sourceTimers[source].used = 0;
            this.sourceTimers[source].sessions = 0;
            this.sourceTimers[source].overrunTime = 0;
            if (this.progressItems[source]) {
                this.progressItems[source].classList.remove('active', 'completed', 'overrun', 'selected');
                this.removeOverrunCounter(source);
            }
        });
        
        // Reset on server
        try {
            console.log('Resetting data on server...');
            console.log('API base URL:', window.apiService.baseUrl);
            
            // Get authentication token
            const token = await this.getAuthToken();
            console.log('Using auth token for reset');
            
            // Add timeout to prevent hanging
            const resetPromise = window.apiService.request('/reset', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Reset request timed out')), 10000)
            );
            
            await Promise.race([resetPromise, timeoutPromise]);
            console.log('Server reset successful');
            
            // Reload data from API to ensure UI is in sync
            if (this.isOnlineMode) {
                console.log('Reloading data from API...');
                await this.loadDataFromAPI();
                console.log('Data reloaded from API');
                
                // Force update the display after reloading data
                this.updateDisplay();
            } else {
                // For offline mode, just update the display with the reset values
                this.updateDisplay();
            }
        } catch (error) {
            console.error('Failed to reset data on server:', error);
            console.error('Error details:', error.message);
            // Even if server reset fails, update the display with local reset
            this.updateDisplay();
        }
        
        this.showNotification('All timers reset.', 'success');
    }
    
    async saveCurrentState() {
        if (this.isOnlineMode) {
            try {
                if (this.currentSource) {
                    const sourceData = this.sourceTimers[this.currentSource];
                    await window.apiService.recordUsage(
                        this.currentSource,
                        sourceData.used,
                        sourceData.sessions,
                        sourceData.overrunTime
                    );
                }
            } catch (error) {
                console.error('Failed to save current state to server:', error);
                // Fallback to localStorage
                this.saveDataToLocalStorage();
            }
        } else {
            // Save to localStorage when offline
            this.saveDataToLocalStorage();
        }
    }
    
    sourceAllocatedTimeReached() {
        // Mark this as a completed session
        this.sourceTimers[this.currentSource].sessions++;
        
        // Show warning that allocated time is reached but allow overrun
        this.showNotification(`⚠️ ${this.getSourceDisplayName(this.currentSource)} allocated time reached! You can continue but it will reduce time for other sources.`, 'warning');
        this.showBrowserNotification('Allocated Time Reached', `${this.getSourceDisplayName(this.currentSource)} allocated time reached! You can continue but it will reduce time for other sources.`);
        
        // Don't auto-pause - let user continue if they want
        // The source will show as "overrun" in red in the UI
    }
    
    dailyTimeUp() {
        this.pause();
        this.sessionsCount++;
        
        this.showNotification('⏰ Daily time limit reached! All timers stopped.', 'error');
        this.showBrowserNotification('Daily Limit Reached', 'Your daily news reading time limit has been reached!');
        
        // Save final state
        this.saveCurrentState();
    }
    
    updateDisplay() {
        
        // Update total time display
        const totalMinutes = Math.floor(this.totalTimeLimit / 60);
        const totalSeconds = this.totalTimeLimit % 60;
        const usedMinutes = Math.floor(this.dailyTimeUsed / 60);
        const usedSeconds = this.dailyTimeUsed % 60;
        const remainingMinutes = Math.floor((this.totalTimeLimit - this.dailyTimeUsed) / 60);
        const remainingSeconds = (this.totalTimeLimit - this.dailyTimeUsed) % 60;
        
        // Update total time display if element exists
        if (this.totalTimeDisplay) {
            this.totalTimeDisplay.textContent = `${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        
        this.timeUsedDisplay.textContent = `${usedMinutes.toString().padStart(2, '0')}:${usedSeconds.toString().padStart(2, '0')}`;
        this.timeRemainingDisplay.textContent = `${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        // Update individual source displays
        this.updateSourceDisplays();
        
        // Update progress bars if element exists
        const totalProgressElement = document.getElementById('total-progress');
        if (totalProgressElement) {
            const totalProgress = (this.dailyTimeUsed / this.totalTimeLimit) * 100;
            totalProgressElement.style.width = `${Math.min(totalProgress, 100)}%`;
        }
    }
    
    updateSourceDisplays() {
        Object.keys(this.sourceTimers).forEach(source => {
            const sourceData = this.sourceTimers[source];
            
            // Skip if elements don't exist yet (for dynamically added sources)
            if (!this.sourceProgressElements[source] || !this.sourceUsedElements[source] || !this.sourceTotalElements[source] || !this.progressItems[source]) {
                return;
            }
            
            // Update progress bar
            const progressPercent = (sourceData.used / sourceData.allocated) * 100;
            this.sourceProgressElements[source].style.width = `${Math.min(progressPercent, 100)}%`;
            
            // Update used/total time display
            const usedMinutes = Math.floor(sourceData.used / 60);
            const usedSeconds = sourceData.used % 60;
            const totalMinutes = Math.floor(sourceData.allocated / 60);
            const totalSeconds = sourceData.allocated % 60;
            
            this.sourceUsedElements[source].textContent = `${usedMinutes.toString().padStart(2, '0')}:${usedSeconds.toString().padStart(2, '0')}`;
            this.sourceTotalElements[source].textContent = `${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`;
            
            // Update visual state based on overrun
            if (sourceData.used > sourceData.allocated) {
                // Source is overrun - show in red
                this.progressItems[source].classList.remove('completed');
                this.progressItems[source].classList.add('overrun');
                this.sourceProgressElements[source].style.background = '#dc3545'; // Red
                
                // Add or update overrun counter
                this.addOverrunCounter(source, sourceData.used - sourceData.allocated);
            } else if (sourceData.used >= sourceData.allocated) {
                // Source exactly at allocated time - show as completed
                this.progressItems[source].classList.add('completed');
                this.progressItems[source].classList.remove('overrun');
                this.sourceProgressElements[source].style.background = '#28a745'; // Green
                
                // Remove overrun counter
                this.removeOverrunCounter(source);
            } else {
                // Source under allocated time - normal state
                this.progressItems[source].classList.remove('completed', 'overrun');
                this.sourceProgressElements[source].style.background = 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'; // Default blue
                
                // Remove overrun counter
                this.removeOverrunCounter(source);
            }
        });
    }
    
    async updateTotalTimeLimit() {
        const newLimit = parseInt(this.totalTimeLimitInput.value) * 60; // Convert to seconds
        if (newLimit > 0 && newLimit <= 120 * 60) { // Max 2 hours
            this.totalTimeLimit = newLimit;
            this.updateDisplay();
            
            // Save to API or localStorage
            if (this.isOnlineMode) {
                try {
                    await window.apiService.updateSettings({
                        totalTimeLimit: this.totalTimeLimit,
                        autoStart: this.autoStart
                    });
                } catch (error) {
                    console.error('Failed to update settings:', error);
                    this.saveDataToLocalStorage();
                }
            } else {
                this.saveDataToLocalStorage();
            }
        }
    }
    
    async updateAutoStart() {
        this.autoStart = this.autoStartCheckbox.checked;
        
        // Save to API or localStorage
        if (this.isOnlineMode) {
            try {
                await window.apiService.updateSettings({
                    totalTimeLimit: this.totalTimeLimit,
                    autoStart: this.autoStart
                });
            } catch (error) {
                console.error('Failed to update settings:', error);
                this.saveDataToLocalStorage();
            }
        } else {
            this.saveDataToLocalStorage();
        }
    }
    
    async distributeTimeEvenly() {
        console.log('distributeTimeEvenly called');
        
        try {
            // Get the current value from the input field, not the stored value
            const totalMinutes = parseInt(this.totalTimeLimitInput.value) || 30;
            this.totalTimeLimit = totalMinutes * 60; // Update the stored value too
            
            // Fetch current sources from API to ensure we have the complete list
            const sources = await window.apiService.getSources();
            console.log('distributeTimeEvenly - sources from API:', sources);
            
            if (sources.length === 0) {
                this.showNotification('No sources found to distribute time.', 'warning');
                return;
            }
            
            const minutesPerSource = Math.floor(totalMinutes / sources.length);
            const remainder = totalMinutes % sources.length;
            
            let index = 0;
            const updatePromises = [];
            
            sources.forEach(source => {
                let allocation = minutesPerSource;
                if (index < remainder) {
                    allocation += 1; // Distribute remainder
                }
                
                // Update local state
                if (this.sourceTimers[source.key]) {
                    this.sourceTimers[source.key].allocated = allocation * 60;
                }
                
                // Update on server
                updatePromises.push(
                    window.apiService.updateSourceAllocation(source.key, allocation * 60)
                );
                
                index++;
            });
            
            await Promise.all(updatePromises);
            console.log('distributeTimeEvenly - all allocations updated');
            
            // Update modal inputs if modal is open
            this.loadSettingsIntoModal();
            this.updateDisplay();
            this.showNotification(`Time distributed evenly: ${minutesPerSource} minutes per source.`, 'success');
            
        } catch (error) {
            console.error('Failed to distribute time evenly:', error);
            this.showNotification('Failed to distribute time evenly.', 'error');
        }
    }
    
    async updateSourceAllocationFromModal(source) {
        const newAllocation = parseInt(this.sourceAllocationElements[source].value) * 60; // Convert to seconds
        if (newAllocation >= 0 && newAllocation <= 30 * 60) { // Max 30 minutes
            this.sourceTimers[source].allocated = newAllocation;
            this.updateDisplay();
            
            // Save to API
            try {
                await window.apiService.updateSourceAllocation(source, newAllocation);
            } catch (error) {
                console.error('Failed to update source allocation:', error);
            }
        }
    }

    async deleteSource(sourceKey) {
        // Confirm deletion
        const sourceName = this.sourceTimers[sourceKey] ? 
            document.querySelector(`.source-card[data-source="${sourceKey}"] .source-info h3`)?.textContent || sourceKey : 
            sourceKey;
        
        if (!confirm(`Are you sure you want to delete "${sourceName}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            // Delete from server
            await window.apiService.deleteSource(sourceKey);
            
            // Remove from local state
            delete this.sourceTimers[sourceKey];
            
            // Remove from UI
            const progressItem = document.querySelector(`.source-card[data-source="${sourceKey}"]`);
            if (progressItem) {
                progressItem.remove();
            }
            
            // If this was the current source, clear it
            if (this.currentSource === sourceKey) {
                this.currentSource = null;
                this.pause();
            }
            
            // Update display
            this.updateDisplay();
            
            // Update allocation grid if settings modal is open
            if (!this.settingsModal.classList.contains('hidden')) {
                this.populateAllocationGrid();
            }
            
            // Reload settings modal to update the allocation grid
            this.loadSettingsIntoModal();
            
            this.showNotification(`Source "${sourceName}" deleted successfully.`, 'success');
            
        } catch (error) {
            console.error('Failed to delete source:', error);
            this.showNotification('Failed to delete source. Please try again.', 'error');
        }
    }
    
    openSettingsModal() {
        this.loadSettingsIntoModal(); // This already includes allocation grid population
        this.settingsModal.classList.remove('hidden');
    }
    
    closeSettingsModal() {
        this.settingsModal.classList.add('hidden');
    }
    
    loadSettingsIntoModal() {
        this.totalTimeLimitInput.value = Math.floor(this.totalTimeLimit / 60);
        this.autoStartCheckbox.checked = this.autoStart;
        
        // Clear existing allocation items
        const allocationGrid = document.querySelector('.allocation-grid');
        allocationGrid.innerHTML = '';
        
        // Create allocation items for all sources
        Object.keys(this.sourceTimers).forEach(source => {
            const sourceData = this.sourceTimers[source];
            const allocationItem = document.createElement('div');
            allocationItem.className = 'allocation-item';
            allocationItem.setAttribute('data-source', source);
            
            // Get source info (name, icon) - we need to find this from the DOM or API
            const progressItem = document.querySelector(`.source-card[data-source="${source}"]`);
            const sourceName = progressItem ? progressItem.querySelector('.source-info h3').textContent : source;
            const sourceIcon = progressItem ? progressItem.querySelector('.source-icon').textContent : '📰';
            
            allocationItem.innerHTML = `
                <label for="${source}-alloc">${sourceIcon} ${sourceName}:</label>
                <input type="number" id="${source}-alloc" value="${Math.floor(sourceData.allocated / 60)}" min="0" max="30" data-source="${source}">
                <span>minutes</span>
                <button class="btn-delete-source" data-source="${source}" title="Delete source">🗑️</button>
            `;
            
            allocationGrid.appendChild(allocationItem);
            
            // Set up event listeners
            const input = allocationItem.querySelector(`#${source}-alloc`);
            const deleteBtn = allocationItem.querySelector('.btn-delete-source');
            
            if (input) {
                this.sourceAllocationElements[source] = input;
                input.addEventListener('change', () => this.updateSourceAllocationFromModal(source));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteSource(source));
            }
        });
    }
    
    async saveSettingsFromModal() {
        console.log('saveSettingsFromModal called');
        await this.updateTotalTimeLimit();
        await this.updateAutoStart();
        this.closeSettingsModal();
        this.showNotification('Settings saved successfully.', 'success');
    }
    
    async exportData() {
        try {
            const [sources, settings, stats] = await Promise.all([
                window.apiService.getSources(),
                window.apiService.getSettings(),
                window.apiService.getStats()
            ]);
            
            const exportData = {
                sources,
                settings,
                stats,
                exportDate: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `news-timer-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            this.showNotification('Data exported successfully.', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showNotification('Export failed. Please try again.', 'error');
        }
    }
    
    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                // Import settings
                if (data.settings) {
                    await window.apiService.updateSettings(data.settings);
                }
                
                // Import source allocations
                if (data.sources) {
                    for (const source of data.sources) {
                        await window.apiService.updateSourceAllocation(source.key, source.allocated);
                    }
                }
                
                // Reload data from API
                await this.loadDataFromAPI();
                
                this.showNotification('Data imported successfully.', 'success');
            } catch (error) {
                console.error('Import failed:', error);
                this.showNotification('Import failed. Please check the file format.', 'error');
            }
        };
        
        input.click();
    }
    
    async clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            try {
                await window.apiService.resetData();
                await this.loadDataFromAPI();
                this.showNotification('All data cleared successfully.', 'success');
            } catch (error) {
                console.error('Clear data failed:', error);
                this.showNotification('Failed to clear data. Please try again.', 'error');
            }
        }
    }
    
    openMathChallenge() {
        // Check if we have fewer than 6 sources - if so, skip the challenge
        const sourceCount = Object.keys(this.sourceTimers).length;
        if (sourceCount < 6) {
            this.openAddSourceModal();
            return;
        }
        
        this.generateMathChallenge();
        this.mathChallengeModal.classList.remove('hidden');
    }
    
    closeMathChallenge() {
        this.mathChallengeModal.classList.add('hidden');
        this.xValueInput.value = '';
        this.yValueInput.value = '';
    }
    
    generateMathChallenge() {
        // Generate random integer solutions first
        const x = Math.floor(Math.random() * 20) - 10; // -10 to 10
        const y = Math.floor(Math.random() * 20) - 10; // -10 to 10
        
        // Generate random coefficients that will give integer solutions
        const a = Math.floor(Math.random() * 5) + 1;
        const b = Math.floor(Math.random() * 5) + 1;
        const c = Math.floor(Math.random() * 5) + 1;
        const d = Math.floor(Math.random() * 5) + 1;
        
        // Calculate constants (these will be integers since x, y, a, b, c, d are integers)
        const e = a * x + b * y;
        const f = c * x + d * y;
        
        // Calculate determinant
        const det = a * d - b * c;
        if (det === 0) {
            // Regenerate if determinant is zero
            this.generateMathChallenge();
            return;
        }
        
        // Store the correct integer solutions
        this.correctX = x;
        this.correctY = y;
        
        // Display equations
        this.equation1Display.textContent = `${a}x + ${b}y = ${e}`;
        this.equation2Display.textContent = `${c}x + ${d}y = ${f}`;
    }
    
    checkMathAnswer() {
        const userX = parseFloat(this.xValueInput.value);
        const userY = parseFloat(this.yValueInput.value);
        
        if (isNaN(userX) || isNaN(userY)) {
            this.showNotification('Please enter valid numbers for x and y.', 'warning');
            return;
        }
        
        // Since solutions are now integers, check for exact matches
        const xCorrect = Math.abs(userX - this.correctX) < 0.01;
        const yCorrect = Math.abs(userY - this.correctY) < 0.01;
        
        if (xCorrect && yCorrect) {
            this.showNotification('Correct! You may proceed to add a new source.', 'success');
            this.closeMathChallenge();
            this.openAddSourceModal();
        } else {
            this.showNotification(`Incorrect. The correct answers are x = ${this.correctX.toFixed(1)}, y = ${this.correctY.toFixed(1)}. Try again.`, 'error');
            this.xValueInput.value = '';
            this.yValueInput.value = '';
        }
    }
    
    openAddSourceModal() {
        // Reset form
        this.newSourceNameInput.value = '';
        this.newSourceIconInput.value = '📰';
        this.newSourceUrlInput.value = '';
        this.newSourceAllocationInput.value = '5';
        
        // Show modal
        this.addSourceModal.classList.remove('hidden');
    }
    
    closeAddSourceModal() {
        this.addSourceModal.classList.add('hidden');
    }
    
    async submitAddSource() {
        const name = this.newSourceNameInput.value.trim();
        const icon = this.newSourceIconInput.value.trim() || '📰';
        const url = this.newSourceUrlInput.value.trim();
        const allocation = parseInt(this.newSourceAllocationInput.value) * 60; // Convert to seconds
        
        if (!name) {
            this.showNotification('Source name cannot be empty.', 'error');
            return;
        }
        
        if (url && !this.isValidUrl(url)) {
            this.showNotification('Please enter a valid URL.', 'error');
            return;
        }
        
        try {
            const newSource = await window.apiService.addSource({
                name,
                icon,
                url: url || undefined,
                allocation
            });
            
            // Add to local sourceTimers
            this.sourceTimers[newSource.key] = {
                allocated: newSource.allocated,
                used: newSource.used,
                sessions: newSource.sessions,
                overrunTime: newSource.overrunTime
            };
            
            // Add to UI
            this.addSourceToUI(newSource.key, newSource.name, newSource.url, newSource.icon);
            
            // Redistribute time evenly
            await this.distributeTimeEvenly();
            
            // Update allocation grid if settings modal is open
            if (!this.settingsModal.classList.contains('hidden')) {
                this.populateAllocationGrid();
            }
            
            this.closeAddSourceModal();
            this.showNotification(`New source "${name}" added! Time has been redistributed evenly.`, 'success');
        } catch (error) {
            console.error('Failed to add new source:', error);
            this.showNotification('Failed to add new source. Please try again.', 'error');
        }
    }
    
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    addSourceToUI(sourceKey, sourceName, sourceUrl = null, sourceIcon = '📰') {
        // Sanitize inputs to prevent XSS
        const sanitizedSourceKey = this.sanitizeHtml(sourceKey);
        const sanitizedSourceName = this.sanitizeHtml(sourceName);
        
        // Get the progress grid container
        const progressGrid = document.querySelector('.sources-grid');
        
        // Create the new progress item using DOM methods instead of innerHTML
        const progressItem = document.createElement('div');
        progressItem.className = 'source-card';
        progressItem.setAttribute('data-source', sanitizedSourceKey);
        
        const sourceHeader = document.createElement('div');
        sourceHeader.className = 'source-header';
        
        const sourceIconDiv = document.createElement('div');
        sourceIconDiv.className = 'source-icon';
        sourceIconDiv.textContent = sourceIcon;
        
        const sourceInfo = document.createElement('div');
        sourceInfo.className = 'source-info';
        
        const sourceTitle = document.createElement('h3');
        sourceTitle.textContent = sanitizedSourceName;
        
        const sourceDescription = document.createElement('p');
        sourceDescription.textContent = this.generateSourceDescription(sourceName, sourceUrl);
        
        sourceInfo.appendChild(sourceTitle);
        sourceInfo.appendChild(sourceDescription);
        
        sourceHeader.appendChild(sourceIconDiv);
        sourceHeader.appendChild(sourceInfo);
        
        // Add URL if provided
        if (sourceUrl) {
            const progressUrl = document.createElement('a');
            progressUrl.className = 'progress-url';
            progressUrl.href = sourceUrl;
            progressUrl.target = '_blank';
            progressUrl.rel = 'noopener noreferrer';
            progressUrl.textContent = '🔗';
            progressUrl.title = sourceUrl;
            sourceHeader.appendChild(progressUrl);
        }
        
        // Delete button only in settings modal, not on main screen
        // (This will be handled in populateAllocationGrid)
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar progress-enhanced';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.id = `${sanitizedSourceKey}-progress`;
        
        progressBar.appendChild(progressFill);
        
        const progressTime = document.createElement('div');
        progressTime.className = 'progress-time';
        
        const usedSpan = document.createElement('span');
        usedSpan.id = `${sanitizedSourceKey}-used`;
        usedSpan.textContent = '0:00';
        
        const totalSpan = document.createElement('span');
        totalSpan.id = `${sanitizedSourceKey}-total`;
        totalSpan.textContent = '5:00';
        
        progressTime.appendChild(usedSpan);
        progressTime.appendChild(document.createTextNode(' / '));
        progressTime.appendChild(totalSpan);
        
        progressItem.appendChild(sourceHeader);
        progressItem.appendChild(progressBar);
        progressItem.appendChild(progressTime);
        
        // Add the new progress item to the grid
        progressGrid.appendChild(progressItem);
        
        // Add the new source to the settings modal allocation grid
        const allocationGrid = document.querySelector('.allocation-grid');
        
        const allocationItem = document.createElement('div');
        allocationItem.className = 'allocation-item';
        
        const label = document.createElement('label');
        label.setAttribute('for', `${sanitizedSourceKey}-alloc`);
        label.textContent = `📰 ${sanitizedSourceName}:`;
        
        const input = document.createElement('input');
        input.type = 'number';
        input.id = `${sanitizedSourceKey}-alloc`;
        input.value = '5';
        input.min = '0';
        input.max = '30';
        input.setAttribute('data-source', sanitizedSourceKey);
        
        const span = document.createElement('span');
        span.textContent = 'minutes';
        
        allocationItem.appendChild(label);
        allocationItem.appendChild(input);
        allocationItem.appendChild(span);
        
        allocationGrid.appendChild(allocationItem);
        
        // Re-initialize elements to include the new source
        this.initializeNewSourceElements(sourceKey);
        
        // Update source icon with favicon if URL is available
        if (sourceUrl) {
            this.updateSourceIcon(sourceKey, sourceUrl);
        }
        
        // Update the display
        this.updateDisplay();
    }
    
    initializeNewSourceElements(sourceKey) {
        // Add to progress elements
        this.sourceProgressElements[sourceKey] = document.getElementById(`${sourceKey}-progress`);
        this.sourceUsedElements[sourceKey] = document.getElementById(`${sourceKey}-used`);
        this.sourceTotalElements[sourceKey] = document.getElementById(`${sourceKey}-total`);
        this.sourceAllocationElements[sourceKey] = document.getElementById(`${sourceKey}-alloc`);
        
        // Add to progress items
        this.progressItems[sourceKey] = document.querySelector(`.source-card[data-source="${sourceKey}"]`);
        
        // Add event listeners for the new elements
        if (this.progressItems[sourceKey]) {
            this.progressItems[sourceKey].addEventListener('click', () => this.selectSource(sourceKey));
        }
        if (this.sourceAllocationElements[sourceKey]) {
            this.sourceAllocationElements[sourceKey].addEventListener('change', () => this.updateSourceAllocationFromModal(sourceKey));
        }
    }
    
    getSourceDisplayName(source) {
        // Try to get from UI first (for dynamically added sources)
        const progressItem = document.querySelector(`.source-card[data-source="${source}"] .source-info h3`);
        if (progressItem) {
            return progressItem.textContent;
        }
        
        // Fallback to predefined names
        const sourceNames = {
            'bbc-football': 'BBC Football',
            'bbc-headlines': 'BBC Headlines',
            'rte-headlines': 'RTE Headlines',
            'guardian-headlines': 'Guardian Headlines',
            'guardian-opinion': 'Guardian Opinion',
            'cnn': 'CNN'
        };
        
        return sourceNames[source] || source;
    }
    
    // Sanitize HTML to prevent XSS attacks
    sanitizeHtml(str) {
        if (typeof str !== 'string') return str;
        
        // Use a more secure approach that doesn't rely on innerHTML
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\//g, '&#x2F;');
    }
    
    // Get favicon URL for a given domain
    getFaviconUrl(url) {
        if (!url) return null;
        
        try {
            // Use our proxy endpoint which handles CORS and caching
            return `/api/favicon?url=${encodeURIComponent(url)}`;
        } catch (error) {
            console.warn('Invalid URL for favicon:', url);
            return null;
        }
    }
    
    // Update source icon with favicon
    async updateSourceIcon(sourceKey, url, storedFaviconUrl = null) {
        const sourceIcon = document.querySelector(`.source-card[data-source="${sourceKey}"] .source-icon`);
        if (!sourceIcon) return;
        
        // Use stored favicon URL if available, otherwise generate one
        const faviconUrl = storedFaviconUrl || this.getFaviconUrl(url);
        if (faviconUrl) {
            // Create an image element to test if favicon loads
            const img = new Image();
            // Remove crossOrigin to avoid CORS issues
            
            img.onload = () => {
                // Replace emoji with favicon image
                sourceIcon.innerHTML = `<img src="${faviconUrl}" alt="favicon" style="width: 24px; height: 24px; border-radius: 4px; background: white; padding: 2px;">`;
            };
            
            img.onerror = () => {
                this.handleFaviconError(sourceKey, url, sourceIcon);
            };
            
            img.src = faviconUrl;
        }
    }
    
    // Keep original emoji if favicon fails
    handleFaviconError(sourceKey, url, sourceIcon) {
        console.warn('Favicon failed to load for:', url);
        // Keep original emoji
    }
    
    // Add overrun counter to source card
    addOverrunCounter(sourceKey, overrunSeconds) {
        const sourceCard = document.querySelector(`.source-card[data-source="${sourceKey}"]`);
        if (!sourceCard) return;
        
        // Remove existing counter
        this.removeOverrunCounter(sourceKey);
        
        // Create new counter
        const counter = document.createElement('div');
        counter.className = 'overrun-counter';
        counter.textContent = Math.ceil(overrunSeconds / 60); // Show minutes overrun
        counter.title = `${Math.ceil(overrunSeconds / 60)} minutes over limit`;
        
        sourceCard.appendChild(counter);
    }
    
    // Remove overrun counter from source card
    removeOverrunCounter(sourceKey) {
        const sourceCard = document.querySelector(`.source-card[data-source="${sourceKey}"]`);
        if (!sourceCard) return;
        
        const existingCounter = sourceCard.querySelector('.overrun-counter');
        if (existingCounter) {
            existingCounter.remove();
        }
    }
    
    // Generate appropriate description for source
    generateSourceDescription(sourceName, sourceUrl) {
        if (!sourceUrl) {
            return 'News source';
        }
        
        try {
            const domain = new URL(sourceUrl).hostname.toLowerCase();
            
            // Generate descriptions based on domain or source name
            if (domain.includes('bbc')) {
                return 'British Broadcasting Corporation';
            } else if (domain.includes('guardian')) {
                return 'Independent journalism and analysis';
            } else if (domain.includes('cnn')) {
                return 'Global news and breaking stories';
            } else if (domain.includes('reuters')) {
                return 'International news and analysis';
            } else if (domain.includes('rte')) {
                return 'Irish news and current events';
            } else if (domain.includes('sport') || sourceName.toLowerCase().includes('sport')) {
                return 'Sports news and updates';
            } else if (sourceName.toLowerCase().includes('opinion')) {
                return 'Commentary and opinion pieces';
            } else if (sourceName.toLowerCase().includes('headlines')) {
                return 'Breaking news and current affairs';
            } else {
                return 'News and information';
            }
        } catch (error) {
            return 'News source';
        }
    }
    
    // Populate allocation grid dynamically
    populateAllocationGrid() {
        const allocationGrid = document.querySelector('.allocation-grid');
        if (!allocationGrid) return;
        
        // Clear existing allocation items
        allocationGrid.innerHTML = '';
        
        // Add allocation items for each source
        Object.keys(this.sourceTimers).forEach(sourceKey => {
            const sourceData = this.sourceTimers[sourceKey];
            const sourceCard = document.querySelector(`.source-card[data-source="${sourceKey}"]`);
            if (!sourceCard) return;
            
            const sourceName = sourceCard.querySelector('h3').textContent;
            const sourceIcon = sourceCard.querySelector('.source-icon').textContent;
            
            const allocationItem = document.createElement('div');
            allocationItem.className = 'allocation-item';
            
            allocationItem.innerHTML = `
                <label for="${sourceKey}-alloc">${sourceIcon} ${sourceName}:</label>
                <input type="number" id="${sourceKey}-alloc" value="${Math.floor(sourceData.allocated / 60)}" min="0" max="30" data-source="${sourceKey}">
                <span>minutes</span>
            `;
            
            allocationGrid.appendChild(allocationItem);
        });
        
        // Event listeners are set up in the populateAllocationGrid function above
    }
    
    updateConnectionStatus(isOnline) {
        if (this.connectionStatus) {
            if (isOnline) {
                this.connectionStatus.textContent = '🟢 Online Mode';
                this.connectionStatus.className = 'status-online';
            } else {
                this.connectionStatus.textContent = '🔴 Offline Mode';
                this.connectionStatus.className = 'status-offline';
            }
        }
    }
    
    showNotification(message, type = 'info') {
        this.notification.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.style.display = 'block';
        
        setTimeout(() => {
            this.notification.style.display = 'none';
        }, 3000);
    }
    
    showBrowserNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
        }
    }
    
    requestNotificationPermission() {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        this.showNotification('Notifications enabled! You will receive alerts when timers complete.', 'success');
                        this.requestNotificationsBtn.textContent = 'Notifications Enabled';
                        this.requestNotificationsBtn.disabled = true;
                    } else {
                        this.showNotification('Notifications were denied. You can enable them later in your browser settings.', 'warning');
                    }
                });
            } else if (Notification.permission === 'granted') {
                this.showNotification('Notifications are already enabled!', 'info');
                this.requestNotificationsBtn.textContent = 'Notifications Enabled';
                this.requestNotificationsBtn.disabled = true;
            } else {
                this.showNotification('Notifications were previously denied. Please enable them in your browser settings.', 'warning');
            }
        } else {
            this.showNotification('This browser does not support notifications.', 'warning');
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.newsTimer = new NewsTimer();
});

class NewsTimer {
    constructor() {
        this.totalTimeLimit = 30 * 60; // 30 minutes in seconds
        this.isRunning = false;
        this.interval = null;
        this.currentSource = null;
        this.dailyTimeUsed = 0;
        this.sessionsCount = 0;
        this.autoStart = false;
        
        // Individual source timers (will be loaded from API)
        this.sourceTimers = {};
        
        this.initializeElements();
        this.loadDataFromAPI(); // Try API first, fallback to localStorage
        this.setupEventListeners();
        // Don't auto-request notification permission - let user do it manually
    }
    
    async loadDataFromAPI() {
        try {
            // Load sources and settings from API
            const [sources, settings] = await Promise.all([
                window.apiService.getSources(),
                window.apiService.getSettings()
            ]);
            
            // Update source timers from API data
            this.sourceTimers = {};
            sources.forEach(source => {
                this.sourceTimers[source.key] = {
                    allocated: source.allocated,
                    used: source.used,
                    sessions: source.sessions,
                    overrunTime: source.overrunTime || 0
                };
            });
            
            // Update settings
            this.totalTimeLimit = settings.totalTimeLimit;
            this.autoStart = settings.autoStart;
            
            // Calculate daily time used
            this.dailyTimeUsed = sources.reduce((sum, source) => sum + source.used, 0);
            
            // Update UI
            this.initializeProgressElements(); // Initialize progress elements after data is loaded
            this.updateDisplay();
            this.loadSettingsIntoModal();
            
            // Mark as online mode
            this.isOnlineMode = true;
            this.updateConnectionStatus(true);
            this.showNotification('Connected to server. Data will be saved remotely.', 'success');
            
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
        // Fallback default data if API fails
        this.sourceTimers = {
            'bbc-football': { allocated: 5 * 60, used: 0, sessions: 0, overrunTime: 0 },
            'bbc-headlines': { allocated: 5 * 60, used: 0, sessions: 0, overrunTime: 0 },
            'rte-headlines': { allocated: 5 * 60, used: 0, sessions: 0, overrunTime: 0 },
            'guardian-headlines': { allocated: 5 * 60, used: 0, sessions: 0, overrunTime: 0 },
            'guardian-opinion': { allocated: 5 * 60, used: 0, sessions: 0, overrunTime: 0 },
            'cnn': { allocated: 5 * 60, used: 0, sessions: 0, overrunTime: 0 }
        };
        this.updateDisplay();
    }
    
    initializeElements() {
        // Main timer elements
        this.totalTimeDisplay = document.getElementById('total-time-left');
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
            this.progressItems[source] = document.querySelector(`.progress-item[data-source="${source}"]`);
            
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
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                if (this.isRunning) {
                    this.pause();
                } else {
                    this.start();
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
                this.progressItems[s].classList.remove('active');
            }
        });
        
        // Add active class to selected source
        if (this.progressItems[source]) {
            this.progressItems[source].classList.add('active');
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
        
        this.isRunning = true;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.totalTimeDisplay.classList.add('running');
        
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
        this.totalTimeDisplay.classList.remove('running');
        
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
                this.progressItems[source].classList.remove('active', 'completed', 'overrun');
            }
        });
        
        // Reset on server
        try {
            await window.apiService.resetData();
        } catch (error) {
            console.error('Failed to reset data on server:', error);
        }
        
        this.updateDisplay();
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
        
        this.totalTimeDisplay.textContent = `${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        this.timeUsedDisplay.textContent = `${usedMinutes.toString().padStart(2, '0')}:${usedSeconds.toString().padStart(2, '0')}`;
        this.timeRemainingDisplay.textContent = `${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        // Update individual source displays
        this.updateSourceDisplays();
        
        // Update progress bars
        const totalProgress = (this.dailyTimeUsed / this.totalTimeLimit) * 100;
        document.getElementById('total-progress').style.width = `${Math.min(totalProgress, 100)}%`;
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
            } else if (sourceData.used >= sourceData.allocated) {
                // Source exactly at allocated time - show as completed
                this.progressItems[source].classList.add('completed');
                this.progressItems[source].classList.remove('overrun');
                this.sourceProgressElements[source].style.background = '#28a745'; // Green
            } else {
                // Source under allocated time - normal state
                this.progressItems[source].classList.remove('completed', 'overrun');
                this.sourceProgressElements[source].style.background = 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'; // Default blue
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
        // Get the current value from the input field, not the stored value
        const totalMinutes = parseInt(this.totalTimeLimitInput.value) || 30;
        this.totalTimeLimit = totalMinutes * 60; // Update the stored value too
        const minutesPerSource = Math.floor(totalMinutes / Object.keys(this.sourceTimers).length);
        const remainder = totalMinutes % Object.keys(this.sourceTimers).length;
        
        let index = 0;
        const updatePromises = [];
        
        Object.keys(this.sourceTimers).forEach(source => {
            let allocation = minutesPerSource;
            if (index < remainder) {
                allocation += 1; // Distribute remainder
            }
            this.sourceTimers[source].allocated = allocation * 60;
            
            // Update on server
            updatePromises.push(
                window.apiService.updateSourceAllocation(source, allocation * 60)
            );
            
            index++;
        });
        
        try {
            await Promise.all(updatePromises);
        } catch (error) {
            console.error('Failed to update source allocations:', error);
        }
        
        // Update modal inputs if modal is open
        this.loadSettingsIntoModal();
        
        this.updateDisplay();
        this.showNotification(`Time distributed evenly: ${minutesPerSource} minutes per source.`, 'success');
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
    
    openSettingsModal() {
        this.loadSettingsIntoModal();
        this.settingsModal.classList.remove('hidden');
    }
    
    closeSettingsModal() {
        this.settingsModal.classList.add('hidden');
    }
    
    loadSettingsIntoModal() {
        this.totalTimeLimitInput.value = Math.floor(this.totalTimeLimit / 60);
        this.autoStartCheckbox.checked = this.autoStart;
        
        // Update source allocation inputs
        Object.keys(this.sourceTimers).forEach(source => {
            if (this.sourceAllocationElements[source]) {
                this.sourceAllocationElements[source].value = Math.floor(this.sourceTimers[source].allocated / 60);
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
        this.generateMathChallenge();
        this.mathChallengeModal.classList.remove('hidden');
    }
    
    closeMathChallenge() {
        this.mathChallengeModal.classList.add('hidden');
        this.xValueInput.value = '';
        this.yValueInput.value = '';
    }
    
    generateMathChallenge() {
        // Generate random coefficients for simultaneous equations
        const a = Math.floor(Math.random() * 5) + 1;
        const b = Math.floor(Math.random() * 5) + 1;
        const c = Math.floor(Math.random() * 5) + 1;
        const d = Math.floor(Math.random() * 5) + 1;
        
        // Calculate solutions
        const det = a * d - b * c;
        if (det === 0) {
            // Regenerate if determinant is zero
            this.generateMathChallenge();
            return;
        }
        
        const e = Math.floor(Math.random() * 20) + 1;
        const f = Math.floor(Math.random() * 20) + 1;
        
        this.correctX = (d * e - b * f) / det;
        this.correctY = (a * f - c * e) / det;
        
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
        
        const tolerance = 0.1;
        const xCorrect = Math.abs(userX - this.correctX) < tolerance;
        const yCorrect = Math.abs(userY - this.correctY) < tolerance;
        
        if (xCorrect && yCorrect) {
            this.showNotification('Correct! You may proceed to add a new source.', 'success');
            this.closeMathChallenge();
            this.addNewSource();
        } else {
            this.showNotification(`Incorrect. The correct answers are x = ${this.correctX.toFixed(1)}, y = ${this.correctY.toFixed(1)}. Try again.`, 'error');
            this.xValueInput.value = '';
            this.yValueInput.value = '';
        }
    }
    
    async addNewSource() {
        const sourceName = prompt('Enter the name for your new news source:');
        if (!sourceName || sourceName.trim() === '') {
            this.showNotification('Source name cannot be empty.', 'error');
            return;
        }
        
        try {
            const newSource = await window.apiService.addSource(sourceName, '📰', 5 * 60);
            
            // Add to local sourceTimers
            this.sourceTimers[newSource.key] = {
                allocated: newSource.allocated,
                used: newSource.used,
                sessions: newSource.sessions,
                overrunTime: newSource.overrunTime
            };
            
            // Add to UI
            this.addSourceToUI(newSource.key, newSource.name);
            
            // Redistribute time evenly
            await this.distributeTimeEvenly();
            
            this.showNotification(`New source "${sourceName}" added! Time has been redistributed evenly.`, 'success');
        } catch (error) {
            console.error('Failed to add new source:', error);
            this.showNotification('Failed to add new source. Please try again.', 'error');
        }
    }
    
    addSourceToUI(sourceKey, sourceName) {
        // Get the progress grid container
        const progressGrid = document.querySelector('.progress-grid');
        
        // Create the new progress item HTML
        const progressItemHTML = `
            <div class="progress-item" data-source="${sourceKey}">
                <div class="progress-info">
                    <span class="progress-icon">📰</span>
                    <span class="progress-label">${sourceName}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" id="${sourceKey}-progress"></div>
                </div>
                <div class="progress-time">
                    <span id="${sourceKey}-used">0:00</span> / <span id="${sourceKey}-total">5:00</span>
                </div>
            </div>
        `;
        
        // Add the new progress item to the grid
        progressGrid.insertAdjacentHTML('beforeend', progressItemHTML);
        
        // Add the new source to the settings modal allocation grid
        const allocationGrid = document.querySelector('.allocation-grid');
        const allocationItemHTML = `
            <div class="allocation-item">
                <label for="${sourceKey}-alloc">📰 ${sourceName}:</label>
                <input type="number" id="${sourceKey}-alloc" value="5" min="0" max="30" data-source="${sourceKey}">
                <span>minutes</span>
            </div>
        `;
        allocationGrid.insertAdjacentHTML('beforeend', allocationItemHTML);
        
        // Re-initialize elements to include the new source
        this.initializeNewSourceElements(sourceKey);
        
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
        this.progressItems[sourceKey] = document.querySelector(`.progress-item[data-source="${sourceKey}"]`);
        
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
        const progressItem = document.querySelector(`.progress-item[data-source="${source}"] .progress-label`);
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

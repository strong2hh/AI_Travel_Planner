// 简化版地图应用主逻辑
class MapApp {
    constructor() {
        this.map = null;
        this.geolocation = null;
        this.markers = [];
        this.currentLocation = null;
        this.config = null;
        this.recognition = null;
        this.isListening = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recordingTimer = null;
    }

    async init() {
        try {
            console.log('🚀 开始初始化地图应用...');
            
            // 步骤1: 加载配置
            console.log('📋 步骤1: 加载配置信息');
            this.config = await this.loadConfig();
            
            // 步骤2: 加载高德地图API
            console.log('🌍 步骤2: 加载高德地图API');
            await this.loadAMapAPI();
            
            // 步骤3: 创建地图
            console.log('🗺️ 步骤3: 创建地图实例');
            this.createMap();
            
            // 步骤4: 初始化事件
            console.log('🎛️ 步骤4: 初始化事件监听');
            this.initializeEvents();
            
            console.log('✅ 地图初始化成功');
            
        } catch (error) {
            console.error('❌ 初始化失败:', error);
            
            // 提供更详细的错误信息
            let errorDetails = `地图初始化失败: ${error.message}`;
            
            if (error.message.includes('网络连接')) {
                errorDetails += '\n• 请检查网络连接是否正常';
                errorDetails += '\n• 确保可以访问 https://webapi.amap.com';
            } else if (error.message.includes('API密钥')) {
                errorDetails += '\n• 请检查 application.properties 中的 amap.api-key 配置';
                errorDetails += '\n• 确保API密钥有效且未过期';
            }
            
            this.showError(errorDetails);
        }
    }

    // 加载配置文件
    async loadConfig() {
        try {
            // 从后端API获取配置
            const response = await fetch('/api/map/config');
            if (!response.ok) throw new Error('配置API加载失败');
            
            const configData = await response.json();
            
            // 输出获取到的配置信息，用于调试
            console.log('=== 地图配置信息 ===');
            console.log('中心点:', configData.center);
            console.log('缩放级别:', configData.zoom);
            console.log('地图样式:', configData.style);
            console.log('定位功能:', configData.enableGeolocation);
            if (configData.warning) {
                console.warn('配置警告:', configData.warning);
            }
            console.log('====================');
            
            // 转换配置格式以匹配原有结构
            const config = {
                apiKey: configData.apiKey || 'YOUR_API_KEY',
                securityJsCode: configData.securityJsCode || null, // 添加安全密钥
                center: configData.center || '116.397428,39.90923',
                zoom: configData.zoom || '12',
                style: configData.style || 'normal',
                enableGeolocation: configData.enableGeolocation !== undefined ? configData.enableGeolocation : true
            };
            
            // 如果有警告信息，显示给用户
            if (configData.warning) {
                console.warn(configData.warning);
            }
            
            return config;
        } catch (error) {
            console.error('配置加载失败:', error);
            // 使用默认配置
            return {
                apiKey: 'YOUR_API_KEY',
                center: '116.397428,39.90923',
                zoom: '12',
                style: 'normal',
                enableGeolocation: true
            };
        }
    }

    // 加载高德地图API
    loadAMapAPI() {
        return new Promise((resolve, reject) => {
            console.log('开始加载高德地图API...');
            
            // 检查是否已经加载
            if (window.AMap && typeof window.AMap.Map === 'function') {
                console.log('✓ AMap对象已存在，直接使用');
                resolve();
                return;
            }

            // 确保API密钥有效
            const apiKey = this.config.apiKey;
            
            // 检查是否为默认密钥或未配置
            if (!apiKey || apiKey === 'YOUR_API_KEY') {
                console.warn('⚠ 使用默认API密钥，可能需要配置有效的API密钥');
                // 显示更详细的错误信息
                this.showError('地图API密钥未配置，请检查application.properties中的amap.api-key设置');
            }

            // 获取安全密钥
            const securityJsCode = this.config.securityJsCode;
            
            // 构建API URL，使用更稳定的版本和参数
            const apiUrl = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Geolocation,AMap.Geocoder,AMap.ToolBar,AMap.Scale`;
            console.log('📡 加载API URL:', apiUrl);
            
            // 设置安全密钥
            if (securityJsCode) {
                window._AMapSecurityConfig = {
                    securityJsCode: securityJsCode
                };
            }
            
            const script = document.createElement('script');
            script.src = apiUrl;
            script.async = true;
            script.defer = true;
            
            let scriptLoaded = false;
            let amapReady = false;
            
            script.onload = () => {
                scriptLoaded = true;
                console.log('✓ 高德地图API脚本加载完成');
                
                // 等待AMap对象可用，使用更智能的检测
                const checkAMap = () => {
                    if (window.AMap && typeof window.AMap.Map === 'function') {
                        console.log('✓ AMap对象已可用');
                        amapReady = true;
                        return true;
                    }
                    return false;
                };
                
                // 立即检查一次
                if (checkAMap()) {
                    resolve();
                    return;
                }
                
                // 延迟检查，给AMap对象一些时间初始化
                let attempts = 0;
                const maxAttempts = 100; // 100次尝试，总共5秒
                const interval = setInterval(() => {
                    attempts++;
                    if (checkAMap()) {
                        clearInterval(interval);
                        resolve();
                        return;
                    }
                    
                    if (attempts % 10 === 0) {
                        console.log(`⏳ 等待AMap对象初始化... 尝试 ${attempts}/${maxAttempts}`);
                    }
                    
                    if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        console.error('❌ AMap对象加载超时，尝试次数:', attempts);
                        reject(new Error('AMap对象加载超时，请检查网络连接和API密钥配置'));
                    }
                }, 50); // 每50ms检查一次
                
                // 备用超时处理
                setTimeout(() => {
                    clearInterval(interval);
                    if (!amapReady) {
                        console.error('❌ AMap对象加载超时，强制失败');
                        reject(new Error('AMap对象加载超时，请检查网络连接和API密钥配置'));
                    }
                }, 8000); // 8秒超时
            };
            
            script.onerror = (error) => {
                console.error('❌ 高德地图API加载失败:', error);
                reject(new Error(`高德地图API加载失败: ${error.message}`));
            };
            
            // 添加加载状态监听
            script.onreadystatechange = function() {
                console.log('📄 脚本状态变化:', this.readyState);
                if (this.readyState === 'loaded' || this.readyState === 'complete') {
                    console.log('✓ 脚本状态: 完成加载');
                }
            };
            
            // 确保脚本添加到head中
            console.log('📥 添加脚本到页面...');
            document.head.appendChild(script);
            
            // 添加全局错误监听，捕获可能的网络错误
            window.addEventListener('error', (event) => {
                if (event.filename && event.filename.includes('amap.com')) {
                    console.error('🌐 网络错误捕获:', event);
                }
            });
        });
    }

    createMap() {
        try {
            console.log('开始创建地图，AMap对象状态:', typeof window.AMap, window.AMap);
            
            // 更严格的检查
            if (!window.AMap || typeof window.AMap.Map !== 'function') {
                console.error('AMap对象未正确加载:', {
                    AMap: typeof window.AMap,
                    AMap_Map: window.AMap ? typeof window.AMap.Map : 'undefined'
                });
                throw new Error('AMap.Map构造函数不可用');
            }
            
            const center = this.config.center ? this.config.center.split(',').map(Number) : [116.397428, 39.90923];
            const zoom = this.config.zoom ? parseInt(this.config.zoom) : 12;
            
            console.log('创建地图参数:', { center, zoom });
            
            // 简化的地图配置，添加更好的错误处理
            this.map = new window.AMap.Map('map', {
                zoom: zoom,
                center: center,
                viewMode: '2D', // 添加视图模式
                resizeEnable: true // 启用窗口大小调整
            });

            console.log('基础地图创建成功');

            // 延迟添加控件，避免立即访问可能未加载的功能
            setTimeout(() => {
                try {
                    if (window.AMap.Scale) {
                        this.map.addControl(new window.AMap.Scale());
                        console.log('比例尺控件添加成功');
                    }
                    
                    if (window.AMap.ToolBar) {
                        this.map.addControl(new window.AMap.ToolBar());
                        console.log('工具条控件添加成功');
                    }
                    
                    // 定位功能单独处理
                    this.initializeGeolocation();
                    
                    // 显示地图加载成功提示
                    this.showSuccess('地图加载成功');
                    
                } catch (error) {
                    console.warn('部分控件加载失败:', error);
                    this.showError('部分地图控件加载失败: ' + error.message);
                }
            }, 1000);
            
        } catch (error) {
            console.error('地图创建失败:', error);
            
            // 提供更详细的错误信息
            let errorMessage = '地图创建失败: ' + error.message;
            if (error.message.includes('APILoader')) {
                errorMessage += ' - 请检查API密钥是否正确配置';
            }
            
            this.showError(errorMessage);
            throw error;
        }
    }

    // 单独初始化定位功能
    initializeGeolocation() {
        try {
            if (window.AMap.Geolocation) {
                this.geolocation = new window.AMap.Geolocation({
                    enableHighAccuracy: true,
                    timeout: 10000
                });
                this.map.addControl(this.geolocation);
                console.log('定位功能初始化成功');
            }
        } catch (error) {
            console.warn('定位功能初始化失败:', error);
        }
    }

    initializeEvents() {
        // 地图点击事件
        this.map.on('click', (e) => {
            this.addMarker(e.lnglat);
        });
        
        // 初始化输入控件事件
        this.initializeInputEvents();
        
        // 初始化语音识别
        this.initializeSpeechRecognition();
    }
    
    // 初始化输入控件事件
    initializeInputEvents() {
        const searchInput = document.getElementById('search-input');
        const voiceBtn = document.getElementById('voice-btn');
        const voiceHint = document.getElementById('voice-hint');
        const aiSearchBtn = document.getElementById('ai-search-btn');
        
        // 文本输入搜索
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(searchInput.value);
            }
        });
        
        // AI搜索按钮点击事件
        aiSearchBtn.addEventListener('click', () => {
            this.handleAiSearch();
        });
        
        // 语音按钮长按事件
        let pressTimer;
        
        // 开始按下
        voiceBtn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            pressTimer = setTimeout(() => {
                this.startRecording();
            }, 200); // 200ms后开始录制
        });
        
        // 松开按钮
        voiceBtn.addEventListener('mouseup', (e) => {
            e.preventDefault();
            clearTimeout(pressTimer);
            if (this.isRecording) {
                this.stopRecording();
            }
        });
        
        // 触摸事件支持
        voiceBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            pressTimer = setTimeout(() => {
                this.startRecording();
            }, 200);
        });
        
        voiceBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            clearTimeout(pressTimer);
            if (this.isRecording) {
                this.stopRecording();
            }
        });
        
        // 鼠标悬停时显示提示
        voiceBtn.addEventListener('mouseenter', () => {
            if (!this.isRecording) {
                voiceHint.classList.add('visible');
            }
        });
        
        voiceBtn.addEventListener('mouseleave', () => {
            voiceHint.classList.remove('visible');
        });
        
        // 防止离开页面时仍在录音
        document.addEventListener('mouseleave', () => {
            if (this.isRecording) {
                this.stopRecording();
            }
        });
    }
    
    // 初始化语音识别
    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'zh-CN';
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('search-input').value = transcript;
                this.handleSearch(transcript);
            };
            
            this.recognition.onerror = (event) => {
                console.error('语音识别错误:', event.error);
                this.showError('语音识别失败: ' + event.error);
            };
            
            this.recognition.onend = () => {
                this.stopSpeechRecognition();
            };
        } else {
            console.warn('浏览器不支持语音识别API');
        }
    }
    
    // 切换语音识别状态
    toggleSpeechRecognition() {
        if (this.isListening) {
            this.stopSpeechRecognition();
        } else {
            this.startSpeechRecognition();
        }
    }
    
    // 开始语音识别
    startSpeechRecognition() {
        if (this.recognition) {
            try {
                this.recognition.start();
                this.isListening = true;
                document.getElementById('voice-btn').classList.add('listening');
                document.getElementById('search-input').placeholder = '正在聆听...';
            } catch (error) {
                console.error('语音识别启动失败:', error);
            }
        }
    }
    
    // 停止语音识别
    stopSpeechRecognition() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            document.getElementById('voice-btn').classList.remove('listening');
            document.getElementById('search-input').placeholder = '输入目的地或语音搜索...';
        }
    }
    
    // 处理搜索
    handleSearch(query) {
        if (!query.trim()) return;
        
        console.log('搜索关键词:', query);
        
        // 清除之前的标记
        this.clearMarkers();
        
        // 使用高德地图的地理编码服务
        if (window.AMap && AMap.Geocoder) {
            const geocoder = new AMap.Geocoder();
            
            geocoder.getLocation(query, (status, result) => {
                if (status === 'complete' && result.geocodes.length > 0) {
                    const location = result.geocodes[0].location;
                    
                    // 移动地图到搜索结果
                    this.map.setCenter([location.lng, location.lat]);
                    this.map.setZoom(15);
                    
                    // 添加标记
                    this.addMarker([location.lng, location.lat], { title: query });
                    
                    this.showSuccess(`找到目的地: ${query}`);
                } else {
                    this.showError(`未找到地点: ${query}`);
                }
            });
        } else {
            // 如果地理编码服务不可用，使用简化搜索
            this.showError('搜索功能当前不可用');
        }
    }
    
    // 处理AI搜索
    async handleAiSearch() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput.value.trim();
        
        if (!query) {
            this.showError('请输入要搜索的内容');
            return;
        }
        
        console.log('AI搜索关键词:', query);
        
        // 显示加载状态
        const aiBtn = document.getElementById('ai-search-btn');
        aiBtn.classList.add('loading');
        
        try {
            // 调用后端API
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: query })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // 处理ContentSplit后的结构化日程数据
                if (result.scheduleData && Object.keys(result.scheduleData).length > 0) {
                    // 更新行程管理器数据
                    if (window.scheduleManager) {
                        window.scheduleManager.updateScheduleData(result.scheduleData);
                    }
                    
                    // 显示成功消息
                    this.showSuccess(`AI生成${result.dayCount}天行程，共${result.totalItems}个景点`);
                    
                    // 可选：显示原始AI回复（用于调试）
                    if (result.originalResponse) {
                        this.showAiResponse(result.originalResponse);
                    }
                } else {
                    // 如果没有结构化数据，显示原始回复
                    this.showAiResponse(result.originalResponse || result.response);
                }
            } else {
                this.showError('AI回复获取失败: ' + result.error);
            }
            
        } catch (error) {
            console.error('AI搜索失败:', error);
            this.showError('AI搜索请求失败: ' + error.message);
        } finally {
            // 移除加载状态
            aiBtn.classList.remove('loading');
        }
    }
    
    // 显示AI回复对话框
    showAiResponse(response) {
        // 检查是否已存在对话框
        let dialog = document.getElementById('ai-response-dialog');
        
        if (!dialog) {
            // 创建对话框
            dialog = document.createElement('div');
            dialog.id = 'ai-response-dialog';
            dialog.className = 'ai-response-dialog';
            
            // 添加对话框结构
            dialog.innerHTML = `
                <div class="ai-response-header">
                    <div class="ai-response-title">AI助手回复</div>
                    <button class="ai-response-close">&times;</button>
                </div>
                <div class="ai-response-content"></div>
            `;
            
            // 添加到页面
            document.getElementById('container').appendChild(dialog);
            
            // 添加关闭事件
            dialog.querySelector('.ai-response-close').addEventListener('click', () => {
                dialog.classList.remove('visible');
            });
        }
        
        // 更新内容
        dialog.querySelector('.ai-response-content').textContent = response;
        
        // 显示对话框
        dialog.classList.add('visible');
    }
    
    // 清除所有标记
    clearMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
    }
    
    // 显示成功消息
    showSuccess(message) {
        console.log('成功:', message);
        // 可以在这里添加更美观的提示效果
    }
    
    // 开始录音
    async startRecording() {
        try {
            // 请求麦克风权限，优化音频质量
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000,
                    channelCount: 1
                } 
            });
            
            // 检查音频轨道是否支持
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                throw new Error('无法获取音频轨道');
            }
            
            console.log('音频轨道设置:', {
                sampleRate: audioTracks[0].getSettings().sampleRate,
                channelCount: audioTracks[0].getSettings().channelCount
            });
            
            // 配置MediaRecorder，优先使用PCM格式
            let options = {};
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = {
                    mimeType: 'audio/webm;codecs=opus',
                    audioBitsPerSecond: 16000
                };
            } else {
                options = {
                    mimeType: 'audio/webm',
                    audioBitsPerSecond: 16000
                };
            }
            
            this.mediaRecorder = new MediaRecorder(stream, options);
            this.audioChunks = [];
            
            // 收录音频数据
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                    console.log('收到音频数据块:', event.data.size, '字节');
                }
            };
            
            // 录音停止后的处理
            this.mediaRecorder.onstop = () => {
                if (this.audioChunks.length > 0) {
                    this.processAudioData();
                } else {
                    this.showError('录音数据为空，请重新录制');
                    document.getElementById('search-input').placeholder = '输入目的地或语音搜索...';
                }
            };
            
            // 开始录音，设置时间片为100ms以获得更好的实时性
            this.mediaRecorder.start(100);
            this.isRecording = true;
            
            // 更新UI状态
            document.getElementById('voice-btn').classList.add('listening');
            document.getElementById('search-input').placeholder = '正在录音...请清晰说话';
            document.getElementById('recording-indicator').style.display = 'block';
            
            // 开始计时
            let seconds = 0;
            this.recordingTimer = setInterval(() => {
                seconds++;
                const minutes = Math.floor(seconds / 60);
                const secs = seconds % 60;
                document.getElementById('recording-indicator').textContent = 
                    `录音中: ${minutes}:${secs.toString().padStart(2, '0')}`;
                
                // 录音时长提示
                if (seconds === 5) {
                    this.showToast('请继续说话，录音将自动停止', 'info');
                }
            }, 1000);
            
            console.log('开始录音，使用配置:', options);
            
        } catch (error) {
            console.error('录音启动失败:', error);
            this.showError('无法访问麦克风: ' + error.message);
            
            // 提供详细的错误提示
            if (error.name === 'NotAllowedError') {
                this.showError('请允许麦克风权限');
            } else if (error.name === 'NotFoundError') {
                this.showError('未找到麦克风设备');
            }
        }
    }
    
    // 停止录音
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // 关闭媒体流
            const tracks = this.mediaRecorder.stream.getTracks();
            tracks.forEach(track => track.stop());
            
            // 清除计时器
            if (this.recordingTimer) {
                clearInterval(this.recordingTimer);
                this.recordingTimer = null;
            }
            
            // 更新UI状态
            document.getElementById('voice-btn').classList.remove('listening');
            document.getElementById('search-input').placeholder = '正在处理...';
            document.getElementById('recording-indicator').style.display = 'none';
            
            console.log('停止录音');
        }
    }
    
    // 处理音频数据
    async processAudioData() {
        if (this.audioChunks.length === 0) {
            this.showError('录音数据为空');
            return;
        }
        
        try {
            // 创建音频Blob
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            
            // 创建FormData
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            
            // 显示处理状态
            document.getElementById('search-input').placeholder = '正在识别语音...';
            
            // 调用后端API进行语音识别
            const response = await fetch('/api/voice-recognition', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.success) {
                // 将识别结果放入输入框
                document.getElementById('search-input').value = result.text;
                
                // 自动触发搜索
                this.handleSearch(result.text);
                
                this.showSuccess(`语音识别成功: ${result.text}`);
            } else {
                this.showError('语音识别失败: ' + result.error);
                
                // 如果是配置问题，显示更详细的提示
                if (result.error && result.error.includes('未配置')) {
                    this.showError('请检查后端语音服务配置：VOICE_API_KEY, VOICE_APP_ID');
                }
            }
            
            // 重置输入框提示
            document.getElementById('search-input').placeholder = '输入目的地或语音搜索...';
            
        } catch (error) {
            console.error('语音识别失败:', error);
            
            // 网络错误处理
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                this.showError('网络连接失败，请检查网络连接');
            } else if (error.message.includes('HTTP错误')) {
                this.showError('服务器错误: ' + error.message);
            } else {
                this.showError('语音识别请求失败: ' + error.message);
            }
            
            document.getElementById('search-input').placeholder = '输入目的地或语音搜索...';
        }
    }

    addMarker(position, info = {}) {
        const marker = new window.AMap.Marker({
            position: position,
            map: this.map
        });

        if (info.title) {
            marker.setTitle(info.title);
            
            const infoWindow = new window.AMap.InfoWindow({
                content: `<div class="marker-info">
                    <h4>${info.title}</h4>
                </div>`,
                offset: new window.AMap.Pixel(0, -30)
            });

            marker.on('click', () => {
                infoWindow.open(this.map, marker.getPosition());
            });
        }

        this.markers.push(marker);
        return marker;
    }

    showError(message) {
        this.showToast(message, 'error');
    }
    
    showSuccess(message) {
        this.showToast(message, 'success');
    }
    
    // 显示提示信息
    showToast(message, type = 'error') {
        // 移除现有的提示
        this.removeExistingToasts();
        
        // 创建新的提示元素
        const toast = document.createElement('div');
        toast.className = `${type}-toast`;
        toast.textContent = message;
        
        // 添加到容器
        document.getElementById('toast-container').appendChild(toast);
        
        // 触发显示动画
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 3秒后自动消失
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    // 移除现有的提示
    removeExistingToasts() {
        const container = document.getElementById('toast-container');
        const existingToasts = container.querySelectorAll('.error-toast, .success-toast');
        existingToasts.forEach(toast => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }
}

// 路径规划功能类
class RoutePlanner {
    constructor(mapApp) {
        this.mapApp = mapApp;
        this.routePolyline = null;
        this.routeMarkers = [];
        this.config = null; // 初始化配置对象
        this.initializeRoutePanel();
    }
    
    // 初始化路径规划面板
    initializeRoutePanel() {
        // 检查是否已存在面板
        let panel = document.getElementById('route-plan-panel');
        
        if (!panel) {
            // 创建路径规划面板
            panel = document.createElement('div');
            panel.id = 'route-plan-panel';
            panel.className = 'route-plan-panel';
            
            panel.innerHTML = `
                <div class="route-plan-header">
                    <div class="route-plan-title">路线规划</div>
                    <button class="route-plan-close">&times;</button>
                </div>
                <div class="route-plan-content">
                    <div class="route-plan-section">
                        <div class="route-plan-section-title">
                            <span>📍</span> 路线信息
                        </div>
                        <div id="route-info" class="route-plan-info">
                            点击相邻地点之间的箭头查看路线规划
                        </div>
                    </div>
                    <div class="route-plan-section">
                        <div class="route-plan-section-title">
                            <span>🚗</span> 导航步骤
                        </div>
                        <div id="route-steps" class="route-plan-steps">
                            <div class="route-plan-step">
                                <span class="route-plan-step-icon">👉</span>
                                <span class="route-plan-step-text">请选择路线查看详细导航指引</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // 添加到页面
            document.getElementById('container').appendChild(panel);
            
            // 添加关闭事件
            panel.querySelector('.route-plan-close').addEventListener('click', () => {
                this.hideRoutePanel();
            });
        }
    }
    
    // 显示路径规划面板
    showRoutePanel() {
        const panel = document.getElementById('route-plan-panel');
        if (panel) {
            panel.classList.add('visible');
        }
    }
    
    // 隐藏路径规划面板
    hideRoutePanel() {
        const panel = document.getElementById('route-plan-panel');
        if (panel) {
            panel.classList.remove('visible');
        }
        this.clearRoute();
    }
    
    // 清除路线
    clearRoute() {
        // 清除地图上的路线
        if (this.routePolyline) {
            this.routePolyline.setMap(null);
            this.routePolyline = null;
        }
        
        // 清除路线标记
        this.routeMarkers.forEach(marker => {
            if (marker && marker.setMap) {
                marker.setMap(null);
            }
        });
        this.routeMarkers = [];
        
        // 清除所有可能的路线覆盖物（包括driving对象创建的）
        if (this.mapApp && this.mapApp.map && this.mapApp.map.getAllOverlays) {
            const overlays = this.mapApp.map.getAllOverlays();
            overlays.forEach(overlay => {
                // 检查是否是路径相关的覆盖物
                if (overlay.CLASS_NAME && (
                    overlay.CLASS_NAME.includes('Polyline') || 
                    overlay.CLASS_NAME.includes('Marker')
                )) {
                    this.mapApp.map.remove(overlay);
                }
            });
        }
    }
    
    // 规划路线
    async planRoute(startPlace, endPlace) {
        try {
            // 先清除上一条路线的痕迹
            this.clearRoute();
            
            // 显示加载状态
            this.updateRouteInfo('正在规划路线...', true);
            
            console.log('🚗 开始路径规划，直接使用地址:', {
                start: startPlace,
                end: endPlace
            });
            
            // 检查AMap是否可用
            if (!window.AMap) {
                throw new Error('高德地图API未加载，请检查网络连接和API密钥配置');
            }
            
            // 动态加载路径规划插件
            if (!window.AMap.Driving) {
                console.log('🚗 正在加载路径规划插件...');
                await this.loadDrivingPlugin();
            }
            
            if (window.AMap.Driving) {
                // 按照官方示例使用AMap.plugin加载
                await new Promise((resolve, reject) => {
                    AMap.plugin("AMap.Driving", () => {
                        const driving = new AMap.Driving({
                            map: null, // 不绑定到地图，手动控制显示
                            policy: 0, // 使用官方示例的policy: 0 (速度优先)
                            showTraffic: true, // 显示实时路况
                            hideMarkers: true // 隐藏标记点，由我们自己控制显示
                        });
                        

                        
                        // 保存this引用，以便在回调函数中使用
                        const self = this;
                        
                        // 从地址后面的括号中提取城市信息，例如"西湖（杭州）" -> "杭州"
                        function extractCityFromAddress(address) {
                            // 匹配格式：地址（城市）或地址(city)
                            const match = address.match(/（([^）]+)）|\(([^)]+)\)/);
                            if (match) {
                                // 如果找到括号内的城市，返回括号内的内容
                                return match[1] || match[2];
                            }
                            
                            // 默认返回空字符串，让高德地图自行判断
                            return "";
                        }
                        
                        // 按照官方示例格式，使用包含keyword和city的对象数组
                        const points = [
                            { keyword: startPlace, city: extractCityFromAddress(startPlace) }, // 起始点
                            { keyword: endPlace, city: extractCityFromAddress(endPlace) }   // 终点
                        ];
                        
                        driving.search(points, function (status, result) {
                        console.log('路径规划返回结果:', { status, result });
                        
                        if (status === 'complete') {
                            if (result.routes && result.routes.length > 0) {
                                const route = result.routes[0];
                                console.log('✅ 路径规划成功:', { 
                                    distance: route.distance, 
                                    time: route.time,
                                    steps: route.steps ? route.steps.length : 0
                                });
                                self.displayRouteResult(route, startPlace, endPlace);
                                resolve(route);
                            } else {
                                reject(new Error('未找到可行路线，请检查地点名称是否正确'));
                            }
                        } else if (status === 'error') {
                            console.error('❌ 路径规划错误:', result);
                            let errorMsg = '路径规划服务暂时不可用';
                            if (result && result.info) {
                                if (result.info.includes('INVALID_USER_KEY') || result.info.includes('KEY')) {
                                    errorMsg = 'API密钥配置问题，请检查密钥权限';
                                } else if (result.info.includes('QUOTA')) {
                                    errorMsg = 'API调用次数超限，请稍后重试';
                                } else {
                                    errorMsg = result.info;
                                }
                            }
                            reject(new Error(errorMsg));
                        } else {
                            console.log('⚠️ 路径规划状态异常:', status);
                            reject(new Error('路径规划失败，状态: ' + status));
                        }
                    });
                    });
                });
                
            } else {
                throw new Error('路径规划插件加载失败，请刷新页面重试');
            }
            
        } catch (error) {
            console.error('路径规划失败:', error);
            
            // 提供更友好的错误信息
            let errorMessage = '路径规划失败';
            if (error.message.includes('地址坐标转换失败')) {
                errorMessage = '无法获取地点坐标，请检查地点名称是否正确';
            } else if (error.message.includes('网络连接')) {
                errorMessage = '网络连接问题，请检查网络后重试';
            } else if (error.message.includes('API密钥')) {
                errorMessage = '地图服务配置问题，请联系管理员';
            } else {
                errorMessage = error.message;
            }
            
            this.updateRouteInfo(errorMessage, false);
        }
    }
    
    // 调用geocoding服务将地址转换为经纬度

    
    // 动态加载路径规划插件
    loadDrivingPlugin() {
        return new Promise((resolve, reject) => {
            // 检查是否已经加载了插件
            if (window.AMap && window.AMap.Driving) {
                resolve();
                return;
            }
            
            // 获取API密钥和安全密钥
            const apiKey = this.mapApp.config?.apiKey || 'YOUR_API_KEY';
            const securityJsCode = this.mapApp.config?.securityJsCode;
            

            
            // 如果API密钥无效，直接返回错误
            if (!apiKey || apiKey === 'YOUR_API_KEY') {
                reject(new Error('请配置有效的高德地图API密钥'));
                return;
            }
            
            // 设置安全密钥（对于路径规划插件也必须设置）
            if (securityJsCode) {
                window._AMapSecurityConfig = {
                    securityJsCode: securityJsCode
                };
            }
            
            // 使用官方推荐的AMap.plugin方式加载
            AMap.plugin("AMap.Driving", () => {
                console.log('✅ 路径规划插件加载成功');
                
                // 等待AMap.Driving可用
                let attempts = 0;
                const maxAttempts = 50;
                const interval = setInterval(() => {
                    attempts++;
                    if (window.AMap && window.AMap.Driving) {
                        clearInterval(interval);
                        resolve();
                        return;
                    }
                    
                    if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        reject(new Error('路径规划插件加载超时'));
                    }
                }, 100);
            });
        });
    }
    
    // 显示路线规划结果
    displayRouteResult(route, startPlace, endPlace) {
        const distance = (route.distance / 1000).toFixed(1); // 公里
        const duration = Math.round(route.time / 60); // 分钟
        
        // 在地图上绘制路线
        this.drawRouteOnMap(route);
        
        // 更新路线信息
        const routeInfo = `
            <strong>${startPlace}</strong> → <strong>${endPlace}</strong><br>
            距离: ${distance}公里 | 时间: ${duration}分钟<br>
            费用: ${route.taxi_cost ? route.taxi_cost + '元' : '待计算'}
        `;
        
        document.getElementById('route-info').innerHTML = routeInfo;
        
        // 显示导航步骤
        const stepsContainer = document.getElementById('route-steps');
        stepsContainer.innerHTML = '';
        
        if (route.steps && route.steps.length > 0) {
            route.steps.forEach((step, index) => {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'route-plan-step';
                stepDiv.innerHTML = `
                    <span class="route-plan-step-icon">${index + 1}.</span>
                    <span class="route-plan-step-text">${step.instruction}</span>
                `;
                stepsContainer.appendChild(stepDiv);
            });
        }
        
        // 显示面板
        this.showRoutePanel();
    }
    
    // 在地图上绘制路线
    drawRouteOnMap(route) {
        if (!route || !route.steps || !this.mapApp.map) return;
        
        // 收集所有路径点
        const path = [];
        let startPoint = null;
        let endPoint = null;
        
        // 添加起点 - 尝试多种可能的数据结构
        if (route.origin) {
            startPoint = [route.origin.lng, route.origin.lat];
        } else if (route.start && route.start.location) {
            const coords = route.start.location.split(',');
            startPoint = [parseFloat(coords[0]), parseFloat(coords[1])];
        } else if (route.start_location) {
            startPoint = [route.start_location.lng, route.start_location.lat];
        } else if (path.length > 0) {
            startPoint = path[0];
        }
        
        if (startPoint) {
            path.splice(0, 0, startPoint); // 将起点添加到路径开头
        }
        
        // 添加路径中间点
        route.steps.forEach(step => {
            if (step.path) {
                step.path.forEach(point => {
                    path.push([point.lng, point.lat]);
                });
            }
        });
        
        // 添加终点 - 尝试多种可能的数据结构
        if (route.destination) {
            endPoint = [route.destination.lng, route.destination.lat];
        } else if (route.end && route.end.location) {
            const coords = route.end.location.split(',');
            endPoint = [parseFloat(coords[0]), parseFloat(coords[1])];
        } else if (route.end_location) {
            endPoint = [route.end_location.lng, route.end_location.lat];
        } else if (path.length > 0) {
            endPoint = path[path.length - 1];
        }
        
        if (endPoint && path[path.length - 1] !== endPoint) {
            path.push(endPoint); // 将终点添加到路径末尾
        }
        
        // 创建路线折线
        this.routePolyline = new AMap.Polyline({
            path: path,
            strokeColor: "#007AFF",
            strokeWeight: 6,
            strokeOpacity: 0.8
        });
        
        // 将路线添加到地图
        this.routePolyline.setMap(this.mapApp.map);
        
        // 创建起点标记
        if (startPoint) {
            const startMarker = new AMap.Marker({
                position: startPoint,
                icon: new AMap.Icon({
                    size: new AMap.Size(25, 35),
                    imageSize: new AMap.Size(25, 35),
                    image: 'https://webapi.amap.com/theme/v1.3/markers/n/start.png'
                }),
                offset: new AMap.Pixel(-12, -35)
            });
            startMarker.setMap(this.mapApp.map);
            this.routeMarkers.push(startMarker);
            console.log('起点标记已添加:', startPoint);
        }
        
        // 创建终点标记
        if (endPoint) {
            const endMarker = new AMap.Marker({
                position: endPoint,
                icon: new AMap.Icon({
                    size: new AMap.Size(25, 35),
                    imageSize: new AMap.Size(25, 35),
                    image: 'https://webapi.amap.com/theme/v1.3/markers/n/end.png'
                }),
                offset: new AMap.Pixel(-12, -35)
            });
            endMarker.setMap(this.mapApp.map);
            this.routeMarkers.push(endMarker);
            console.log('终点标记已添加:', endPoint);
        }
        
        // 调整地图视野以包含整个路线
        if (path.length > 0) {
            this.mapApp.map.setFitView([this.routePolyline]);
        }
    }
    
    // 更新路线信息
    updateRouteInfo(message, isLoading = false) {
        const infoDiv = document.getElementById('route-info');
        if (infoDiv) {
            if (isLoading) {
                infoDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.1); border-top: 2px solid #007AFF; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <span>${message}</span>
                    </div>
                `;
            } else {
                infoDiv.innerHTML = message;
            }
        }
    }
}

// 行程安排功能
class ScheduleManager {
    constructor() {
        this.currentDay = 'day1';
        this.dayMarkers = [];
        this.scheduleData = {};
        this.isLoading = false;
        this.routePlanner = null;
        this.initializeScheduleEvents();
        this.loadScheduleData(); // 自动加载行程数据
    }
    
    initializeScheduleEvents() {
        const daySelect = document.getElementById('day-select');
        
        // 下拉选择变化事件
        daySelect.addEventListener('change', (event) => {
            this.switchDay(event.target.value);
        });
        
        console.log('行程安排功能初始化完成');
    }
    
    switchDay(day) {
        // 隐藏所有天的行程
        const allSchedules = document.querySelectorAll('.day-schedule');
        allSchedules.forEach(schedule => {
            schedule.classList.remove('active');
        });
        
        // 显示选中的天的行程
        const selectedSchedule = document.getElementById(`${day}-schedule`);
        if (selectedSchedule) {
            selectedSchedule.classList.add('active');
            this.currentDay = day;
            
            // 更新地图标记
            this.updateMapMarkers(day);
            
            console.log(`切换到第${day.replace('day', '')}天行程`);
        }
    }
    
    updateMapMarkers(day) {
        // 清除之前的地图标记
        this.clearDayMarkers();
        
        // 获取当前天的行程数据
        const dayData = this.scheduleData[day];
        if (!dayData || !window.mapApp) return;
        
        // 为每个景点添加地图标记
        dayData.forEach((item, index) => {
            // 使用地理编码获取坐标
            if (window.AMap && AMap.Geocoder) {
                const geocoder = new AMap.Geocoder();
                
                geocoder.getLocation(item.place, (status, result) => {
                    if (status === 'complete' && result.geocodes.length > 0) {
                        const location = result.geocodes[0].location;
                        
                        // 添加标记
                        const marker = window.mapApp.addMarker([location.lng, location.lat], {
                            title: item.place,
                            content: `
                                <div class="marker-info">
                                    <h4>${item.place}</h4>
                                    <p><strong>时间:</strong> ${item.time}</p>
                                    <p><strong>描述:</strong> ${item.description}</p>
                                    <p><strong>顺序:</strong> 第${index + 1}站</p>
                                </div>
                            `
                        });
                        
                        // 保存标记引用
                        this.dayMarkers.push(marker);
                        
                        // 如果是第一个地点，将地图中心定位到该地点
                        if (index === 0) {
                            window.mapApp.map.setCenter([location.lng, location.lat]);
                            window.mapApp.map.setZoom(14);
                        }
                    }
                });
            }
        });
        
        console.log(`为第${day.replace('day', '')}天添加了${dayData.length}个景点标记`);
    }
    
    clearDayMarkers() {
        // 清除当前天的地图标记
        this.dayMarkers.forEach(marker => {
            if (marker && marker.setMap) {
                marker.setMap(null);
            }
        });
        this.dayMarkers = [];
    }
    
    // 显示错误信息
    showError(message) {
        console.error('ScheduleManager错误:', message);
        
        // 显示错误提示
        if (window.mapApp && typeof window.mapApp.showError === 'function') {
            window.mapApp.showError(message);
        }
        
        // 在行程面板中显示错误状态
        const schedulePanel = document.getElementById('schedule-panel');
        if (schedulePanel) {
            // 移除现有的错误提示
            const existingError = schedulePanel.querySelector('.schedule-error');
            if (existingError) {
                existingError.remove();
            }
            
            // 添加错误提示
            const errorDiv = document.createElement('div');
            errorDiv.className = 'schedule-error';
            errorDiv.innerHTML = `
                <div style="padding: 20px; text-align: center; color: #f66;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                    <h3 style="margin: 0 0 10px 0;">行程数据加载失败</h3>
                    <p style="margin: 0;">${message}</p>
                </div>
            `;
            schedulePanel.appendChild(errorDiv);
        }
    }
    
    // 加载行程数据
    async loadScheduleData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState(true);
        
        try {
            // 从后端API获取数据，失败时直接抛出错误
            const response = await fetch('/api/schedule/data');
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(`后端API错误: ${result.error || '未知错误'}`);
            }
            
            this.scheduleData = result.data;
            console.log('从后端加载行程数据成功');
            
        } catch (error) {
            console.error('行程数据加载失败:', error);
            
            // 显示错误信息，不进行模拟数据回退
            this.showError('行程数据加载失败: ' + error.message);
            
            // 设置空数据，避免后续操作出错
            this.scheduleData = {};
        } finally {
            this.isLoading = false;
            this.showLoadingState(false);
            
            // 更新UI和地图标记
            this.updateScheduleUI();
            this.updateMapMarkers(this.currentDay);
        }
    }
    
    // 显示/隐藏加载状态
    showLoadingState(show) {
        const schedulePanel = document.getElementById('schedule-panel');
        const daySelect = document.getElementById('day-select');
        
        if (show) {
            // 显示加载状态
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'schedule-loading';
            loadingDiv.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; padding: 20px;">
                    <div style="width: 20px; height: 20px; border: 2px solid rgba(0,0,0,0.1); border-top: 2px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
                    <span style="color: #666;">正在加载行程数据...</span>
                </div>
            `;
            
            const existingLoading = schedulePanel.querySelector('.schedule-loading');
            if (!existingLoading) {
                schedulePanel.appendChild(loadingDiv);
            }
            
            // 禁用下拉选择
            if (daySelect) {
                daySelect.disabled = true;
            }
        } else {
            // 隐藏加载状态
            const loadingDiv = schedulePanel.querySelector('.schedule-loading');
            if (loadingDiv) {
                loadingDiv.remove();
            }
            
            // 启用下拉选择
            if (daySelect) {
                daySelect.disabled = false;
            }
        }
    }
    
    // 加载行程数据
    async loadScheduleData() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState(true);
        
        try {
            // 从后端API获取数据，失败时直接抛出错误
            const response = await fetch('/api/schedule/data');
            
            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(`后端API错误: ${result.error || '未知错误'}`);
            }
            
            this.scheduleData = result.data;
            console.log('从后端加载行程数据成功');
            
        } catch (error) {
            console.error('行程数据加载失败:', error);
            
            // 显示错误信息，不进行模拟数据回退
            this.showError('行程数据加载失败: ' + error.message);
            
            // 设置空数据，避免后续操作出错
            this.scheduleData = {};
        } finally {
            this.isLoading = false;
            this.showLoadingState(false);
            
            // 更新UI和地图标记
            this.updateScheduleUI();
            this.updateMapMarkers(this.currentDay);
        }
    }
    
    // 显示/隐藏加载状态
    showLoadingState(show) {
        const schedulePanel = document.getElementById('schedule-panel');
        const daySelect = document.getElementById('day-select');
        
        if (show) {
            // 显示加载状态
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'schedule-loading';
            loadingDiv.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; padding: 20px;">
                    <div style="width: 20px; height: 20px; border: 2px solid rgba(0,0,0,0.1); border-top: 2px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 10px;"></div>
                    <span style="color: #666;">正在加载行程数据...</span>
                </div>
            `;
            
            const existingLoading = schedulePanel.querySelector('.schedule-loading');
            if (!existingLoading) {
                schedulePanel.appendChild(loadingDiv);
            }
            
            // 禁用下拉选择
            if (daySelect) {
                daySelect.disabled = true;
            }
        } else {
            // 隐藏加载状态
            const loadingDiv = schedulePanel.querySelector('.schedule-loading');
            if (loadingDiv) {
                loadingDiv.remove();
            }
            
            // 启用下拉选择
            if (daySelect) {
                daySelect.disabled = false;
            }
        }
    }
    
    // 动态更新行程数据的方法
    updateScheduleData(newData) {
        // 合并新的行程数据
        this.scheduleData = { ...this.scheduleData, ...newData };
        
        // 更新UI显示
        this.updateScheduleUI();
        
        // 重新加载当前天的地图标记
        this.updateMapMarkers(this.currentDay);
        
        console.log('行程数据更新完成');
    }
    
    // 初始化路径规划器
    initializeRoutePlanner() {
        if (window.mapApp && !this.routePlanner) {
            this.routePlanner = new RoutePlanner(window.mapApp);
        }
    }
    
    // 初始化路径规划器
    initializeRoutePlanner() {
        if (window.mapApp && !this.routePlanner) {
            this.routePlanner = new RoutePlanner(window.mapApp);
        }
    }
    
    // 更新UI显示
    updateScheduleUI() {
        // 确保路径规划器已初始化
        this.initializeRoutePlanner();
        
        // 更新每个天的行程内容
        Object.keys(this.scheduleData).forEach(day => {
            const scheduleElement = document.getElementById(`${day}-schedule`);
            if (scheduleElement) {
                const scheduleList = scheduleElement.querySelector('.schedule-list');
                if (scheduleList) {
                    // 清空现有内容
                    scheduleList.innerHTML = '';
                    
                    // 获取当前天的行程数据
                    const daySchedule = this.scheduleData[day];
                    
                    // 添加新的行程项目
                    daySchedule.forEach((item, index) => {
                        const scheduleItem = document.createElement('div');
                        scheduleItem.className = 'schedule-item';
                        scheduleItem.innerHTML = `
                            <div class="time">${item.time}</div>
                            <div class="place">${item.place}</div>
                            <div class="description">${item.description}</div>
                        `;
                        scheduleList.appendChild(scheduleItem);
                        
                        // 在相邻地点之间添加箭头按钮（除了最后一个地点）
                        if (index < daySchedule.length - 1) {
                            const nextItem = daySchedule[index + 1];
                            const arrowDiv = document.createElement('div');
                            arrowDiv.className = 'route-arrow';
                            arrowDiv.innerHTML = `
                                <button class="route-arrow-button" data-start="${item.place}" data-end="${nextItem.place}">
                                    <span class="route-arrow-icon">→</span>
                                    <span>路线规划</span>
                                </button>
                            `;
                            scheduleList.appendChild(arrowDiv);
                            
                            // 添加箭头按钮点击事件
                            const arrowButton = arrowDiv.querySelector('.route-arrow-button');
                            arrowButton.addEventListener('click', () => {
                                this.handleRoutePlanning(item.place, nextItem.place);
                            });
                        }
                    });
                }
            }
        });
    }
    
    // 处理路线规划
    async handleRoutePlanning(startPlace, endPlace) {
        if (!this.routePlanner) {
            this.initializeRoutePlanner();
        }
        
        if (this.routePlanner) {
            await this.routePlanner.planRoute(startPlace, endPlace);
        }
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 页面DOM加载完成，开始初始化地图应用');
    
    // 强制设置搜索框位置和宽度
    const inputPanel = document.getElementById('input-panel');
    if (inputPanel) {
        // 获取视口宽度
        const viewportWidth = window.innerWidth;
        // 计算左侧面板宽度的一半
        const leftPanelHalf = 175;
        // 设置搜索框位置为页面中心，向右偏移左侧面板一半的宽度
        inputPanel.style.left = `calc(50% + ${leftPanelHalf}px)`;
        inputPanel.style.transform = 'translateX(-50%)';
        inputPanel.style.width = '800px';
        inputPanel.style.maxWidth = '800px';
        console.log('🔧 搜索框位置已强制设置:', {
            left: inputPanel.style.left,
            transform: inputPanel.style.transform,
            width: inputPanel.style.width,
            viewportWidth
        });
    }
    
    // 添加全局错误处理
    window.addEventListener('error', (event) => {
        console.error('🌐 全局错误捕获:', event);
    });
    
    // 添加未处理的Promise拒绝处理
    window.addEventListener('unhandledrejection', (event) => {
        console.error('❌ 未处理的Promise拒绝:', event.reason);
    });
    
    try {
        const app = new MapApp();
        
        // 将地图应用添加到全局，方便行程管理器访问
        window.mapApp = app;
        
        app.init();
        
        // 等待地图初始化完成后，初始化行程安排管理器
        const initScheduleManager = () => {
            const scheduleManager = new ScheduleManager();
            
            // 将行程管理器添加到全局，方便调试
            window.scheduleManager = scheduleManager;
            
            console.log('行程安排与地图联动功能已启用');
        };
        
        // 延迟初始化行程管理器，确保地图完全加载
        setTimeout(initScheduleManager, 1000);
        
    } catch (error) {
        console.error('💥 应用初始化异常:', error);
        
        // 显示友好的错误信息
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fee;
            border: 2px solid #f66;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            z-index: 10000;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <h3 style="color: #f66; margin: 0 0 10px 0;">地图加载失败</h3>
            <p style="margin: 0 0 15px 0;">${error.message}</p>
            <button onclick="location.reload()" style="
                background: #f66;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
            ">重新加载</button>
        `;
        document.body.appendChild(errorDiv);
    }
});
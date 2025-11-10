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
            console.log('API密钥:', configData.apiKey ? configData.apiKey.substring(0, 8) + '...' : '未配置');
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
            console.log('使用的API密钥:', apiKey ? apiKey.substring(0, 8) + '...' : '未配置');
            
            // 检查是否为默认密钥或未配置
            if (!apiKey || apiKey === 'YOUR_API_KEY') {
                console.warn('⚠ 使用默认API密钥，可能需要配置有效的API密钥');
                // 显示更详细的错误信息
                this.showError('地图API密钥未配置，请检查application.properties中的amap.api-key设置');
            }

            // 构建API URL，使用更稳定的版本和参数
            const apiUrl = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Geolocation,AMap.Geocoder,AMap.ToolBar,AMap.Scale`;
            console.log('📡 加载API URL:', apiUrl);
            
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
                // 显示AI回复
                this.showAiResponse(result.response);
                this.showSuccess('AI回复获取成功');
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

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 页面DOM加载完成，开始初始化地图应用');
    
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
        app.init();
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
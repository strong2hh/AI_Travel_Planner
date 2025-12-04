// MapApp.js

window.BACKEND_BASE_URL = '';

class MapApp {
    constructor() {
        this.map = null;
        this.geolocation = null;
        this.markers = [];
        this.currentLocation = null;
        this.config = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.recordingTimer = null;

        try {
            this.geocodingCache = JSON.parse(localStorage.getItem('amap_geocache') || '{}');
            console.log(`🗺️ 缓存加载成功，共 ${Object.keys(this.geocodingCache).length} 条记录`);
        } catch (e) {
            console.error('缓存解析失败，重置缓存。', e);
            this.geocodingCache = {};
        }
    }

    async init() {
        try {
            console.log('🚀 开始初始化地图应用...');

            this.config = await this.loadConfig();

            await this.loadAMapAPI();

            this.createMap();

            this.initializeEvents();

            console.log('✅ 地图初始化成功');

        } catch (error) {
            console.error('❌ 初始化失败:', error);

            let errorDetails = `地图初始化失败: ${error.message}`;

            if (error.message.includes('网络连接')) {
                errorDetails += '\n• 请检查网络连接是否正常';
                errorDetails += '\n• 确保可以访问 https://webapi.amap.com';
            } else if (error.message.includes('API密钥')) {
                errorDetails += '\n• 请检查 application.properties 中的 amap.api-key 配置';
                errorDetails += '\n• 确保API密钥有效且未过期';
            }

            this.showError(errorDetails);
            throw error;
        }
    }

    async loadConfig() {
        try {
            const token = localStorage.getItem('employee_token');

            const headers = {
                'token': token
            };

            const response = await fetch(`${BACKEND_BASE_URL}/api/map/config`, {
                method: 'GET',
                headers: headers
            });

            if (!response.ok) {
                throw new Error(`配置API加载失败，状态码: ${response.status}`);
            }

            const configData = await response.json();

            const config = {
                apiKey: configData.apiKey,
                securityJsCode: configData.securityJsCode,
                center: '116.397428,39.90923',
                zoom: '12',
                style: 'normal',
                enableGeolocation: true
            };

            if (configData.warning) {
                console.warn(configData.warning);
            }

            return config;
        } catch (error) {
            console.error('配置加载失败:', error);
            throw error;
        }
    }

    loadAMapAPI() {
        return new Promise((resolve, reject) => {
            if (window.AMap && typeof window.AMap.Map === 'function') {
                resolve();
                return;
            }

            const apiKey = this.config.apiKey;
            if (!apiKey) {
                this.showError('地图API密钥未配置，请检查application.properties中的amap.api-key设置');
            }

            const securityJsCode = this.config.securityJsCode;

            const apiUrl = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.Geolocation,AMap.Geocoder,AMap.ToolBar,AMap.Scale`;

            if (securityJsCode) {
                window._AMapSecurityConfig = {
                    securityJsCode: securityJsCode
                };
            }

            const script = document.createElement('script');
            script.src = apiUrl;
            script.async = true;
            script.defer = true;

            let amapReady = false;

            script.onload = () => {
                const checkAMap = () => {
                    if (window.AMap && typeof window.AMap.Map === 'function') {
                        amapReady = true;
                        return true;
                    }
                    return false;
                };

                if (checkAMap()) {
                    resolve();
                    return;
                }

                let attempts = 0;
                const maxAttempts = 100;
                const interval = setInterval(() => {
                    attempts++;
                    if (checkAMap()) {
                        clearInterval(interval);
                        resolve();
                        return;
                    }

                    if (attempts >= maxAttempts) {
                        clearInterval(interval);
                        reject(new Error('AMap对象加载超时，请检查网络连接和API密钥配置'));
                    }
                }, 50);

                setTimeout(() => {
                    clearInterval(interval);
                    if (!amapReady) {
                        reject(new Error('AMap对象加载超时，强制失败'));
                    }
                }, 8000);
            };

            script.onerror = (error) => {
                reject(new Error(`高德地图API加载失败: ${error.message}`));
            };

            document.head.appendChild(script);

            window.addEventListener('error', (event) => {
                if (event.filename && event.filename.includes('amap.com')) {
                    console.error('🌐 网络错误捕获:', event);
                }
            });
        });
    }

    createMap() {
        try {
            if (!window.AMap || typeof window.AMap.Map !== 'function') {
                throw new Error('AMap.Map构造函数不可用');
            }

            const center = this.config.center ? this.config.center.split(',').map(Number) : [116.397428, 39.90923];
            const zoom = this.config.zoom ? parseInt(this.config.zoom) : 12;

            this.map = new window.AMap.Map('map', {
                zoom: zoom,
                center: center,
                viewMode: '2D',
                resizeEnable: true
            });

            setTimeout(() => {
                try {
                    if (window.AMap.Scale) {
                        this.map.addControl(new window.AMap.Scale());
                    }

                    this.initializeGeolocation();

                    // ★★★ 修正点：强制地图刷新尺寸 ★★★
                    if (this.map && this.map.resize) {
                        this.map.resize();
                    }
                    // ★★★ 修正点结束 ★★★


                    this.showSuccess('地图加载成功');

                } catch (error) {
                    this.showError('部分地图控件加载失败: ' + error.message);
                }
            }, 1000);

        } catch (error) {
            let errorMessage = '地图创建失败: ' + error.message;
            if (error.message.includes('APILoader')) {
                errorMessage += ' - 请检查API密钥是否正确配置';
            }

            this.showError(errorMessage);
            throw error;
        }
    }

    initializeGeolocation() {
        // ★★★ 如果不想显示定位按钮，直接注释掉这部分代码 ★★★
        /*
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
        */
        console.log('定位控件已禁用');
    }

    initializeEvents() {
        this.map.on('click', (e) => {
            this.addMarker(e.lnglat);
        });

        // ★★★ 引用 VoiceRecognition.js 中的方法 ★★★
        if (typeof this.initializeVoiceInputEvents === 'function') {
            this.initializeVoiceInputEvents();
            console.log('🎙️ 语音识别模块加载成功');
        } else {
            console.warn('VoiceRecognition.js 未成功加载或方法未挂载。');
        }

        this.initializeInputEvents();
    }

    initializeInputEvents() {
        const searchInput = document.getElementById('search-input');
        const aiSearchBtn = document.getElementById('ai-search-btn');

        // 检查元素是否存在
        if (!searchInput) {
            console.error("DOM 元素 #search-input 未找到，无法初始化事件。");
            return;
        }
        if (!aiSearchBtn) {
            console.error("DOM 元素 #ai-search-btn 未找到，无法初始化事件。");
            // 如果找不到关键元素，应该停止或记录警告
        }

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(searchInput.value);
            }
        });

        aiSearchBtn.addEventListener('click', () => {
            this.handleAiSearch();
        });
    }

    saveCache() {
        try {
            localStorage.setItem('amap_geocache', JSON.stringify(this.geocodingCache));
        } catch (e) {
            console.warn('保存缓存失败，可能是存储空间不足。', e);
        }
    }

    getCoordinates(query) {
        return new Promise((resolve, reject) => {
            query = query.trim();
            if (!query) return reject(new Error('查询不能为空'));

            if (this.geocodingCache[query]) {
                return resolve(this.geocodingCache[query]);
            }

            if (window.AMap && AMap.Geocoder) {
                const geocoder = new AMap.Geocoder();

                geocoder.getLocation(query, (status, result) => {
                    if (status === 'complete' && result.geocodes.length > 0) {
                        const location = result.geocodes[0].location;
                        const coords = [location.lng, location.lat];

                        this.geocodingCache[query] = coords;
                        this.saveCache();

                        resolve(coords);
                    } else {
                        reject(new Error(`地理编码失败: ${query}`));
                    }
                });
            } else {
                reject(new Error('AMap.Geocoder服务不可用'));
            }
        });
    }

    async handleSearch(query)
    {
        if (!query.trim()) return;

        this.clearMarkers();

        try {
            const location = await this.getCoordinates(query);

            this.map.setCenter(location);
            this.map.setZoom(15);

            this.addMarker(location, { title: query });

            this.showSuccess(`找到目的地: ${query}`);

        } catch (error) {
            this.showError(`搜索失败: ${error.message}`);
        }
    }

    async handleAiSearch() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput.value.trim();

        if (!query) {
            this.showError('请输入要搜索的内容');
            return;
        }

        const aiBtn = document.getElementById('ai-search-btn');
        aiBtn.classList.add('loading');

        const token = localStorage.getItem('employee_token');

        if (!token) {
            this.showError('身份认证失败，请重新登录！');
            aiBtn.classList.remove('loading');
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            'token': token
        };

        try {
            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ query: query })
            });

            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }

            const result = await response.json();

            if (result.code === 200 && result.data) {
                // ... (处理成功逻辑) ...
                if (window.scheduleManager && typeof window.scheduleManager.loadScheduleData === 'function') {
                    console.log('AI生成成功，正在从后端刷新最新行程...');
                    await window.scheduleManager.loadScheduleData();
                    this.showSuccess('AI助手成功规划行程！');
                }
            } else {
                this.showAiResponse(result.msg || 'AI助手未能提供有效回复。');
            }

        } catch (error) {
            this.showError(`AI搜索失败: ${error.message}`);
        } finally {
            aiBtn.classList.remove('loading');
        }
    }

    showAiResponse(response) {
        let dialog = document.getElementById('ai-response-dialog');

        if (!dialog) {
            dialog = document.createElement('div');
            dialog.id = 'ai-response-dialog';
            dialog.className = 'ai-response-dialog';

            dialog.innerHTML = `
                <div class="ai-response-header">
                    <div class="ai-response-title">AI助手回复</div>
                    <button class="ai-response-close">&times;</button>
                </div>
                <div class="ai-response-content"></div>
            `;

            document.getElementById('container').appendChild(dialog);

            dialog.querySelector('.ai-response-close').addEventListener('click', () => {
                dialog.classList.remove('visible');
            });
        }

        dialog.querySelector('.ai-response-content').textContent = response;

        dialog.classList.add('visible');
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            marker.setMap(null);
        });
        this.markers = [];
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'error') {
        this.removeExistingToasts();

        const toast = document.createElement('div');
        toast.className = `${type}-toast`;
        toast.textContent = message;

        document.getElementById('toast-container').appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    removeExistingToasts() {
        const container = document.getElementById('toast-container');
        const existingToasts = container.querySelectorAll('.error-toast, .success-toast');
        existingToasts.forEach(toast => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
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
}
window.MapApp = MapApp;

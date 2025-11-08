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
    }

    async init() {
        try {
            // 加载配置
            this.config = await this.loadConfig();
            
            // 先加载高德地图API
            await this.loadAMapAPI();
            
            // 然后创建地图
            this.createMap();
            
            // 初始化事件
            this.initializeEvents();
            
            console.log('地图初始化成功');
            
        } catch (error) {
            console.error('初始化失败:', error);
            this.showError('地图初始化失败: ' + error.message);
        }
    }

    // 加载配置文件
    async loadConfig() {
        try {
            const response = await fetch('/static/MAP/map.properties');
            if (!response.ok) throw new Error('配置文件加载失败');
            
            const text = await response.text();
            const config = {};
            text.split('\n').forEach(line => {
                const [key, value] = line.split('=');
                if (key && value) {
                    config[key.trim()] = value.trim();
                }
            });
            
            return config;
        } catch (error) {
            // 使用默认配置
            return {
                apiKey: 'YOUR_API_KEY',
                center: '116.397428,39.90923',
                zoom: '12'
            };
        }
    }

    // 加载高德地图API
    loadAMapAPI() {
        return new Promise((resolve, reject) => {
            // 检查是否已经加载
            if (window.AMap) {
                console.log('AMap对象已存在，直接使用');
                resolve();
                return;
            }

            // 确保API密钥有效
            const apiKey = this.config.apiKey || 'YOUR_API_KEY';
            if (apiKey === 'YOUR_API_KEY') {
                console.warn('使用默认API密钥，可能需要配置有效的API密钥');
            }

            // 构建API URL，移除复杂的插件参数
            const apiUrl = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}`;
            console.log('加载API URL:', apiUrl);
            
            const script = document.createElement('script');
            script.src = apiUrl;
            
            let loaded = false;
            script.onload = () => {
                loaded = true;
                console.log('高德地图API脚本加载完成');
                
                // 等待AMap对象可用
                const checkAMap = () => {
                    if (window.AMap && window.AMap.Map) {
                        console.log('AMap对象已可用');
                        resolve();
                        return true;
                    }
                    console.log('检查AMap对象，当前状态:', typeof window.AMap);
                    return false;
                };
                
                // 立即检查一次
                if (checkAMap()) return;
                
                // 轮询检查，更频繁的检查
                const interval = setInterval(() => {
                    if (checkAMap()) {
                        clearInterval(interval);
                    }
                }, 50); // 更频繁的检查
                
                // 超时处理，延长超时时间
                setTimeout(() => {
                    clearInterval(interval);
                    if (!window.AMap) {
                        console.error('AMap对象加载超时，检查网络连接和API密钥');
                        reject(new Error('AMap对象加载超时，请检查网络连接和API密钥配置'));
                    }
                }, 15000); // 延长超时时间
            };
            
            script.onerror = (error) => {
                console.error('高德地图API加载失败:', error);
                reject(new Error(`高德地图API加载失败: ${error.message}`));
            };
            
            // 添加加载状态监听
            script.onreadystatechange = function() {
                if (this.readyState === 'loaded' || this.readyState === 'complete') {
                    console.log('脚本状态变化:', this.readyState);
                }
            };
            
            document.head.appendChild(script);
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
            
            // 简化的地图配置
            this.map = new window.AMap.Map('map', {
                zoom: zoom,
                center: center
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
                    
                } catch (error) {
                    console.warn('部分控件加载失败:', error);
                }
            }, 1000);
            
        } catch (error) {
            console.error('地图创建失败:', error);
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
        
        // 文本输入搜索
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(searchInput.value);
            }
        });
        
        // 语音按钮点击
        voiceBtn.addEventListener('click', () => {
            this.toggleSpeechRecognition();
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
        alert(message);
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    const app = new MapApp();
    app.init();
});
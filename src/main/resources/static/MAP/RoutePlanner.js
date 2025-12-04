// RoutePlanner.js

// 路径规划功能类
class RoutePlanner {
    constructor(mapApp) {
        this.mapApp = mapApp;
        this.routePolyline = null;
        this.routeMarkers = [];
        this.config = null;
        this.initializeRoutePanel();
    }

    // 初始化路径规划面板
    initializeRoutePanel() {
        let panel = document.getElementById('route-plan-panel');

        if (!panel) {
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

            document.getElementById('container').appendChild(panel);

            panel.querySelector('.route-plan-close').addEventListener('click', () => {
                this.hideRoutePanel();
            });
        }
    }

    showRoutePanel() {
        const panel = document.getElementById('route-plan-panel');
        if (panel) {
            panel.classList.add('visible');
        }
    }

    hideRoutePanel() {
        const panel = document.getElementById('route-plan-panel');
        if (panel) {
            panel.classList.remove('visible');
        }
        this.clearRoute();
    }

    clearRoute() {
        if (this.routePolyline) {
            this.routePolyline.setMap(null);
            this.routePolyline = null;
        }

        this.routeMarkers.forEach(marker => {
            if (marker && marker.setMap) {
                marker.setMap(null);
            }
        });
        this.routeMarkers = [];

        if (this.mapApp && this.mapApp.map && this.mapApp.map.getAllOverlays) {
            const overlays = this.mapApp.map.getAllOverlays();
            overlays.forEach(overlay => {
                if (overlay.CLASS_NAME && (
                    overlay.CLASS_NAME.includes('Polyline') ||
                    overlay.CLASS_NAME.includes('Marker')
                )) {
                    this.mapApp.map.remove(overlay);
                }
            });
        }
    }

    async planRoute(startPlace, endPlace) {
        try {
            this.clearRoute();
            this.updateRouteInfo('正在规划路线...', true);

            console.log('🚗 开始路径规划，直接使用地址:', {
                start: startPlace,
                end: endPlace
            });

            if (!window.AMap) {
                throw new Error('高德地图API未加载，请检查网络连接和API密钥配置');
            }

            if (!window.AMap.Driving) {
                console.log('🚗 正在加载路径规划插件...');
                await this.loadDrivingPlugin();
            }

            if (window.AMap.Driving) {
                await new Promise((resolve, reject) => {
                    AMap.plugin("AMap.Driving", () => {
                        const driving = new AMap.Driving({
                            map: null,
                            policy: 0,
                            showTraffic: true,
                            hideMarkers: true
                        });

                        const self = this;

                        function extractCityFromAddress(address) {
                            const match = address.match(/（([^）]+)）|\(([^)]+)\)/);
                            if (match) {
                                return match[1] || match[2];
                            }
                            return "";
                        }

                        const points = [
                            { keyword: startPlace, city: extractCityFromAddress(startPlace) },
                            { keyword: endPlace, city: extractCityFromAddress(endPlace) }
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

    loadDrivingPlugin() {
        return new Promise((resolve, reject) => {
            if (window.AMap && window.AMap.Driving) {
                resolve();
                return;
            }

            const apiKey = this.mapApp.config?.apiKey;
            const securityJsCode = this.mapApp.config?.securityJsCode;

            if (!apiKey) {
                reject(new Error('请配置有效的高德地图API密钥'));
                return;
            }

            if (securityJsCode) {
                window._AMapSecurityConfig = {
                    securityJsCode: securityJsCode
                };
            }

            AMap.plugin("AMap.Driving", () => {
                console.log('✅ 路径规划插件加载成功');

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

    displayRouteResult(route, startPlace, endPlace) {
        const distance = (route.distance / 1000).toFixed(1);
        const duration = Math.round(route.time / 60);

        this.drawRouteOnMap(route);

        const routeInfo = `
            <strong>${startPlace}</strong> → <strong>${endPlace}</strong><br>
            距离: ${distance}公里 | 时间: ${duration}分钟<br>
            费用: ${route.taxi_cost ? route.taxi_cost + '元' : '待计算'}
        `;

        document.getElementById('route-info').innerHTML = routeInfo;

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

        this.showRoutePanel();
    }

    drawRouteOnMap(route) {
        if (!route || !route.steps || !this.mapApp.map) return;

        const path = [];
        let startPoint = null;
        let endPoint = null;

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
            path.splice(0, 0, startPoint);
        }

        route.steps.forEach(step => {
            if (step.path) {
                step.path.forEach(point => {
                    path.push([point.lng, point.lat]);
                });
            }
        });

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
            path.push(endPoint);
        }

        this.routePolyline = new AMap.Polyline({
            path: path,
            strokeColor: "#007AFF",
            strokeWeight: 6,
            strokeOpacity: 0.8
        });

        this.routePolyline.setMap(this.mapApp.map);

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
        }

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
        }

        if (path.length > 0) {
            this.mapApp.map.setFitView([this.routePolyline]);
        }
    }

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
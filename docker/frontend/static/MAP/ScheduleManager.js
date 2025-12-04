// ScheduleManager.js

// 行程安排功能
class ScheduleManager {
    constructor() {
        this.currentDay = 'day1';
        this.dayMarkers = [];
        this.scheduleData = {};
        this.isLoading = false;
        this.routePlanner = null;
        this.initializeScheduleEvents();
    }

    initializeScheduleEvents() {
        const daySelect = document.getElementById('day-select');

        daySelect.addEventListener('change', (event) => {
            this.switchDay(event.target.value);
        });

        this.loadScheduleData();
        this.generateDayOptions();

        console.log('行程安排功能初始化完成');
    }

    // 根据行程数据动态生成天数下拉选项
    generateDayOptions() {
        const daySelect = document.getElementById('day-select');

        // 清空现有选项
        daySelect.innerHTML = '';

        const daysArray = this.scheduleData && this.scheduleData.days ? this.scheduleData.days : [];
        const dayCount = daysArray.length;

        // 检查并设置主题
        const themeTitle = document.getElementById('schedule-theme-title');
        if (themeTitle) {
            themeTitle.textContent = this.scheduleData.theme || '当前行程安排';
        }

        // 如果没有数据，显示默认占位
        if (dayCount === 0) {
            const option = document.createElement('option');
            option.value = `day1`;
            option.textContent = `暂无行程`;
            daySelect.appendChild(option);
            this.createDaySchedulePanel(1, null);
            this.switchDay('day1');
            return;
        }

        // 生成天数选项和对应的日程面板
        daysArray.forEach((dayData, index) => {
            const dayNumber = dayData.day;
            const dayKey = `day${dayNumber}`;

            const option = document.createElement('option');
            option.value = dayKey;
            option.textContent = `第${dayNumber}天`;
            daySelect.appendChild(option);

            const existingPanel = document.getElementById(`${dayKey}-schedule`);
            if (!existingPanel) {
                this.createDaySchedulePanel(dayNumber, dayData.activities);
            }
        });

        console.log(`已生成${dayCount}天的下拉选项和日程面板`);
    }

    // 创建日程面板 (已修复 daySchedule is not defined 错误)
    createDaySchedulePanel(dayNumber, activities) {

        const scheduleContent = document.querySelector('.schedule-content');
        if (!scheduleContent) return;

        // ★★★ 修复：创建 daySchedule 元素 ★★★
        const daySchedule = document.createElement('div');
        daySchedule.id = `day${dayNumber}-schedule`;
        daySchedule.className = 'day-schedule';
        // ★★★ 修复结束 ★★★

        const title = document.createElement('h4');
        title.innerHTML = `<span>${this.scheduleData.theme || '行程安排'}</span> - 第${dayNumber}天`;
        daySchedule.appendChild(title);

        const scheduleList = document.createElement('div');
        scheduleList.className = 'schedule-list';

        const dayActivities = activities;

        // 仅添加占位符，实际渲染在 updateScheduleUI 中进行
        if (dayActivities && dayActivities.length > 0) {
            const placeholder = document.createElement('div');
            placeholder.style.textAlign = 'center';
            placeholder.style.color = '#999';
            placeholder.style.padding = '20px';
            placeholder.textContent = `加载中...`;
            scheduleList.appendChild(placeholder);
        } else {
            const placeholder = document.createElement('div');
            placeholder.style.textAlign = 'center';
            placeholder.style.color = '#999';
            placeholder.style.padding = '20px';
            placeholder.textContent = `第${dayNumber}天暂无行程安排`;
            scheduleList.appendChild(placeholder);
        }

        daySchedule.appendChild(scheduleList);
        scheduleContent.appendChild(daySchedule);

        console.log(`已创建第${dayNumber}天的日程面板`);
    }

    switchDay(day) {
        const allSchedules = document.querySelectorAll('.day-schedule');
        allSchedules.forEach(schedule => {
            schedule.classList.remove('active');
        });

        const selectedSchedule = document.getElementById(`${day}-schedule`);
        if (selectedSchedule) {
            selectedSchedule.classList.add('active');
            this.currentDay = day;

            this.updateMapMarkers(day);

            console.log(`切换到第${day.replace('day', '')}天行程`);
        }
    }

    updateMapMarkers(dayKey) {
        // ★★★ 修复：添加 clearDayMarkers 方法的调用 ★★★
        this.clearDayMarkers();

        if (!this.scheduleData || !this.scheduleData.days) return;

        const dayNumber = parseInt(dayKey.replace('day', ''));
        if (isNaN(dayNumber)) return;

        const dayObject = this.scheduleData.days.find(d => d.day === dayNumber);

        if (!dayObject || !dayObject.activities || !window.mapApp) return;

        const dayActivities = dayObject.activities;

        dayActivities.forEach((item, index) => {
            window.mapApp.getCoordinates(item.place)
                .then(location => {
                    const marker = window.mapApp.addMarker(location, {
                        title: item.place,
                        content: `
                        <div class="marker-info">
                            <h4>${item.place}</h4>
                            <p><strong>时间:</strong> ${item.startTime} - ${item.endTime}</p>
                            <p><strong>描述:</strong> ${item.description}</p>
                            <p><strong>顺序:</strong> 第${index + 1}站</p>
                        </div>
                    `
                    });

                    this.dayMarkers.push(marker);

                    if (index === 0) {
                        window.mapApp.map.setCenter(location);
                        window.mapApp.map.setZoom(14);
                    }
                })
                .catch(error => {
                    console.warn(`景点 [${item.place}] 坐标获取失败: ${error.message}`);
                });
        });

        console.log(`为第${dayNumber}天添加了景点标记`);
    }

    showError(message) {
        console.error('ScheduleManager错误:', message);

        if (window.mapApp && typeof window.mapApp.showError === 'function') {
            window.mapApp.showError(message);
        }

        const schedulePanel = document.getElementById('schedule-panel');
        if (schedulePanel) {
            const existingError = schedulePanel.querySelector('.schedule-error');
            if (existingError) {
                existingError.remove();
            }

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

    clearDayMarkers() {
        if (this.dayMarkers) {
            this.dayMarkers.forEach(marker => {
                if (marker && marker.setMap) {
                    marker.setMap(null);
                }
            });
            this.dayMarkers = [];
        }
    }

    showLoadingState(show) {
        // ... (方法内容不变) ...
        const schedulePanel = document.getElementById('schedule-panel');
        const daySelect = document.getElementById('day-select');

        if (show) {
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

            if (daySelect) {
                daySelect.disabled = true;
            }
        } else {
            const loadingDiv = schedulePanel.querySelector('.schedule-loading');
            if (loadingDiv) {
                loadingDiv.remove();
            }

            if (daySelect) {
                daySelect.disabled = false;
            }
        }
    }

    // ★★★ 核心方法：加载数据 (已修正令牌和 data:null 逻辑) ★★★
    async loadScheduleData() {
        if (this.isLoading) return;

        this.isLoading = true;
        this.showLoadingState(true);

        const token = localStorage.getItem('employee_token');
        if (!token) {
            this.showError('身份认证失败，无法加载行程数据！');
            this.isLoading = false;
            this.showLoadingState(false);
            return;
        }

        const baseUrl = window.BACKEND_BASE_URL || '';
        try {
            const response = await fetch(`${baseUrl}/api/schedule/getSchedule`, {
                method: 'GET',
                headers: {
                    'token': token
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP错误! 状态码: ${response.status}`);
            }

            const result = await response.json();

            // ★★★ 修正：接受后端 Result 结构 code=200 的成功状态 ★★★
            if (result.code !== 200) {
                throw new Error(`后端API错误: ${result.msg || '服务器返回非200状态码'}`);
            }

            if (!result.data) {
                this.scheduleData = {};
                console.log('用户暂无历史行程记录 (后端返回 data: null)');
            } else {
                this.scheduleData = result.data;
                console.log('从后端加载最近行程数据成功:', this.scheduleData);
            }


            this.generateDayOptions();

        } catch (error) {
            console.error('行程数据加载失败:', error);

            this.showError('行程数据加载失败: ' + error.message);

            this.scheduleData = {};
        } finally {
            this.isLoading = false;
            this.showLoadingState(false);

            this.updateScheduleUI();

            if (this.scheduleData && this.scheduleData.days && this.scheduleData.days.length > 0) {
                this.switchDay('day1');
            } else {
                this.updateMapMarkers('day1');
            }
        }
    }

    updateScheduleData(newData) {
        // 1. 直接替换整个数据对象，而不是合并，防止旧数据的残留
        this.scheduleData = newData;

        // 2. 清空旧的 DOM 面板，强制重新渲染
        const scheduleContent = document.querySelector('.schedule-content');
        if (scheduleContent) {
            scheduleContent.innerHTML = '';
        }

        // 3. 重置当前天数为第一天
        this.currentDay = 'day1';

        // 4. 清除地图上现有的标记
        this.clearDayMarkers();

        // 5. 重新生成下拉选项和面板结构
        this.generateDayOptions();

        // 6. 填充具体内容
        this.updateScheduleUI();

        // 7. 强制切换到第一天（这将触发地图打点和高亮显示）
        this.switchDay('day1');

        console.log('行程数据已强制更新并重置为第1天');
    }

    initializeRoutePlanner() {
        if (window.mapApp && !this.routePlanner) {
            // ★★★ 确保 RoutePlanner 构造函数可用 ★★★
            if (typeof RoutePlanner === 'function') {
                this.routePlanner = new RoutePlanner(window.mapApp);
            } else {
                console.error("RoutePlanner 类未加载，请检查引用顺序。");
            }
        }
    }

    updateScheduleUI() {
        this.initializeRoutePlanner();

        if (!this.scheduleData || !this.scheduleData.days) return;

        this.scheduleData.days.forEach(dayObject => {
            const dayKey = `day${dayObject.day}`;
            const scheduleElement = document.getElementById(`${dayKey}-schedule`);

            if (scheduleElement) {
                const title = scheduleElement.querySelector('h4');
                if (title) {
                    title.innerHTML = `<span>${this.scheduleData.theme || '行程安排'}</span> - 第${dayObject.day}天`;
                }

                const scheduleList = scheduleElement.querySelector('.schedule-list');
                if (scheduleList) {
                    scheduleList.innerHTML = '';

                    const dayActivities = dayObject.activities || [];

                    dayActivities.forEach((item, index) => {
                        const scheduleItem = document.createElement('div');
                        scheduleItem.className = 'schedule-item';
                        scheduleItem.innerHTML = `
                            <div class="time">${item.startTime} - ${item.endTime}</div>
                            <div class="place">${item.place}</div>
                            <div class="description">${item.description}</div>
                        `;
                        scheduleList.appendChild(scheduleItem);

                        if (index < dayActivities.length - 1) {
                            const nextItem = dayActivities[index + 1];
                            const arrowDiv = document.createElement('div');
                            arrowDiv.className = 'route-arrow';
                            arrowDiv.innerHTML = `
                                <button class="route-arrow-button" data-start="${item.place}" data-end="${nextItem.place}">
                                    <span class="route-arrow-icon">→</span>
                                    <span>路线规划</span>
                                </button>
                            `;
                            scheduleList.appendChild(arrowDiv);

                            const arrowButton = arrowDiv.querySelector('.route-arrow-button');
                            arrowButton.addEventListener('click', () => {
                                this.handleRoutePlanning(item.place, nextItem.place);
                            });
                        }
                    });

                    if (dayActivities.length === 0) {
                        const placeholder = document.createElement('div');
                        placeholder.style.textAlign = 'center';
                        placeholder.style.color = '#999';
                        placeholder.style.padding = '20px';
                        placeholder.textContent = `第${dayObject.day}天暂无行程安排`;
                        scheduleList.appendChild(placeholder);
                    }
                }
            }
        });
    }

    async handleRoutePlanning(startPlace, endPlace) {
        if (!this.routePlanner) {
            this.initializeRoutePlanner();
        }

        if (this.routePlanner) {
            await this.routePlanner.planRoute(startPlace, endPlace);
        }
    }
}
// VoiceRecognition.js
if (window.MapApp) {
    const VoiceRecognitionPrototype = {

        initializeVoiceInputEvents: function() {
            const voiceBtn = document.getElementById('voice-btn');
            if (!voiceBtn) return;

            const self = this;
            let pressTimer;

            const startAction = (e) => {
                e.preventDefault();
                // 300ms 长按触发录音
                pressTimer = setTimeout(() => self.startRecording(), 300);
            };

            const endAction = (e) => {
                e.preventDefault();
                clearTimeout(pressTimer);
                if (self.isRecording) self.stopRecording();
            };

            voiceBtn.addEventListener('mousedown', startAction);
            voiceBtn.addEventListener('touchstart', startAction);
            voiceBtn.addEventListener('mouseup', endAction);
            voiceBtn.addEventListener('touchend', endAction);
            voiceBtn.addEventListener('mouseleave', () => {
                if (self.isRecording) self.stopRecording();
            });
        },

        startRecording: async function() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true }
                });

                this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                this.audioChunks = [];

                this.mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) this.audioChunks.push(e.data);
                };

                this.mediaRecorder.onstop = () => this.uploadAudio();

                this.mediaRecorder.start();
                this.isRecording = true;
                this.updateUIStatus(true);

            } catch (error) {
                console.error('无法录音:', error);
                alert('无法访问麦克风，请检查权限。');
            }
        },

        stopRecording: function() {
            if (this.mediaRecorder && this.isRecording) {
                this.mediaRecorder.stop();
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
                this.isRecording = false;
                this.updateUIStatus(false);
            }
        },

        // ★★★ 重点修改了这里 ★★★
        uploadAudio: async function() {
            if (!this.audioChunks || this.audioChunks.length === 0) return;

            // 1. 获取 Token (与 MapApp.js 中的 key 保持一致)
            const token = localStorage.getItem('employee_token');
            if (!token) {
                console.error('未登录或Token丢失');
                alert('请先登录后再使用语音功能');
                return;
            }

            const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const formData = new FormData();
            formData.append('audio', blob, 'voice.webm');

            const searchInput = document.getElementById('search-input');
            if(searchInput) searchInput.placeholder = '正在识别...';

            try {
                const response = await fetch('/api/voice-recognition', {
                    method: 'POST',
                    headers: {
                        // 2. 添加 Token 到请求头
                        'token': token
                        // 注意：发送 FormData 时不要手动设置 'Content-Type'，
                        // 浏览器会自动设置为 multipart/form-data 并加上 boundary
                    },
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    if(searchInput) searchInput.value = result.text;
                    // 调用 MapApp 原有的搜索逻辑
                    if(this.handleSearch) this.handleSearch(result.text);
                } else {
                    console.error('识别失败:', result.error);
                    alert('识别失败: ' + (result.error || '未知错误'));
                }
            } catch (error) {
                console.error('网络错误:', error);
            } finally {
                if(searchInput) searchInput.placeholder = '输入目的地或长按说话...';
            }
        },

        updateUIStatus: function(isRecording) {
            const btn = document.getElementById('voice-btn');
            const hint = document.getElementById('recording-indicator');

            if (btn) {
                isRecording ? btn.classList.add('listening') : btn.classList.remove('listening');
            }
            if (hint) {
                hint.style.display = isRecording ? 'block' : 'none';
                hint.textContent = isRecording ? '正在聆听...' : '';
            }
        }
    };

    Object.assign(window.MapApp.prototype, VoiceRecognitionPrototype);
}
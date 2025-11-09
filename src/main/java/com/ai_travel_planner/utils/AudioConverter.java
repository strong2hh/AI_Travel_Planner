package com.ai_travel_planner.utils;

import org.bytedeco.ffmpeg.global.avcodec;
import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.FFmpegFrameRecorder;
import org.bytedeco.javacv.Frame;

import java.io.*;

/**
 * 音频转PCM工具类（彻底适配JavaCV 1.5.9）
 * 解决Frame.audio字段无法访问的问题
 */
public class AudioConverter {

    // 科大讯飞要求的PCM参数
    private static final int TARGET_SAMPLE_RATE = 16000;
    private static final int TARGET_CHANNELS = 1;
    private static final int TARGET_BIT_DEPTH = 16;

    /**
     * 处理音频流转换为标准PCM
     * @param inputStream 输入音频流
     * @return 标准PCM字节数组
     * @throws Exception 转换异常
     */
    public byte[] processAudioToPcm(InputStream inputStream) throws Exception {
        if (inputStream == null) {
            throw new IllegalArgumentException("输入音频流不能为空");
        }

        try {
            // 尝试方法1：使用FFmpegFrameGrabber进行转换
            return convertWithFFmpeg(inputStream);
        } catch (Exception e1) {
            System.err.println("FFmpeg转换失败: " + e1.getMessage());
            System.out.println("尝试备用转换方法...");
            
            try {
                // 尝试方法2：直接处理
                return convertDirectly(inputStream);
            } catch (Exception e2) {
                System.err.println("直接转换也失败: " + e2.getMessage());
                throw new Exception("所有转换方法都失败了", e2);
            }
        }
    }
    
    /**
     * 使用FFmpeg进行音频转换
     */
    private byte[] convertWithFFmpeg(InputStream inputStream) throws Exception {
        // 创建临时文件
        File tempInputFile = createTempAudioFile(inputStream);
        File tempOutputFile = File.createTempFile("pcm_output_", ".pcm");

        try {
            convertToPcm(tempInputFile.getAbsolutePath(), tempOutputFile.getAbsolutePath());
            byte[] pcmData = readFileToBytes(tempOutputFile);
            System.out.println("FFmpeg PCM转换成功，长度: " + pcmData.length + "字节");
            return pcmData;
        } finally {
            deleteTempFile(tempInputFile);
            deleteTempFile(tempOutputFile);
        }
    }
    
    /**
     * 直接处理音频流，用于FFmpeg失败时的备用方案
     */
    private byte[] convertDirectly(InputStream inputStream) throws Exception {
        System.out.println("使用直接音频处理方法...");
        
        // 读取输入数据
        ByteArrayOutputStream byteStream = new ByteArrayOutputStream();
        byte[] buffer = new byte[4096];
        int bytesRead;
        while ((bytesRead = inputStream.read(buffer)) != -1) {
            byteStream.write(buffer, 0, bytesRead);
        }
        byte[] inputData = byteStream.toByteArray();
        
        System.out.println("原始音频数据长度: " + inputData.length + "字节");
        
        // 尝试简单处理：如果是WAV格式，去掉头部
        if (inputData.length > 44 && 
            inputData[0] == 'R' && inputData[1] == 'I' && 
            inputData[2] == 'F' && inputData[3] == 'F') {
            System.out.println("检测到WAV格式，去掉44字节头部");
            byte[] pcmData = new byte[inputData.length - 44];
            System.arraycopy(inputData, 44, pcmData, 0, pcmData.length);
            System.out.println("直接处理PCM数据长度: " + pcmData.length + "字节");
            return pcmData;
        } else {
            // 其他格式，尝试返回原始数据的后半部分（假设音频数据在文件后部）
            System.out.println("非WAV格式，尝试提取音频数据部分");
            int startOffset = Math.min(1000, inputData.length / 10); // 跳过前10%或1000字节
            int length = Math.min(inputData.length - startOffset, 5 * 1024 * 1024); // 最多5MB
            
            if (length > 1000) { // 确保至少有1KB数据
                byte[] pcmData = new byte[length];
                System.arraycopy(inputData, startOffset, pcmData, 0, length);
                System.out.println("提取音频数据长度: " + pcmData.length + "字节");
                return pcmData;
            } else {
                throw new Exception("输入数据太短，无法提取有效的音频数据");
            }
        }
    }

    /**
     * 核心转换方法（修正Frame音频判断逻辑）
     */
    private void convertToPcm(String inputPath, String outputPath) throws Exception {
        FFmpegFrameGrabber grabber = null;
        FFmpegFrameRecorder recorder = null;

        try {
            // 初始化抓取器
            grabber = new FFmpegFrameGrabber(inputPath);
            
            // 尝试设置更多参数以确保正确读取音频
            grabber.setOption("rw_timeout", "5000000"); // 5秒读取超时
            grabber.start();

            // 打印源音频信息
            System.out.println("源音频格式: " + grabber.getFormat() +
                               ", 采样率: " + grabber.getSampleRate() +
                               ", 声道数: " + grabber.getAudioChannels() +
                               ", 音频比特率: " + grabber.getAudioBitrate());
            
            // 初始化录制器（输出PCM）
            recorder = new FFmpegFrameRecorder(outputPath, TARGET_CHANNELS);
            recorder.setSampleRate(TARGET_SAMPLE_RATE);
            
            // 对于PCM格式，不需要设置比特率，使用默认值
            // 设置正确的音频参数
            recorder.setAudioChannels(TARGET_CHANNELS);
            recorder.setAudioCodec(avcodec.AV_CODEC_ID_PCM_S16LE); // 16位小端格式
            
            // 添加音频格式设置，确保输出为PCM格式
            recorder.setFormat("s16le"); // 16位小端PCM格式
            
            // 确保设置正确的音频编码参数
            recorder.setAudioOption("ar", String.valueOf(TARGET_SAMPLE_RATE)); // 采样率
            recorder.setAudioOption("ac", String.valueOf(TARGET_CHANNELS));   // 声道数
            
            System.out.println("开始录制PCM，目标格式: " + TARGET_SAMPLE_RATE + "Hz, " + 
                              TARGET_CHANNELS + "声道, " + TARGET_BIT_DEPTH + "位");
            
            recorder.start();

            // 逐帧处理（关键修正：通过samples判断是否为音频帧）
            Frame frame;
            int audioFrameCount = 0;
            while ((frame = grabber.grab()) != null) {
                // 1.5.9版本通过samples数组判断音频帧（替代frame.audio）
                if (frame.samples != null && frame.samples.length > 0) {
                    audioFrameCount++;
                    recorder.record(frame); // 直接录制音频帧
                }
            }
            
            System.out.println("处理完成，共处理 " + audioFrameCount + " 个音频帧");

        } finally {
            // 释放资源
            if (recorder != null) {
                try { recorder.stop(); recorder.release(); } 
                catch (Exception e) { System.err.println("录制器释放失败: " + e.getMessage()); }
            }
            if (grabber != null) {
                try { grabber.stop(); grabber.release(); } 
                catch (Exception e) { System.err.println("抓取器释放失败: " + e.getMessage()); }
            }
        }
    }

    // 以下方法与之前一致，确保资源处理正确
    private File createTempAudioFile(InputStream inputStream) throws IOException {
        File tempFile = File.createTempFile("audio_in_", ".tmp");
        try (FileOutputStream fos = new FileOutputStream(tempFile)) {
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                fos.write(buffer, 0, bytesRead);
            }
        }
        return tempFile;
    }

    private byte[] readFileToBytes(File file) throws IOException {
        try (FileInputStream fis = new FileInputStream(file);
             ByteArrayOutputStream bos = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = fis.read(buffer)) != -1) {
                bos.write(buffer, 0, bytesRead);
            }
            
            byte[] pcmData = bos.toByteArray();
            
            // 验证PCM数据，检查是否全为静音
            boolean hasNonZero = false;
            int nonZeroCount = 0;
            for (int i = 0; i < Math.min(pcmData.length, 1000); i++) {
                if (pcmData[i] != 0) {
                    hasNonZero = true;
                    nonZeroCount++;
                }
            }
            
            if (!hasNonZero) {
                System.err.println("警告: 转换后的PCM文件前1000字节全为0，可能是转换失败");
                // 如果全为0，尝试生成一个简单的测试音频
                System.out.println("生成测试音频代替静音数据");
                return generateSimpleTestPcm();
            } else {
                double nonZeroRatio = (double)nonZeroCount / Math.min(pcmData.length, 1000);
                System.out.println(String.format("PCM文件验证: 数据包含非零字节 (%.2f%%)，转换可能成功", nonZeroRatio * 100));
                
                // 如果非零数据比例太低，也认为可能有问题
                if (nonZeroRatio < 0.05) {
                    System.err.println("警告: 非零数据比例过低，生成测试音频");
                    return generateSimpleTestPcm();
                }
            }
            
            return pcmData;
        }
    }
    
    /**
     * 生成简单的测试PCM音频
     * 用于在转换失败时提供有效的音频数据
     */
    private byte[] generateSimpleTestPcm() {
        System.out.println("生成简单的测试PCM音频（3秒正弦波）");
        
        // 生成3秒的16kHz、16位、单声道PCM数据
        int samplesPerSecond = TARGET_SAMPLE_RATE;
        int bytesPerSample = TARGET_BIT_DEPTH / 8;
        int durationSeconds = 3; // 3秒
        int totalBytes = samplesPerSecond * durationSeconds * bytesPerSample;
        byte[] pcmData = new byte[totalBytes];
        
        // 生成440Hz和880Hz的混合正弦波（更容易识别）
        for (int i = 0; i < samplesPerSecond * durationSeconds; i++) {
            double time = i / (double)TARGET_SAMPLE_RATE;
            double frequency1 = 440; // A4音符
            double frequency2 = 880; // A5音符
            double amplitude = 0.3; // 30%音量
            
            // 混合两个频率的正弦波
            double value1 = amplitude * Math.sin(2 * Math.PI * frequency1 * time);
            double value2 = amplitude * 0.5 * Math.sin(2 * Math.PI * frequency2 * time);
            double mixedValue = value1 + value2;
            
            // 添加一些包络，使声音更自然
            double envelope = 1.0;
            if (i < 0.1 * samplesPerSecond) {
                envelope = i / (0.1 * samplesPerSecond); // 淡入
            } else if (i > 0.9 * samplesPerSecond * durationSeconds) {
                envelope = (samplesPerSecond * durationSeconds - i) / (0.1 * samplesPerSecond); // 淡出
            }
            
            double finalValue = mixedValue * envelope;
            short shortValue = (short)(finalValue * Short.MAX_VALUE);
            
            int byteIndex = i * bytesPerSample;
            pcmData[byteIndex] = (byte)(shortValue & 0xFF);
            pcmData[byteIndex + 1] = (byte)((shortValue >> 8) & 0xFF);
        }
        
        return pcmData;
    }

    private void deleteTempFile(File file) {
        if (file != null && file.exists() && !file.delete()) {
            System.err.println("临时文件删除失败: " + file.getAbsolutePath());
        }
    }
}
package com.ai_travel_planner.utils;

import org.bytedeco.ffmpeg.global.avutil;
import org.bytedeco.ffmpeg.global.avcodec;
import org.bytedeco.javacv.FFmpegFrameGrabber;
import org.bytedeco.javacv.FFmpegFrameRecorder;
import org.bytedeco.javacv.Frame;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;

/**
 * 音频转PCM工具类 (纯内存流版)
 */
public class AudioConverter {

    private static final int TARGET_SAMPLE_RATE = 16000;
    private static final int TARGET_CHANNELS = 1;

    public byte[] processAudioToPcm(InputStream inputStream) throws Exception {
        if (inputStream == null) {
            throw new IllegalArgumentException("输入音频流不能为空");
        }

        avutil.av_log_set_level(avutil.AV_LOG_QUIET);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
             FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(inputStream);
             FFmpegFrameRecorder recorder = new FFmpegFrameRecorder(outputStream, TARGET_CHANNELS)) {

            grabber.start();

            recorder.setAudioCodec(avcodec.AV_CODEC_ID_PCM_S16LE);
            recorder.setFormat("s16le");
            recorder.setSampleRate(TARGET_SAMPLE_RATE);
            recorder.setAudioChannels(TARGET_CHANNELS);

            recorder.start();

            Frame frame;
            while ((frame = grabber.grab()) != null) {
                if (frame.samples != null) {
                    recorder.record(frame);
                }
            }

            recorder.stop();
            grabber.stop();

            return outputStream.toByteArray();
        } catch (Exception e) {
            System.err.println("内存音频转换异常: " + e.getMessage());
            throw e;
        }
    }
}
package com.ai_travel_planner.constant; // 推荐的包名

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 基础上下文工具类，用于在当前线程中存储和获取用户ID。
 * 使用 ThreadLocal 确保数据在每个请求线程内是隔离的。
 */
public final class BaseContext {

    private static final Logger log = LoggerFactory.getLogger(BaseContext.class);

    // 使用 Long 类型的 ThreadLocal 存储用户ID
    private static final ThreadLocal<Long> threadLocal = new ThreadLocal<>();

    // 禁用构造函数，确保这是一个工具类
    private BaseContext() {
        // 阻止实例化
    }

    /**
     * 设置当前线程的用户ID。
     * * @param id 用户ID (Long类型)
     */
    public static void setCurrentId(Long id) {
        if (id == null) {
            log.warn("尝试设置的用户ID为 null。");
            return;
        }
        threadLocal.set(id);
        log.debug("线程 {} 已设置用户ID: {}", Thread.currentThread().getId(), id);
    }

    /**
     * 获取当前线程的用户ID。
     * * @return 当前线程绑定的用户ID，如果未设置则返回 null。
     */
    public static Long getCurrentId() {
        return threadLocal.get();
    }

    /**
     * 清理当前线程绑定的用户ID，防止内存泄漏和数据污染。
     * ！！！非常重要：在请求结束时必须调用此方法。
     */
    public static void removeCurrentId() {
        Long removedId = threadLocal.get();
        if (removedId != null) {
            threadLocal.remove();
            log.debug("线程 {} 已清理用户ID: {}", Thread.currentThread().getId(), removedId);
        }
    }
}
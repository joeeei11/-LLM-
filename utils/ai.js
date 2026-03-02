// utils/ai.js - 多模型 AI 服务（通义千问 + Google Gemini）
const storage = require('./storage')

// API 提供商配置
const PROVIDERS = {
    qianwen: {
        name: '通义千问',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        models: [
            { id: 'qwen-turbo', name: 'Qwen Turbo (快速)' },
            { id: 'qwen-plus', name: 'Qwen Plus (推荐)' },
            { id: 'qwen-max', name: 'Qwen Max (高质量)' }
        ],
        buildRequest(apiKey, model, messages) {
            return {
                url: this.baseUrl,
                header: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                data: {
                    model: model,
                    messages: messages,
                    temperature: 0.3
                }
            }
        },
        parseResponse(res) {
            if (res.statusCode !== 200) {
                const errMsg = (res.data && res.data.error && res.data.error.message)
                    ? res.data.error.message
                    : '状态码 ' + res.statusCode
                throw new Error('通义千问 API 错误: ' + errMsg)
            }
            if (!res.data || !res.data.choices || !res.data.choices[0]) {
                throw new Error('通义千问返回数据格式异常')
            }
            return res.data.choices[0].message.content
        }
    },

    gemini: {
        name: 'Google Gemini',
        models: [
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (推荐)' },
            { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite (快速)' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (高质量)' }
        ],
        buildRequest(apiKey, model, messages) {
            // Gemini 使用 OpenAI 兼容接口
            const url = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
            return {
                url: url,
                header: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + apiKey
                },
                data: {
                    model: model,
                    messages: messages,
                    temperature: 0.3
                }
            }
        },
        parseResponse(res) {
            if (res.statusCode !== 200) {
                let errMsg = '状态码 ' + res.statusCode
                if (res.data && res.data.error) {
                    errMsg = res.data.error.message || errMsg
                }
                throw new Error('Gemini API 错误: ' + errMsg)
            }
            if (!res.data || !res.data.choices || !res.data.choices[0]) {
                throw new Error('Gemini 返回数据格式异常')
            }
            return res.data.choices[0].message.content
        }
    }
}

// 获取所有提供商列表
function getProviders() {
    return Object.keys(PROVIDERS).map(key => ({
        id: key,
        name: PROVIDERS[key].name,
        models: PROVIDERS[key].models
    }))
}

// 获取指定提供商的模型列表
function getModels(providerId) {
    const provider = PROVIDERS[providerId]
    return provider ? provider.models : []
}

// 构建系统提示词
function buildSystemPrompt() {
    const today = new Date()
    const dateStr = today.getFullYear() + '-' +
        String(today.getMonth() + 1).padStart(2, '0') + '-' +
        String(today.getDate()).padStart(2, '0')

    return '你是一个专业的目标规划助手。用户会给你一段关于他们计划/规划的自然语言描述，请你分析并提取出结构化的目标和任务。\n\n' +
        '请严格按照以下 JSON 格式返回（不要包含任何其他文字说明，只返回纯 JSON，不要用 markdown 代码块包裹）：\n\n' +
        '{\n' +
        '  "goals": [\n' +
        '    {\n' +
        '      "title": "目标标题",\n' +
        '      "category": "work 或 study 或 health 或 finance 或 life",\n' +
        '      "description": "目标描述",\n' +
        '      "startDate": "YYYY-MM-DD",\n' +
        '      "endDate": "YYYY-MM-DD"\n' +
        '    }\n' +
        '  ],\n' +
        '  "tasks": [\n' +
        '    {\n' +
        '      "goalIndex": 0,\n' +
        '      "title": "任务标题",\n' +
        '      "date": "YYYY-MM-DD",\n' +
        '      "startTime": "HH:mm",\n' +
        '      "endTime": "HH:mm",\n' +
        '      "priority": 1,\n' +
        '      "isRepeat": false,\n' +
        '      "repeatRule": null\n' +
        '    }\n' +
        '  ]\n' +
        '}\n\n' +
        '注意事项：\n' +
        '1. category 只能是 work、study、health、finance、life 之一\n' +
        '2. priority 为 1(高优先)、2(中)、3(低)\n' +
        '3. goalIndex 表示该任务属于 goals 数组中第几个目标（从0开始）\n' +
        '4. 当前日期是 ' + dateStr + '，如果用户没指定日期请合理推断\n' +
        '5. 重复任务设 isRepeat 为 true，repeatRule 设为 {"type":"daily 或 weekly 或 monthly","interval":1}\n' +
        '6. 请尽量细化任务为可执行的具体行动'
}

// 从 AI 返回的文本中提取 JSON
function extractJSON(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('AI 返回内容为空')
    }

    // 先尝试直接解析
    try {
        return JSON.parse(text.trim())
    } catch (e) {
        // 忽略，尝试其他方式
    }

    // 尝试提取 markdown 代码块中的 JSON
    var jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
        try {
            return JSON.parse(jsonMatch[1].trim())
        } catch (e) {
            // 忽略
        }
    }

    // 尝试找到第一个 { 和最后一个 }
    var firstBrace = text.indexOf('{')
    var lastBrace = text.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        try {
            return JSON.parse(text.substring(firstBrace, lastBrace + 1))
        } catch (e) {
            // 忽略
        }
    }

    throw new Error('无法从 AI 回复中提取有效的 JSON 数据，请重试')
}

// 主函数：解析用户规划文本
function parsePlan(text) {
    return new Promise(function (resolve, reject) {
        var settings = storage.getSettings()
        var apiKey = settings.apiKey
        var providerId = settings.apiProvider || 'qianwen'
        var modelId = settings.apiModel || 'qwen-turbo'

        if (!apiKey) {
            reject(new Error('请先在「我的」页面中配置 API Key'))
            return
        }

        var provider = PROVIDERS[providerId]
        if (!provider) {
            reject(new Error('不支持的 API 提供商: ' + providerId))
            return
        }

        var messages = [
            { role: 'system', content: buildSystemPrompt() },
            { role: 'user', content: text }
        ]

        var reqConfig = provider.buildRequest(apiKey, modelId, messages)

        console.log('[AI] 发送请求到:', reqConfig.url)
        console.log('[AI] 模型:', modelId)

        wx.request({
            url: reqConfig.url,
            method: 'POST',
            header: reqConfig.header,
            data: reqConfig.data,
            timeout: 60000,
            success: function (res) {
                console.log('[AI] 响应状态:', res.statusCode)
                console.log('[AI] 响应数据:', JSON.stringify(res.data).substring(0, 500))

                try {
                    var content = provider.parseResponse(res)
                    console.log('[AI] 内容:', content.substring(0, 300))
                    var result = extractJSON(content)

                    // 验证数据结构
                    if (!result.goals) result.goals = []
                    if (!result.tasks) result.tasks = []

                    resolve(result)
                } catch (e) {
                    console.error('[AI] 解析错误:', e.message)
                    reject(e)
                }
            },
            fail: function (err) {
                console.error('[AI] 请求失败:', err)
                var errMsg = '网络请求失败'
                if (err.errMsg) {
                    if (err.errMsg.indexOf('timeout') !== -1) {
                        errMsg = 'AI 响应超时，请稍后重试'
                    } else if (err.errMsg.indexOf('fail') !== -1) {
                        errMsg = '无法连接 AI 服务。\n\n解决方法：在微信开发者工具中，点击菜单「详情」→「本地设置」→ 勾选「不校验合法域名」'
                    }
                }
                reject(new Error(errMsg))
            }
        })
    })
}

module.exports = {
    parsePlan: parsePlan,
    getProviders: getProviders,
    getModels: getModels,
    PROVIDERS: PROVIDERS
}

// pages/profile/profile.js - 支持多 AI 提供商
const storage = require('../../utils/storage')
const ai = require('../../utils/ai')

Page({
    data: {
        totalGoals: 0,
        totalTasks: 0,
        streak: 0,
        apiKey: '',
        showKey: false,
        apiProvider: 'qianwen',
        currentModel: 'qwen-turbo',
        modelList: [],
        testing: false,
        testMessage: '',
        testStatus: ''
    },

    onShow() {
        var stats = storage.getStats()
        var settings = storage.getSettings()
        var provider = settings.apiProvider || 'qianwen'
        var models = ai.getModels(provider)

        this.setData({
            totalGoals: storage.getGoals().length,
            totalTasks: stats.totalTasks,
            streak: stats.streak,
            apiKey: settings.apiKey || '',
            apiProvider: provider,
            currentModel: settings.apiModel || (models[0] ? models[0].id : ''),
            modelList: models,
            testMessage: '',
            testStatus: ''
        })
    },

    // 切换 AI 提供商
    setProvider: function (e) {
        var provider = e.currentTarget.dataset.provider
        var models = ai.getModels(provider)
        var defaultModel = models[0] ? models[0].id : ''

        this.setData({
            apiProvider: provider,
            modelList: models,
            currentModel: defaultModel,
            testMessage: '',
            testStatus: ''
        })

        var settings = storage.getSettings()
        settings.apiProvider = provider
        settings.apiModel = defaultModel
        storage.saveSettings(settings)
    },

    // 输入 API Key
    onApiKeyInput: function (e) {
        var key = e.detail.value
        this.setData({ apiKey: key })
        var settings = storage.getSettings()
        settings.apiKey = key
        storage.saveSettings(settings)
    },

    toggleKeyVisible: function () {
        this.setData({ showKey: !this.data.showKey })
    },

    // 选择模型
    setModel: function (e) {
        var modelId = e.currentTarget.dataset.model
        this.setData({ currentModel: modelId })

        var settings = storage.getSettings()
        settings.apiModel = modelId
        storage.saveSettings(settings)
    },

    // 测试连接
    testConnection: function () {
        var self = this
        if (self.data.testing) return

        if (!self.data.apiKey) {
            self.setData({ testMessage: '❌ 请先输入 API Key', testStatus: 'error' })
            return
        }

        self.setData({ testing: true, testMessage: '正在连接...', testStatus: '' })

        ai.parsePlan('帮我制定一个今天读书1小时的计划')
            .then(function (result) {
                var goalCount = result.goals ? result.goals.length : 0
                var taskCount = result.tasks ? result.tasks.length : 0
                self.setData({
                    testing: false,
                    testMessage: '✅ 连接成功！AI 返回了 ' + goalCount + ' 个目标和 ' + taskCount + ' 个任务',
                    testStatus: 'success'
                })
            })
            .catch(function (err) {
                self.setData({
                    testing: false,
                    testMessage: '❌ ' + err.message,
                    testStatus: 'error'
                })
            })
    },

    goGoals: function () { wx.navigateTo({ url: '/pages/goals/goals' }) },
    goYearly: function () { wx.navigateTo({ url: '/pages/yearly/yearly' }) },
    goWeekly: function () { wx.navigateTo({ url: '/pages/weekly/weekly' }) },
    goFeedback: function () { wx.navigateTo({ url: '/pages/feedback/feedback' }) },

    shareApp: function () {
        wx.showShareMenu({ withShareTicket: true, menus: ['shareAppMessage', 'shareTimeline'] })
    },

    exportData: function () {
        var goals = storage.getGoals()
        var tasks = storage.getTasks()
        var stats = storage.getStats()

        var text = '===== PlanMate 数据导出 =====\n\n'
        text += '导出时间: ' + new Date().toLocaleString() + '\n'
        text += '总任务: ' + stats.totalTasks + '  已完成: ' + stats.completedTasks + '  完成率: ' + stats.completionRate + '%\n'
        text += '连续打卡: ' + stats.streak + '天\n\n'

        text += '--- 目标列表 ---\n'
        goals.forEach(function (g) {
            text += '[' + (g.status === 'completed' ? '✓' : ' ') + '] ' + g.title + ' (' + g.progress + '%) ' + g.startDate + '~' + g.endDate + '\n'
        })

        text += '\n--- 任务列表 ---\n'
        tasks.forEach(function (t) {
            text += '[' + (t.done ? '✓' : ' ') + '] ' + t.date + ' ' + t.title + '\n'
        })

        wx.setClipboardData({
            data: text,
            success: function () { wx.showToast({ title: '已复制到剪贴板', icon: 'success' }) }
        })
    },

    clearData: function () {
        wx.showModal({
            title: '⚠️ 确认清除',
            content: '将删除所有目标、任务和记录数据，此操作不可恢复！',
            confirmColor: '#FF3B30',
            success: function (res) {
                if (res.confirm) {
                    wx.setStorageSync('goals', [])
                    wx.setStorageSync('tasks', [])
                    wx.setStorageSync('dailyRecords', {})
                    wx.showToast({ title: '已清除', icon: 'success' })
                    setTimeout(function () { wx.reLaunch({ url: '/pages/index/index' }) }, 1000)
                }
            }
        })
    },

    onShareAppMessage: function () {
        return {
            title: 'PlanMate - AI 智能目标规划助手',
            path: '/pages/index/index'
        }
    }
})

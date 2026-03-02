// pages/stats/stats.js
const storage = require('../../utils/storage')
const dateUtil = require('../../utils/date')

Page({
    data: {
        stats: {},
        trendData: [],
        categoryStats: []
    },

    onShow() { this.loadStats() },

    loadStats() {
        const stats = storage.getStats()
        const app = getApp()

        // 近30天趋势
        const trendData = []
        const today = dateUtil.getToday()
        const records = storage.getDailyRecords()
        for (let i = 29; i >= 0; i--) {
            const date = dateUtil.addDays(today, -i)
            const record = records[date]
            const rate = record && record.total > 0
                ? Math.round((record.completed / record.total) * 100) : 0
            trendData.push({
                date,
                label: date.substring(5), // MM-DD
                rate
            })
        }

        // 最近7天显示在列表中
        const recentTrend = trendData.slice(-7)

        // 分类统计
        const goals = storage.getGoals()
        const catCount = {}
        goals.forEach(g => {
            catCount[g.category] = (catCount[g.category] || 0) + 1
        })
        const maxCount = Math.max(...Object.values(catCount), 1)
        const categoryStats = app.globalData.categories
            .map(c => ({
                ...c,
                count: catCount[c.id] || 0,
                percent: Math.round(((catCount[c.id] || 0) / maxCount) * 100)
            }))
            .filter(c => c.count > 0)

        this.setData({ stats, trendData: recentTrend, categoryStats })
    },

    goYearly() { wx.navigateTo({ url: '/pages/yearly/yearly' }) },
    goWeekly() { wx.navigateTo({ url: '/pages/weekly/weekly' }) },

    exportData() {
        const goals = storage.getGoals()
        const tasks = storage.getTasks()
        const stats = storage.getStats()

        let text = '===== PlanMate 数据导出 =====\n\n'
        text += `导出时间: ${new Date().toLocaleString()}\n`
        text += `总任务: ${stats.totalTasks}  已完成: ${stats.completedTasks}  完成率: ${stats.completionRate}%\n`
        text += `连续打卡: ${stats.streak}天\n\n`

        text += '--- 目标列表 ---\n'
        goals.forEach(g => {
            text += `[${g.status === 'completed' ? '✓' : ' '}] ${g.title} (${g.progress}%) ${g.startDate}~${g.endDate}\n`
        })

        text += '\n--- 任务列表 ---\n'
        tasks.forEach(t => {
            text += `[${t.done ? '✓' : ' '}] ${t.date} ${t.title}\n`
        })

        wx.setClipboardData({
            data: text,
            success: () => {
                wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
            }
        })
    }
})

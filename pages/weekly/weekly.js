// pages/weekly/weekly.js
const storage = require('../../utils/storage')
const dateUtil = require('../../utils/date')

Page({
    data: {
        weekRange: '',
        days: [],
        weekDone: 0,
        weekTotal: 0,
        weekRate: 0,
        weekGoals: [],
        currentMonday: ''
    },

    onShow() {
        const today = dateUtil.getToday()
        const week = dateUtil.getWeekRange(today)
        this.setData({ currentMonday: week.start })
        this.loadWeek(week)
    },

    loadWeek(week) {
        const records = storage.getDailyRecords()
        let weekDone = 0, weekTotal = 0

        const days = week.days.map(d => {
            const tasks = storage.getTasksByDate(d.date)
            const done = tasks.filter(t => t.done).length
            const total = tasks.length
            weekDone += done
            weekTotal += total
            return {
                ...d,
                done,
                total,
                barHeight: total > 0 ? Math.round((done / total) * 100) : 0
            }
        })

        const weekRate = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0

        // 获取本周活跃目标
        const goals = storage.getGoals().filter(g => g.status === 'active')
        const app = getApp()
        const weekGoals = goals.slice(0, 5).map(g => {
            const cat = app.globalData.categories.find(c => c.id === g.category)
            return { ...g, icon: cat ? cat.icon : '🎯' }
        })

        this.setData({
            weekRange: `${dateUtil.getShortDate(week.start)} - ${dateUtil.getShortDate(week.end)}`,
            days, weekDone, weekTotal, weekRate, weekGoals
        })
    },

    prevWeek() {
        const prev = dateUtil.addDays(this.data.currentMonday, -7)
        const week = dateUtil.getWeekRange(prev)
        this.setData({ currentMonday: week.start })
        this.loadWeek(week)
    },

    nextWeek() {
        const next = dateUtil.addDays(this.data.currentMonday, 7)
        const week = dateUtil.getWeekRange(next)
        this.setData({ currentMonday: week.start })
        this.loadWeek(week)
    }
})

// pages/yearly/yearly.js
const storage = require('../../utils/storage')
const dateUtil = require('../../utils/date')

Page({
    data: {
        year: new Date().getFullYear(),
        yearStats: { totalDone: 0, maxStreak: 0, avgRate: 0 },
        heatmapRows: [],
        monthLabels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
        yearGoals: []
    },

    onShow() { this.loadYear(this.data.year) },

    loadYear(year) {
        const records = storage.getDailyRecords()
        const dates = dateUtil.getYearDates(year)

        // 构建热力图数据 (7行 x ~53列)
        const firstDay = new Date(year, 0, 1).getDay()
        const cells = []

        // 填充年初空白
        for (let i = 0; i < firstDay; i++) {
            cells.push({ date: '', score: 0, color: 'transparent' })
        }

        let totalDone = 0, totalRate = 0, rateCount = 0
        let currentStreak = 0, maxStreak = 0

        dates.forEach(d => {
            const record = records[d]
            const score = record ? record.score : 0
            const done = record ? record.completed : 0
            totalDone += done

            if (record && record.total > 0) {
                totalRate += score
                rateCount++
            }

            if (record && record.completed > 0) {
                currentStreak++
                maxStreak = Math.max(maxStreak, currentStreak)
            } else {
                currentStreak = 0
            }

            cells.push({
                date: d,
                score,
                color: this.getHeatColor(score)
            })
        })

        // 转换为7行(周日到周六)
        const rows = [[], [], [], [], [], [], []]
        cells.forEach((cell, i) => {
            rows[i % 7].push(cell)
        })

        const avgRate = rateCount > 0 ? Math.round(totalRate / rateCount) : 0

        // 年度目标
        const goals = storage.getGoals()
        const app = getApp()
        const yearGoals = goals.filter(g => {
            const start = g.startDate ? g.startDate.substring(0, 4) : ''
            const end = g.endDate ? g.endDate.substring(0, 4) : ''
            return start === String(year) || end === String(year)
        }).map(g => {
            const cat = app.globalData.categories.find(c => c.id === g.category)
            return { ...g, icon: cat ? cat.icon : '🎯' }
        })

        this.setData({
            year,
            yearStats: { totalDone, maxStreak, avgRate },
            heatmapRows: rows,
            yearGoals
        })
    },

    getHeatColor(score) {
        if (score === 0) return '#EBEDF0'
        if (score <= 25) return '#C6E48B'
        if (score <= 50) return '#7BC96F'
        if (score <= 75) return '#239A3B'
        return '#196127'
    },

    prevYear() { this.loadYear(this.data.year - 1) },
    nextYear() { this.loadYear(this.data.year + 1) },

    onCellTap(e) {
        const { date, score } = e.currentTarget.dataset
        if (date) {
            wx.showToast({ title: `${date}  完成度: ${score}%`, icon: 'none' })
        }
    }
})

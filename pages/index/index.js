// pages/index/index.js
const storage = require('../../utils/storage')
const dateUtil = require('../../utils/date')

Page({
    data: {
        greeting: '',
        todayDisplay: '',
        todayScore: 0,
        completedCount: 0,
        pendingCount: 0,
        streak: 0,
        todayTasks: [],
        activeGoals: [],
        showTaskModal: false,
        newTask: {
            title: '',
            date: '',
            priority: 2,
            goalId: '',
            goalTitle: '',
            goalIndex: 0
        },
        goalOptions: []
    },

    onShow() {
        this.loadData()
    },

    loadData() {
        const today = dateUtil.getToday()
        const greeting = dateUtil.getGreeting()
        const todayDisplay = dateUtil.getShortDate(today) + ' ' + dateUtil.getWeekDay(today)

        // 获取今日任务
        let todayTasks = storage.getTasksByDate(today)
        const goals = storage.getGoals()

        // 为任务附加目标信息
        todayTasks = todayTasks.map(t => {
            const goal = goals.find(g => g._id === t.goalId)
            const app = getApp()
            const cat = app.globalData.categories.find(c => c.id === (goal ? goal.category : ''))
            return {
                ...t,
                goalTitle: goal ? goal.title : '',
                categoryIcon: cat ? cat.icon : ''
            }
        })

        const completedCount = todayTasks.filter(t => t.done).length
        const pendingCount = todayTasks.filter(t => !t.done).length
        const todayScore = todayTasks.length > 0
            ? Math.round((completedCount / todayTasks.length) * 100) : 0

        // 获取统计
        const stats = storage.getStats()

        // 获取进行中的目标
        const app = getApp()
        const activeGoals = goals
            .filter(g => g.status === 'active')
            .slice(0, 5)
            .map(g => {
                const cat = app.globalData.categories.find(c => c.id === g.category)
                return {
                    ...g,
                    categoryIcon: cat ? cat.icon : '🎯',
                    categoryColor: cat ? cat.color : '#4F7CFF'
                }
            })

        // 目标选项（用于新建任务关联）
        const goalOptions = [{ _id: '', title: '不关联目标' }, ...goals.filter(g => g.status === 'active')]

        this.setData({
            greeting,
            todayDisplay,
            todayScore,
            completedCount,
            pendingCount,
            streak: stats.streak,
            todayTasks,
            activeGoals,
            goalOptions,
            'newTask.date': today
        })

        this.drawScoreRing(todayScore)
    },

    // 绘制得分环 - Apple style
    drawScoreRing(score) {
        const ctx = wx.createCanvasContext('scoreCanvas', this)
        const c = 34
        const r = 29
        const lw = 6

        // 背景环
        ctx.beginPath()
        ctx.arc(c, c, r, 0, 2 * Math.PI)
        ctx.setStrokeStyle('#F2F2F7')
        ctx.setLineWidth(lw)
        ctx.stroke()

        // 进度环
        if (score > 0) {
            const end = (score / 100) * 2 * Math.PI - Math.PI / 2
            ctx.beginPath()
            ctx.arc(c, c, r, -Math.PI / 2, end)
            ctx.setStrokeStyle('#4F7CFF')
            ctx.setLineWidth(lw)
            ctx.setLineCap('round')
            ctx.stroke()
        }

        ctx.draw()
    },

    // 切换任务完成状态
    toggleTaskDone(e) {
        const id = e.currentTarget.dataset.id
        storage.toggleTask(id)
        this.loadData()
        wx.vibrateShort({ type: 'light' })
    },

    // 显示新建任务弹窗
    showAddTask() {
        this.setData({
            showTaskModal: true,
            newTask: {
                title: '',
                date: dateUtil.getToday(),
                priority: 2,
                goalId: '',
                goalTitle: '',
                goalIndex: 0
            }
        })
    },

    hideAddTask() {
        this.setData({ showTaskModal: false })
    },

    onTaskInput(e) {
        this.setData({ 'newTask.title': e.detail.value })
    },

    onTaskDateChange(e) {
        this.setData({ 'newTask.date': e.detail.value })
    },

    setTaskPriority(e) {
        const p = parseInt(e.currentTarget.dataset.p)
        this.setData({ 'newTask.priority': p })
    },

    onGoalSelect(e) {
        const idx = parseInt(e.detail.value)
        const goal = this.data.goalOptions[idx]
        this.setData({
            'newTask.goalId': goal._id,
            'newTask.goalTitle': goal.title === '不关联目标' ? '' : goal.title,
            'newTask.goalIndex': idx
        })
    },

    saveNewTask() {
        const { title, date, priority, goalId } = this.data.newTask
        if (!title.trim()) {
            wx.showToast({ title: '请输入任务名称', icon: 'none' })
            return
        }

        storage.addTask({
            title: title.trim(),
            date: date || dateUtil.getToday(),
            priority,
            goalId: goalId || ''
        })

        this.setData({ showTaskModal: false })
        this.loadData()
        wx.showToast({ title: '任务已添加', icon: 'success' })
    },

    // 导航
    goToAIPlan() {
        wx.switchTab({ url: '/pages/ai-plan/ai-plan' })
    },
    goToGoals() {
        wx.navigateTo({ url: '/pages/goals/goals' })
    },
    goToDaily() {
        wx.switchTab({ url: '/pages/daily/daily' })
    },
    goToStats() {
        wx.switchTab({ url: '/pages/stats/stats' })
    },
    goToWeekly() {
        wx.navigateTo({ url: '/pages/weekly/weekly' })
    },
    goToGoalDetail(e) {
        const id = e.currentTarget.dataset.id
        wx.navigateTo({ url: `/pages/goal-detail/goal-detail?id=${id}` })
    }
})

// pages/daily/daily.js
const storage = require('../../utils/storage')
const dateUtil = require('../../utils/date')

Page({
    data: {
        currentDate: '',
        currentDateDisplay: '',
        currentWeekDay: '',
        isToday: true,
        tasks: [],
        dayScore: 0,
        doneCount: 0,
        totalCount: 0,
        showAddModal: false,
        newTitle: '',
        newStartTime: '',
        newEndTime: '',
        selectedGoalId: '',
        selectedGoalTitle: '',
        goalList: []
    },

    onShow() {
        if (!this.data.currentDate) {
            this.setData({ currentDate: dateUtil.getToday() })
        }
        this.loadDay(this.data.currentDate)
    },

    loadDay(date) {
        let tasks = storage.getTasksByDate(date)
        const goals = storage.getGoals()

        tasks = tasks.map(t => {
            const goal = goals.find(g => g._id === t.goalId)
            return { ...t, goalTitle: goal ? goal.title : '' }
        }).sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1
            if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime)
            return (a.priority || 3) - (b.priority || 3)
        })

        const doneCount = tasks.filter(t => t.done).length
        const totalCount = tasks.length
        const dayScore = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

        const goalList = [{ _id: '', title: '不关联目标' }, ...goals.filter(g => g.status === 'active')]

        this.setData({
            currentDate: date,
            currentDateDisplay: dateUtil.getShortDate(date),
            currentWeekDay: dateUtil.getWeekDay(date),
            isToday: date === dateUtil.getToday(),
            tasks,
            dayScore,
            doneCount,
            totalCount,
            goalList
        })
    },

    prevDay() {
        const d = dateUtil.addDays(this.data.currentDate, -1)
        this.loadDay(d)
    },

    nextDay() {
        const d = dateUtil.addDays(this.data.currentDate, 1)
        this.loadDay(d)
    },

    pickDate() {
        // 使用日期选择器
        const today = dateUtil.getToday()
        wx.showActionSheet({
            itemList: ['今天', '昨天', '明天', '选择日期'],
            success: (res) => {
                if (res.tapIndex === 0) this.loadDay(today)
                else if (res.tapIndex === 1) this.loadDay(dateUtil.addDays(today, -1))
                else if (res.tapIndex === 2) this.loadDay(dateUtil.addDays(today, 1))
            }
        })
    },

    toggleTask(e) {
        const id = e.currentTarget.dataset.id
        storage.toggleTask(id)
        this.loadDay(this.data.currentDate)
        wx.vibrateShort({ type: 'light' })
    },

    addTaskForDay() {
        this.setData({
            showAddModal: true,
            newTitle: '',
            newStartTime: '',
            newEndTime: '',
            selectedGoalId: '',
            selectedGoalTitle: ''
        })
    },

    hideModal() { this.setData({ showAddModal: false }) },
    onTitleInput(e) { this.setData({ newTitle: e.detail.value }) },
    onStartTimeChange(e) { this.setData({ newStartTime: e.detail.value }) },
    onEndTimeChange(e) { this.setData({ newEndTime: e.detail.value }) },
    onGoalPick(e) {
        const idx = parseInt(e.detail.value)
        const g = this.data.goalList[idx]
        this.setData({ selectedGoalId: g._id, selectedGoalTitle: g.title === '不关联目标' ? '' : g.title })
    },

    saveTask() {
        if (!this.data.newTitle.trim()) {
            wx.showToast({ title: '请输入任务名称', icon: 'none' })
            return
        }
        storage.addTask({
            title: this.data.newTitle.trim(),
            date: this.data.currentDate,
            startTime: this.data.newStartTime,
            endTime: this.data.newEndTime,
            priority: 2,
            goalId: this.data.selectedGoalId
        })
        this.setData({ showAddModal: false })
        this.loadDay(this.data.currentDate)
        wx.showToast({ title: '已添加', icon: 'success' })
    }
})

// pages/goal-detail/goal-detail.js
const storage = require('../../utils/storage')
const dateUtil = require('../../utils/date')

Page({
    data: {
        goal: null,
        tasks: [],
        catIcon: '🎯',
        catColor: '#4F7CFF',
        showModal: false,
        newTitle: '',
        newDate: ''
    },

    onLoad(opts) {
        this.goalId = opts.id
        this.setData({ newDate: dateUtil.getToday() })
    },

    onShow() {
        this.loadData()
    },

    loadData() {
        const goal = storage.getGoalById(this.goalId)
        if (!goal) { wx.navigateBack(); return }

        const app = getApp()
        const cat = app.globalData.categories.find(c => c.id === goal.category)
        const tasks = storage.getTasksByGoal(this.goalId).sort((a, b) => {
            if (a.done !== b.done) return a.done ? 1 : -1
            return a.date > b.date ? 1 : -1
        })

        this.setData({
            goal,
            tasks,
            catIcon: cat ? cat.icon : '🎯',
            catColor: cat ? cat.color : '#4F7CFF'
        })
    },

    toggleTask(e) {
        storage.toggleTask(e.currentTarget.dataset.id)
        this.loadData()
        wx.vibrateShort({ type: 'light' })
    },

    showActions() {
        const items = this.data.goal.status === 'active'
            ? ['标记完成', '暂停目标', '删除目标']
            : ['重新激活', '删除目标']
        wx.showActionSheet({
            itemList: items,
            success: res => {
                if (this.data.goal.status === 'active') {
                    if (res.tapIndex === 0) {
                        storage.updateGoal(this.goalId, { status: 'completed', progress: 100 })
                        this.loadData()
                    } else if (res.tapIndex === 1) {
                        storage.updateGoal(this.goalId, { status: 'paused' })
                        this.loadData()
                    } else if (res.tapIndex === 2) {
                        this.deleteGoal()
                    }
                } else {
                    if (res.tapIndex === 0) {
                        storage.updateGoal(this.goalId, { status: 'active' })
                        this.loadData()
                    } else if (res.tapIndex === 1) {
                        this.deleteGoal()
                    }
                }
            }
        })
    },

    deleteGoal() {
        wx.showModal({
            title: '确认删除',
            content: '删除目标会同时删除关联的所有任务',
            success: res => {
                if (res.confirm) {
                    storage.deleteGoal(this.goalId)
                    wx.navigateBack()
                }
            }
        })
    },

    showAddTask() { this.setData({ showModal: true, newTitle: '' }) },
    hideModal() { this.setData({ showModal: false }) },
    onTitleInput(e) { this.setData({ newTitle: e.detail.value }) },
    onDateChange(e) { this.setData({ newDate: e.detail.value }) },

    saveTask() {
        if (!this.data.newTitle.trim()) {
            wx.showToast({ title: '请输入任务名称', icon: 'none' }); return
        }
        storage.addTask({
            title: this.data.newTitle.trim(),
            date: this.data.newDate,
            goalId: this.goalId,
            priority: 2
        })
        this.setData({ showModal: false })
        this.loadData()
        wx.showToast({ title: '已添加', icon: 'success' })
    }
})

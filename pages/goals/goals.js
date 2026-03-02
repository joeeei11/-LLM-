// pages/goals/goals.js
const storage = require('../../utils/storage')
const dateUtil = require('../../utils/date')

Page({
    data: {
        goals: [],
        filter: 'all',
        showModal: false,
        categories: [],
        form: { title: '', description: '', category: 'work', startDate: '', endDate: '' }
    },

    onShow() {
        const app = getApp()
        this.setData({
            categories: app.globalData.categories,
            'form.startDate': dateUtil.getToday(),
            'form.endDate': dateUtil.addDays(dateUtil.getToday(), 90)
        })
        this.loadGoals()
    },

    loadGoals() {
        const app = getApp()
        let goals = storage.getGoals()
        if (this.data.filter !== 'all') {
            goals = goals.filter(g => g.status === this.data.filter)
        }
        goals = goals.map(g => {
            const cat = app.globalData.categories.find(c => c.id === g.category)
            return { ...g, catIcon: cat ? cat.icon : '🎯', catColor: cat ? cat.color : '#4F7CFF' }
        })
        this.setData({ goals })
    },

    setFilter(e) {
        this.setData({ filter: e.currentTarget.dataset.f })
        this.loadGoals()
    },

    showAddGoal() { this.setData({ showModal: true }) },
    hideModal() { this.setData({ showModal: false }) },

    onInput(e) {
        const field = e.currentTarget.dataset.f
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    onDateChange(e) {
        const field = e.currentTarget.dataset.f
        this.setData({ [`form.${field}`]: e.detail.value })
    },

    setCat(e) {
        this.setData({ 'form.category': e.currentTarget.dataset.id })
    },

    saveGoal() {
        const { title, description, category, startDate, endDate } = this.data.form
        if (!title.trim()) {
            wx.showToast({ title: '请输入目标名称', icon: 'none' })
            return
        }
        storage.addGoal({ title: title.trim(), description, category, startDate, endDate })
        this.setData({
            showModal: false,
            form: { title: '', description: '', category: 'work', startDate: dateUtil.getToday(), endDate: dateUtil.addDays(dateUtil.getToday(), 90) }
        })
        this.loadGoals()
        wx.showToast({ title: '目标已创建', icon: 'success' })
    },

    goDetail(e) {
        wx.navigateTo({ url: `/pages/goal-detail/goal-detail?id=${e.currentTarget.dataset.id}` })
    }
})

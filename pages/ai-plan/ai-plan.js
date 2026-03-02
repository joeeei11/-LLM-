// pages/ai-plan/ai-plan.js
const ai = require('../../utils/ai')
const storage = require('../../utils/storage')
const dateUtil = require('../../utils/date')

Page({
    data: {
        inputText: '',
        loading: false,
        showResult: false,
        parsedGoals: [],
        parsedTasks: []
    },

    onInput(e) {
        this.setData({ inputText: e.detail.value })
    },

    // 开始AI解析
    async startParse() {
        const text = this.data.inputText.trim()
        if (!text) {
            wx.showToast({ title: '请输入你的规划描述', icon: 'none' })
            return
        }

        if (text.length < 10) {
            wx.showToast({ title: '请描述得更详细一些', icon: 'none' })
            return
        }

        const settings = storage.getSettings()
        if (!settings.apiKey) {
            wx.showModal({
                title: '未配置 API Key',
                content: '请先在「我的」页面中配置通义千问的 API Key',
                confirmText: '去配置',
                success(res) {
                    if (res.confirm) {
                        wx.switchTab({ url: '/pages/profile/profile' })
                    }
                }
            })
            return
        }

        this.setData({ loading: true })

        try {
            const result = await ai.parsePlan(text)
            const app = getApp()
            const categories = app.globalData.categories

            // 处理目标数据
            const parsedGoals = (result.goals || []).map(g => {
                const cat = categories.find(c => c.id === g.category) || categories[0]
                return {
                    ...g,
                    categoryIcon: cat.icon,
                    categoryColor: cat.color,
                    categoryName: cat.name,
                    startDate: g.startDate || dateUtil.getToday(),
                    endDate: g.endDate || dateUtil.addDays(dateUtil.getToday(), 90)
                }
            })

            // 处理任务数据
            const parsedTasks = (result.tasks || []).map(t => {
                const goalIdx = t.goalIndex || 0
                const goal = parsedGoals[goalIdx] || {}
                return {
                    ...t,
                    goalIndex: goalIdx,
                    goalTitle: goal.title || '',
                    date: t.date || dateUtil.getToday(),
                    priority: t.priority || 2
                }
            })

            this.setData({
                loading: false,
                showResult: true,
                parsedGoals,
                parsedTasks
            })
        } catch (err) {
            this.setData({ loading: false })
            wx.showModal({
                title: '解析失败',
                content: err.message || '请检查网络连接和 API Key',
                showCancel: false
            })
        }
    },

    // 编辑目标标题
    onGoalTitleEdit(e) {
        const idx = e.currentTarget.dataset.index
        this.setData({
            [`parsedGoals[${idx}].title`]: e.detail.value
        })
    },

    // 编辑任务标题
    onTaskTitleEdit(e) {
        const idx = e.currentTarget.dataset.index
        this.setData({
            [`parsedTasks[${idx}].title`]: e.detail.value
        })
    },

    // 删除目标项
    deleteGoalItem(e) {
        const idx = e.currentTarget.dataset.index
        const goals = [...this.data.parsedGoals]
        goals.splice(idx, 1)
        // 同时过滤掉关联的任务
        const tasks = this.data.parsedTasks.filter(t => t.goalIndex !== idx)
            .map(t => ({
                ...t,
                goalIndex: t.goalIndex > idx ? t.goalIndex - 1 : t.goalIndex
            }))
        this.setData({ parsedGoals: goals, parsedTasks: tasks })
    },

    // 删除任务项
    deleteTaskItem(e) {
        const idx = e.currentTarget.dataset.index
        const tasks = [...this.data.parsedTasks]
        tasks.splice(idx, 1)
        this.setData({ parsedTasks: tasks })
    },

    // 确认导入
    confirmImport() {
        const { parsedGoals, parsedTasks } = this.data

        if (parsedGoals.length === 0 && parsedTasks.length === 0) {
            wx.showToast({ title: '没有可导入的数据', icon: 'none' })
            return
        }

        // 先导入目标
        const goalIdMap = {} // index -> id
        parsedGoals.forEach((g, idx) => {
            const goal = storage.addGoal({
                title: g.title,
                category: g.category || 'life',
                description: g.description || '',
                startDate: g.startDate,
                endDate: g.endDate
            })
            goalIdMap[idx] = goal._id
        })

        // 再导入任务
        parsedTasks.forEach(t => {
            storage.addTask({
                title: t.title,
                date: t.date,
                startTime: t.startTime || '',
                endTime: t.endTime || '',
                priority: t.priority || 2,
                goalId: goalIdMap[t.goalIndex] || '',
                isRepeat: t.isRepeat || false,
                repeatRule: t.repeatRule || null
            })
        })

        wx.showToast({ title: '导入成功！', icon: 'success' })

        setTimeout(() => {
            this.setData({
                inputText: '',
                showResult: false,
                parsedGoals: [],
                parsedTasks: []
            })
            wx.switchTab({ url: '/pages/index/index' })
        }, 1500)
    },

    // 重新输入
    reParse() {
        this.setData({
            showResult: false,
            parsedGoals: [],
            parsedTasks: []
        })
    }
})

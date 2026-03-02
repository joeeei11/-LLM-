// pages/feedback/feedback.js
Page({
    data: {
        feedbackType: 'feature',
        content: '',
        contact: ''
    },

    setType(e) { this.setData({ feedbackType: e.currentTarget.dataset.t }) },
    onContentInput(e) { this.setData({ content: e.detail.value }) },
    onContactInput(e) { this.setData({ contact: e.detail.value }) },

    submitFeedback() {
        if (!this.data.content.trim()) {
            wx.showToast({ title: '请输入反馈内容', icon: 'none' })
            return
        }

        // 本地存储反馈（后续可接入云开发）
        const feedbacks = wx.getStorageSync('feedbacks') || []
        feedbacks.push({
            type: this.data.feedbackType,
            content: this.data.content,
            contact: this.data.contact,
            time: new Date().toISOString()
        })
        wx.setStorageSync('feedbacks', feedbacks)

        wx.showToast({ title: '感谢您的反馈！', icon: 'success' })
        setTimeout(() => { wx.navigateBack() }, 1500)
    }
})

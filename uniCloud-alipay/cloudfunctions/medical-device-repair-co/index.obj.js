module.exports = {
	_before: function() {
		const clientInfo = this.getClientInfo()
		const uid = clientInfo && clientInfo.uid
		if (!uid) {
			return { code: 2, message: '请先登录' }
		}
		this.uid = uid
	},

	async submitRepair(data) {
		const db = uniCloud.database()
		const { device_id, request_date, requester, phone, fault_description, urgency, remark } = data
		console.log('submitRepair received:', JSON.stringify({ device_id, fault_description }))

		if (!device_id || !fault_description) {
			return { code: 1, message: '设备和故障描述不能为空' }
		}

		try {
			const deviceRes = await db.collection('medical-device').doc(device_id).field({ status: true, name: true }).get()
			const deviceArr = deviceRes.result && deviceRes.result.data
			const device = deviceArr && deviceArr[0]
			if (!device) {
				return { code: 1, message: '设备不存在' }
			}
			if (device.status === 3) {
				return { code: 1, message: '该设备已在维修中，无需重复报修' }
			}

			const previousStatus = device.status
			const now = Date.now()

			const addRes = await db.collection('medical-device-repair-request').add({
				device_id,
				request_date: request_date || now,
				requester: requester || '',
				phone: phone || '',
				fault_description,
				urgency: urgency || 1,
				remark: remark || '',
				status: 1,
				deleted: 0,
				creator: this.uid,
				created_at: now
			})

			await db.collection('medical-device').doc(device_id).update({
				previous_status: previousStatus,
				status: 3,
				updated_at: now,
				updater: this.uid
			})

			return {
				code: 0,
				message: '报修提交成功',
				data: { id: addRes.id, previous_status: previousStatus }
			}
		} catch (e) {
			console.error('submitRepair error:', e.message)
			return { code: 1, message: e.message || '提交失败' }
		}
	}
}

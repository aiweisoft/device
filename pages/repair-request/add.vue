<template>
	<view class="page">
		<uni-forms ref="form" :modelValue="formData" :rules="rules">
			<uni-forms-item label="关联设备" name="device_id">
				<uni-combox v-model="deviceText" :candidates="deviceCandidates" placeholder="搜索或选择设备" @input="onDeviceInput" />
			</uni-forms-item>
			<uni-forms-item label="报修日期" name="request_date">
				<uni-datetime-picker v-model="formData.request_date" return-type="timestamp" placeholder="请选择报修日期" />
			</uni-forms-item>
			<uni-forms-item label="报修人" name="requester">
				<uni-easyinput v-model="formData.requester" placeholder="请输入报修人" />
			</uni-forms-item>
			<uni-forms-item label="联系电话" name="phone">
				<uni-easyinput v-model="formData.phone" placeholder="请输入联系电话" type="number" />
			</uni-forms-item>
			<uni-forms-item label="故障描述" name="fault_description">
				<uni-easyinput type="textarea" v-model="formData.fault_description" placeholder="请描述设备故障现象" />
			</uni-forms-item>
			<uni-forms-item label="紧急程度" name="urgency">
				<uni-data-select v-model="formData.urgency" :localdata="urgencyOptions" placeholder="请选择紧急程度" />
			</uni-forms-item>
			<uni-forms-item label="备注">
				<uni-easyinput type="textarea" v-model="formData.remark" placeholder="其他说明（选填）" />
			</uni-forms-item>
		</uni-forms>
		<view class="submit-bar">
			<button class="btn-submit" @click="submit" :loading="submitting">提交报修</button>
		</view>
	</view>
</template>

<script>
const db = uniCloud.database()
const dbCmd = db.command
export default {
	data() {
		return {
			formData: {
				device_id: '',
				request_date: Date.now(),
				requester: '',
				phone: '',
				fault_description: '',
				urgency: 1,
				remark: ''
			},
			deviceCandidates: [],
			deviceOptionMap: {},
			deviceText: '',
			urgencyOptions: [
				{ value: 1, text: '一般' },
				{ value: 2, text: '紧急' },
				{ value: 3, text: '非常紧急' }
			],
			submitting: false,
			rules: {
				device_id: { rules: [{ required: true, errorMessage: '请选择设备' }] },
				fault_description: { rules: [{ required: true, errorMessage: '请描述故障现象' }] },
				phone: { rules: [{ pattern: /^1\d{10}$/, errorMessage: '请输入正确的手机号' }] }
			}
		}
	},
	onLoad(e) {
		this.loadDevices()
		if (e.device_id) {
			this.loadDeviceById(e.device_id)
		}
	},
	methods: {
		async loadDevices() {
			try {
				const res = await db.collection('medical-device').where({
					deleted: 0,
					status: dbCmd.neq(3)
				}).field('_id,name,code').get()
				const map = {}
				const candidates = (res.result.data || []).map(d => {
					const text = d.name + ' (' + d.code + ')'
					map[text] = d._id
					return text
				})
				this.deviceOptionMap = map
				this.deviceCandidates = candidates
			} catch (e) { console.error(e) }
		},
		async loadDeviceById(id) {
			try {
				const res = await db.collection('medical-device').doc(id).field('_id,name,code').get()
				const device = res.result.data && res.result.data[0]
				if (device) {
					const text = device.name + ' (' + device.code + ')'
					this.deviceText = text
					this.formData.device_id = device._id
				}
			} catch (e) { console.error(e) }
		},
		onDeviceInput(val) {
			this.formData.device_id = this.deviceOptionMap[val] || ''
		},
		async submit() {
			this.$refs.form.validate().then(async () => {
				this.submitting = true
				try {
					const deviceRes = await db.collection('medical-device').doc(this.formData.device_id).field('status').get()
					const currentStatus = deviceRes.result.data[0]?.status || 1
					await db.collection('medical-device-repair-request').add({
						...this.formData,
						deleted: 0
					})
					await db.collection('medical-device').doc(this.formData.device_id).update({
						previous_status: currentStatus,
						status: 3,
						updated_at: Date.now()
					})
					uni.showToast({ title: '报修提交成功', icon: 'success' })
					setTimeout(() => uni.navigateBack(), 1500)
				} catch (e) {
					console.error(e)
					uni.showToast({ title: e.message || '提交失败', icon: 'none' })
				} finally {
					this.submitting = false
				}
			}).catch(() => {})
		}
	}
}
</script>

<style lang="scss" scoped>
.page { background: #f5f5f7; min-height: 100vh; padding: 20rpx; }
.uni-forms { background: #fff; border-radius: 16rpx; padding: 30rpx; }
.submit-bar { padding: 40rpx 0; }
.btn-submit { background: #6366f1; color: #fff; border: none; border-radius: 12rpx; padding: 24rpx; font-size: 30rpx; }
</style>
